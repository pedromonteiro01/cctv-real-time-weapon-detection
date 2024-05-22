import asyncio
from collections import deque
import json
import aio_pika
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime
import torch
import base64
import cv2
from uvicorn.protocols.utils import ClientDisconnected
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from aio_pika import connect_robust, IncomingMessage
import numpy as np
import tempfile
import os
from django.core.files import File
import uuid
from asgiref.sync import sync_to_async
from concurrent.futures import ThreadPoolExecutor

from torch.nn.parallel import DataParallel

device = "cuda" if torch.cuda.is_available() else "cpu"
print("\n\n device \n\n ", device)

# Load the model and wrap it with DataParallel if multiple GPUs are available
model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/best.pt').to(device)
if torch.cuda.device_count() > 1:
    print(f"Using {torch.cuda.device_count()} GPUs!")
    model = DataParallel(model)

executor = ThreadPoolExecutor(max_workers=4)

class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.camera_details = await self.get_camera_details(self.camera_id)
        self.rabbitmq_task = None
        self.frame_count = 0
        self.nth_frame = 10  # Adjust this value as needed

        if self.camera_details:
            await self.accept()
            self.connection_open = True
            self.connection_closed = False
            self.connection = await self.create_rabbitmq_connection()
            self.frame_buffer = deque(maxlen=100)
            self.processing_frame = False
            self.rabbitmq_task = asyncio.create_task(self.listen_to_rabbitmq(self.camera_id))
        else:
            await self.close(code=4404)

    async def create_rabbitmq_connection(self):
        rabbitmq_server = 'localhost'
        rabbitmq_username = 'user'
        rabbitmq_password = 'password'
        connection = await connect_robust(
            f"amqp://{rabbitmq_username}:{rabbitmq_password}@{rabbitmq_server}:5673/"
        )
        return connection

    async def listen_to_rabbitmq(self, camera_id):
        async with self.connection:
            channel = await self.connection.channel()
            await channel.set_qos(prefetch_count=10)
            exchange_name = 'camera_exchange'
            queue_name = f"camera_stream_{camera_id}"

            await channel.declare_exchange(exchange_name, aio_pika.ExchangeType.DIRECT)
            queue = await channel.declare_queue(queue_name, durable=True)
            await queue.bind(exchange_name, routing_key=queue_name)

            async for message in queue:
                async with message.process():
                    frame_data = base64.b64decode(json.loads(message.body.decode())['frame'])
                    frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
                    self.frame_buffer.append(frame)
                    self.frame_count += 1
                    asyncio.create_task(self.process_next_frame())

    async def process_next_frame(self):
        if self.frame_buffer and not self.processing_frame:
            self.processing_frame = True
            frames_to_process = []

            while self.frame_buffer and len(frames_to_process) < 10:  # Process up to 10 frames at a time
                frames_to_process.append(self.frame_buffer.popleft())

            if frames_to_process:
                detections_list, annotated_frames = await self.process_frames_with_yolo(frames_to_process)

                for detections, annotated_frame in zip(detections_list, annotated_frames):
                    _, buffer = cv2.imencode('.jpg', annotated_frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    await self.send_frame_to_websocket(detections, frame_base64)

            self.processing_frame = False
            if self.frame_buffer:
                asyncio.create_task(self.process_next_frame())

    async def send_frame_to_websocket(self, detections, frame_base64):
        timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')  # ISO 8601 format
        try:
            await self.send(text_data=json.dumps({
                'camera_id': self.camera_details['id'],
                'location': self.camera_details['location'],
                'timestamp': timestamp,
                'frame': frame_base64,
                'detections': detections,
                'detection_id': str(uuid.uuid4())  # Generate a unique detection ID
            }))
        except Exception as e:
            print(f"Error sending frame to websocket: {e}")
        finally:
            torch.cuda.empty_cache()

    async def process_frames_with_yolo(self, frames):
        loop = asyncio.get_event_loop()
        results = []
        for i, frame in enumerate(frames):
            if self.frame_count % self.nth_frame == 0:
                result = await loop.run_in_executor(executor, model, frame)
            else:
                result = None
            results.append(result)
        detections_list = []
        annotated_frames = []

        for frame, result in zip(frames, results):
            detections = []
            if result:
                for *xyxy, conf, cls in result.xyxy[0]:
                    label = model.module.names[int(cls)] if torch.cuda.device_count() > 1 else model.names[int(cls)]
                    bbox = [float(coord) for coord in xyxy]
                    confidence = float(conf)
                    detections.append({
                        "label": label,
                        "confidence": confidence,
                        "bbox": bbox
                    })
                annotated_frame = result.render()[0]
            else:
                annotated_frame = frame

            detections_list.append(detections)
            annotated_frames.append(annotated_frame)

        if torch.cuda.memory_reserved() > 0.8 * torch.cuda.get_device_properties(0).total_memory:
            torch.cuda.empty_cache()

        return detections_list, annotated_frames

    @database_sync_to_async
    def get_camera_details(self, camera_id):
        from .models import Camera
        try:
            camera = Camera.objects.values('id', 'location').get(id=camera_id)
            return {'id': camera['id'], 'location': camera['location']}
        except Camera.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        if self.rabbitmq_task:
            self.rabbitmq_task.cancel()
            try:
                await self.rabbitmq_task
            except asyncio.CancelledError:
                pass
        if hasattr(self, 'connection') and self.connection:
            await self.connection.close()
        self.connection_open = False
        self.connection_closed = True

class MultiCameraStreamConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.camera_timestamps = {}
        self.rabbitmq_tasks = []
        self.frame_count = 0
        self.nth_frame = 10  # Adjust this value as needed

    async def connect(self):
        authToken = self.scope['url_route']['kwargs']['token']
        self.user = await self.get_user(authToken)

        if not self.user:
            await self.close(code=4403)
        else:
            await self.accept()
            self.cameras = await self.get_user_cameras()
            self.connection = await self.create_rabbitmq_connection()
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)
            self.rabbitmq_tasks = [asyncio.create_task(self.listen_to_rabbitmq(camera)) for camera in self.cameras]

    async def listen_to_rabbitmq(self, camera):
        exchange_name = 'camera_exchange'
        queue_name = f"camera_stream_{camera['id']}"

        await self.channel.declare_exchange(exchange_name, aio_pika.ExchangeType.DIRECT)
        queue = await self.channel.declare_queue(queue_name, durable=True)
        await queue.bind(exchange_name, routing_key=queue_name)

        async for message in queue:
            asyncio.create_task(self.handle_message(message, camera))

    async def handle_message(self, message, camera):
        async with message.process():
            frame_data = base64.b64decode(json.loads(message.body.decode())['frame'])
            frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
            self.frame_count += 1
            if self.frame_count % self.nth_frame == 0:
                detections, annotated_frame = await self.process_frame_with_yolo(frame)
            else:
                detections = []
                annotated_frame = frame
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await self.send_frame_to_websocket(detections, frame_base64, camera)

    async def send_frame_to_websocket(self, detections, frame_base64, camera):
        timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        self.camera_timestamps[camera["id"]] = timestamp

        try:
            await self.send(text_data=json.dumps({
                'camera_id': camera["id"],
                'location': camera["location"],
                'timestamp': timestamp,
                'frame': frame_base64,
                'detections': detections,
                'detection_id': str(uuid.uuid4())
            }))
        except Exception as e:
            print(f"Error sending frame to websocket: {e}")
        finally:
            torch.cuda.empty_cache()

    async def disconnect(self, close_code):
        for task in self.rabbitmq_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        if hasattr(self, 'connection') and self.connection:
            await self.connection.close()

    async def process_frame_with_yolo(self, frame):
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, model, frame)
        detections = []
        if result:
            for *xyxy, conf, cls in result.xyxy[0]:
                label = model.module.names[int(cls)] if torch.cuda.device_count() > 1 else model.names[int(cls)]
                bbox = [float(coord) for coord in xyxy]
                confidence = float(conf)
                detections.append({
                    "label": label,
                    "confidence": confidence,
                    "bbox": bbox
                })
            annotated_frame = result.render()[0]
        else:
            annotated_frame = frame

        if torch.cuda.memory_reserved() > 0.8 * torch.cuda.get_device_properties(0).total_memory:
            torch.cuda.empty_cache()

        return detections, annotated_frame

    @database_sync_to_async
    def get_user(self, token_key):
        from rest_framework.authtoken.models import Token
        try:
            return Token.objects.get(key=token_key).user
        except Token.DoesNotExist:
            return None

    @sync_to_async
    def get_user_cameras(self):
        from base.models import Camera
        cameras = Camera.objects.filter(user=self.user).values('id', 'location', 'video_path')
        return list(cameras)

    async def create_rabbitmq_connection(self):
        rabbitmq_server = 'localhost'
        rabbitmq_username = 'user'
        rabbitmq_password = 'password'
        connection = await connect_robust(
            f"amqp://{rabbitmq_username}:{rabbitmq_password}@{rabbitmq_server}:5673/"
        )
        return connection

class UploadedVideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.uploaded_video_id = self.scope['url_route']['kwargs']['videoUploadId']
        self.uploaded_video_details = await self.get_uploaded_video_details(self.uploaded_video_id)
        self.connection_open = True

        if self.uploaded_video_details:
            await self.accept()
            asyncio.get_event_loop().create_task(self.stream_video_analysis(self.uploaded_video_id))
        else:
            await self.close(code=4404)

    async def stream_video_analysis(self, uploaded_video_id):
        try:
            video_details = await self.get_uploaded_video_details(uploaded_video_id)
            video_path = video_details['video_path']
            total_duration = self.get_video_duration(video_path)
            print(f"Total video duration: {total_duration} seconds")
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            if not cap.isOpened():
                print("Error: Unable to open video source.")
                return

            height, width = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)), int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))

            # Define the codec and create VideoWriter object with dynamic dimensions
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            temp_file_path = os.path.join(tempfile.gettempdir(), f"{uploaded_video_id}_processed.mp4")
            out = cv2.VideoWriter(temp_file_path, fourcc, fps, (width, height))

            frame_count = 0
            nth_frame = int(fps)  # Analyze one frame per second

            while cap.isOpened() and self.connection_open:
                ret, frame = cap.read()
                if not ret:
                    break

                timestamp = frame_count / fps
                analyze_frame = (frame_count % nth_frame == 0)

                if analyze_frame:
                    detections, annotated_frame = await self.process_frame_with_yolo(frame)
                    await self.send_detections_and_frame(uploaded_video_id, detections, annotated_frame, timestamp)
                else:
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    await self.send_safe(text_data=json.dumps({
                        'videoUploadId': uploaded_video_id,
                        'frame': frame_base64,
                    }))
                
                out.write(frame)
                frame_count += 1
                await asyncio.sleep(1 / fps)  # Control the processing speed

            cap.release()
            out.release()
            if self.connection_open:
                await self.save_processed_video(uploaded_video_id, temp_file_path)
                await self.mark_video_as_analyzed(uploaded_video_id)
                await self.send_safe(text_data=json.dumps({
                    'videoUploadId': uploaded_video_id,
                    'status': 'completed',
                    'analyzed': True
                }))
        except Exception as e:
            print(f"Error during video analysis: {e}")

    async def process_frame_with_yolo(self, frame):
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, model, frame)
        detections = []
        if result:
            for *xyxy, conf, cls in result.xyxy[0]:
                label = model.module.names[int(cls)] if torch.cuda.device_count() > 1 else model.names[int(cls)]
                bbox = [float(coord) for coord in xyxy]
                confidence = float(conf)
                detections.append({
                    "label": label,
                    "confidence": confidence,
                    "bbox": bbox
                })
            annotated_frame = result.render()[0]
        else:
            annotated_frame = frame

        if torch.cuda.memory_reserved() > 0.8 * torch.cuda.get_device_properties(0).total_memory:
            torch.cuda.empty_cache()

        return detections, annotated_frame

    async def send_detections_and_frame(self, uploaded_video_id, detections, frame, timestamp):
        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        for det in detections:
            det['timestamp'] = timestamp

        await self.send_safe(text_data=json.dumps({
            'videoUploadId': uploaded_video_id,
            'detections': detections,
            'frame': frame_base64,
        }))

    async def send_safe(self, text_data=None, bytes_data=None):
        if self.connection_open:
            try:
                await self.send(text_data=text_data, bytes_data=bytes_data)
            except RuntimeError as e:
                print(f"Failed to send message: {e}")

    def get_video_duration(self, video_path):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("Error: Unable to open video file.")
            return 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration_seconds = total_frames / fps if fps else 0
        cap.release()
        return duration_seconds

    @database_sync_to_async
    def mark_video_as_analyzed(self, uploaded_video_id):
        try:
            from .models import UploadedVideo
            uploaded_video = UploadedVideo.objects.get(id=uploaded_video_id)
            uploaded_video.analyzed = True
            uploaded_video.save()
            print(f"Video {uploaded_video_id} marked as analyzed.")
        except UploadedVideo.DoesNotExist:
            print(f"Uploaded video with ID {uploaded_video_id} not found.")

    @database_sync_to_async
    def save_processed_video(self, uploaded_video_id, video_path):
        try:
            from .models import UploadedVideo
            uploaded_video = UploadedVideo.objects.get(id=uploaded_video_id)
            with open(video_path, 'rb') as f:
                uploaded_video.processed_video.save(f"{uploaded_video_id}_processed.mp4", File(f))
            os.remove(video_path)
            print(f"Processed video for {uploaded_video_id} saved successfully.")
        except UploadedVideo.DoesNotExist:
            print(f"Uploaded video with ID {uploaded_video_id} not found.")

    @database_sync_to_async
    def get_uploaded_video_details(self, uploaded_video_id):
        try:
            from .models import UploadedVideo
            uploaded_video = UploadedVideo.objects.get(id=uploaded_video_id)
            return {
                'id': uploaded_video.id,
                'video_path': uploaded_video.video.path if uploaded_video.video else None
            }
        except UploadedVideo.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        self.connection_open = False
        print(f"WebSocket disconnected with close code: {close_code}")

