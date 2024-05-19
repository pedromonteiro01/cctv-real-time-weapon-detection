import asyncio
from collections import deque
import json
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

from torch.nn.parallel import DataParallel

device = "cuda" if torch.cuda.is_available() else "cpu"
print("\n\n device \n\n ", device)

# Load the model and wrap it with DataParallel if multiple GPUs are available
model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/best.pt').to(device)
if torch.cuda.device_count() > 1:
    print(f"Using {torch.cuda.device_count()} GPUs!")
    model = DataParallel(model)

class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.camera_details = await self.get_camera_details(self.camera_id)

        if self.camera_details:
            await self.accept()
            self.connection_open = True
            self.connection = await self.create_rabbitmq_connection()
            self.frame_buffer = deque(maxlen=10)
            asyncio.create_task(self.listen_to_rabbitmq(self.camera_id))
        else:
            await self.close(code=4404)

    async def create_rabbitmq_connection(self):
        rabbitmq_server = 'localhost'
        rabbitmq_username = 'user'
        rabbitmq_password = 'password'
        return await connect_robust(
            f"amqp://{rabbitmq_username}:{rabbitmq_password}@{rabbitmq_server}/"
        )

    async def listen_to_rabbitmq(self, camera_id):
        async with self.connection:
            channel = await self.connection.channel()
            queue_name = f"camera_stream_{camera_id}"
            queue = await channel.declare_queue(queue_name, durable=True)

            async for message in queue:
                async with message.process():
                    if not self.processing_frame:
                        self.processing_frame = True
                        frame_data = base64.b64decode(json.loads(message.body.decode())['frame'])
                        frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
                        self.frame_buffer.append(frame)
                        await self.process_next_frame()

    async def process_next_frame(self):
        if self.frame_buffer and not self.connection_closed:
            frame = self.frame_buffer.popleft()
            detections, annotated_frame = await self.process_frame_with_yolo(frame)
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            await self.send_frame_to_websocket(detections, frame_base64)
            self.processing_frame = False
            # Trigger processing next frame if buffer is not empty
            if self.frame_buffer:
                await self.process_next_frame()

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

    async def process_frame_with_yolo(self, frame):
        results = model(frame)
        detections = []
        for *xyxy, conf, cls in results.xyxy[0]:
            label = model.module.names[int(cls)] if torch.cuda.device_count() > 1 else model.names[int(cls)]
            bbox = [float(coord) for coord in xyxy]
            confidence = float(conf)
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": bbox
            })
        annotated_frame = results.render()[0]

        if torch.cuda.memory_reserved() > 0.8 * torch.cuda.get_device_properties(0).total_memory:
            torch.cuda.empty_cache()

        return detections, annotated_frame

    @database_sync_to_async
    def get_camera_details(self, camera_id):
        from .models import Camera
        try:
            camera = Camera.objects.values('id', 'location').get(id=camera_id)
            return {'id': camera['id'], 'location': camera['location']}
        except Camera.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        if hasattr(self, 'connection') and self.connection:
            await self.connection.close()
        self.connection_open = False

class MultiCameraStreamConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.camera_timestamps = {}

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
            await asyncio.gather(*[self.listen_to_rabbitmq(camera) for camera in self.cameras])

    async def listen_to_rabbitmq(self, camera):
        queue_name = f"camera_stream_{camera['id']}"
        queue = await self.channel.declare_queue(queue_name, durable=True)
        
        async for message in queue:
            await self.handle_message(message, camera)

    async def handle_message(self, message, camera):
        async with message.process():
            frame_data = base64.b64decode(json.loads(message.body.decode())['frame'])
            frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
            detections, annotated_frame = await self.process_frame_with_yolo(frame)

            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await self.send_frame_to_websocket(detections, frame_base64, camera)

    async def send_frame_to_websocket(self, detections, frame_base64, camera):
        timestamp = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%fZ')  # ISO 8601 format
        self.camera_timestamps[camera["id"]] = timestamp

        try:
            await self.send(text_data=json.dumps({
                'camera_id': camera["id"],
                'location': camera["location"],
                'timestamp': timestamp,
                'frame': frame_base64,
                'detections': detections,
                'detection_id': str(uuid.uuid4())  # Generate a unique detection ID
            }))
        except Exception as e:
            print(f"Error sending frame to websocket: {e}")
        finally:
            torch.cuda.empty_cache()

    async def disconnect(self, close_code):
        await self.connection.close()

    async def process_frame_with_yolo(self, frame):
        results = model(frame)
        detections = []
        for *xyxy, conf, cls in results.xyxy[0]:
            label = model.module.names[int(cls)] if torch.cuda.device_count() > 1 else model.names[int(cls)]
            bbox = [float(coord) for coord in xyxy]
            confidence = float(conf)
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": bbox
            })
        annotated_frame = results.render()[0]

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
        return await connect_robust(
            f"amqp://{rabbitmq_username}:{rabbitmq_password}@{rabbitmq_server}/"
        )
    
class UploadedVideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.uploaded_video_id = self.scope['url_route']['kwargs']['videoUploadId']
        self.uploaded_video_details = await self.get_uploaded_video_details(self.uploaded_video_id)

        if self.uploaded_video_details:
            await self.accept()
            asyncio.get_event_loop().create_task(self.stream_video_analysis(self.uploaded_video_id))
        else:
            await self.close(code=4404)

    async def stream_video_analysis(self, uploaded_video_id):
        video_details = await self.get_uploaded_video_details(uploaded_video_id)

        video_path = video_details['video_path']
        total_duration = self.get_video_duration(video_path)
        print(f"Total video duration: {total_duration} seconds")
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)

        if not cap.isOpened():
            print("Error: Unable to open video source.")
            return

        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to read video frame.")
            cap.release()
            return

        height, width = frame.shape[:2]

        # Define the codec and create VideoWriter object with dynamic dimensions
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        temp_file_path = os.path.join(tempfile.gettempdir(), f"{uploaded_video_id}_processed.mp4")
        out = cv2.VideoWriter(temp_file_path, fourcc, fps, (width, height))

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = frame_count / fps
            frame_count += 1
            print(f"Frame count: {frame_count}, Timestamp: {timestamp:.2f}s")
            
            detections, annotated_frame = await self.process_frame_with_yolo(frame)
            out.write(annotated_frame)

            for det in detections:
                det['timestamp'] = timestamp

            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await self.send(text_data=json.dumps({
                'videoUploadId': uploaded_video_id,
                'detections': detections,
                'frame': frame_base64,
            }))
            await asyncio.sleep(1 / fps)

        cap.release()
        out.release()
        await self.save_processed_video(uploaded_video_id, temp_file_path)
        await self.mark_video_as_analyzed(uploaded_video_id)
        await self.send(text_data=json.dumps({
            'videoUploadId': uploaded_video_id,
            'status': 'completed',
            'analyzed': True
        }))

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

    async def process_frame_with_yolo(self, frame):
        results = model(frame)
        detections = []
        for *xyxy, conf, cls in results.xyxy[0]:
            label = model.module.names[int(cls)] if torch.cuda.device_count() > 1 else model.names[int(cls)]
            bbox = [float(coord) for coord in xyxy]
            confidence = float(conf)
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": bbox
            })
        annotated_frame = results.render()[0]

        if torch.cuda.memory_reserved() > 0.8 * torch.cuda.get_device_properties(0).total_memory:
            torch.cuda.empty_cache()

        return detections, annotated_frame

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
