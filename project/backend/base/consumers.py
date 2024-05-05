import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime, timedelta
import torch
import base64
import cv2
from uvicorn.protocols.utils import ClientDisconnected
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from aio_pika import connect_robust
import pika
from asgiref.sync import sync_to_async
import threading
from channels.db import database_sync_to_async
import numpy as np
import tempfile
import os
from django.core.files import File
import subprocess

device = "cuda" if torch.cuda.is_available() else "cpu"
print("\n\n device \n\n ", device)
model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/best3.pt').to(device)
 
class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.camera_details = await self.get_camera_details(self.camera_id)

        if self.camera_details:
            await self.accept()
            self.connection_open = True
            self.connection = await self.create_rabbitmq_connection()
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
                    frame_data = base64.b64decode(json.loads(message.body.decode())['frame'])
                    frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)

                    detections, annotated_frame = self.process_frame_with_yolo(frame)

                    _, buffer = cv2.imencode('.jpg', annotated_frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')

                    await self.send_frame_to_websocket(detections, frame_base64, camera_id)

    async def send_frame_to_websocket(self, detections, frame_base64, camera_id):
        if self.camera_details and self.connection_open:
            try:
                await self.send(text_data=json.dumps({
                    'camera_id': self.camera_details['id'],
                    'location': self.camera_details['location'],
                    'day': datetime.now().strftime('%d/%m/%Y'),
                    'hour': datetime.now().strftime('%H:%M:%S'),
                    'detections': detections,
                    'frame': frame_base64,
                }))
            except Exception as e:
                print(f"Error sending frame to websocket: {e}")
            finally:
                # release GPU memory after sending frame
                torch.cuda.empty_cache()

    def resize_frame(self, frame, size=640):
        h, w, _ = frame.shape
        scale = size / max(h, w)
        nh, nw = int(h * scale), int(w * scale)
        frame_resized = cv2.resize(frame, (nw, nh))

        new_frame = np.full((size, size, 3), 128, dtype=np.uint8)
        new_frame[(size - nh) // 2:(size - nh) // 2 + nh, (size - nw) // 2:(size - nw) // 2 + nw] = frame_resized
        return new_frame

    def process_frame_with_yolo(self, frame):
        frame_resized = self.resize_frame(frame)
        frame_tensor = torch.from_numpy(frame_resized).permute(2, 0, 1).float().div(255.0).unsqueeze(0).to(device)

        results = model(frame_tensor)

        confidence_threshold = 0.25
        mask = results[:, :, 4] > confidence_threshold
        filtered_results = results[mask]

        parsed_detections = []
        for result in filtered_results:
            x_center, y_center, width, height, conf, *class_probs = result
            class_probs_tensor = torch.tensor(class_probs)
            class_id = torch.argmax(class_probs_tensor)
            class_name = model.names[class_id.item()]

            x1 = (x_center - width / 2).item()
            y1 = (y_center - height / 2).item()
            x2 = (x_center + width / 2).item()
            y2 = (y_center + height / 2).item()

            parsed_detections.append({
                "label": class_name,
                "confidence": conf.item(),
                "bbox": [x1, y1, x2, y2]
            })

        annotated_frame = self.draw_boxes(frame_resized, parsed_detections)
        return parsed_detections, annotated_frame
    
    def draw_boxes(self, image, detections):
        for det in detections:
            bbox = det['bbox']
            cv2.rectangle(image, (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3])), (255, 0, 0), 2)
            cv2.putText(image, f"{det['label']} {det['confidence']:.2f}", (int(bbox[0]), int(bbox[1]-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
        return image

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
        self.stream_threads = []

    async def connect(self):
        authToken = self.scope['url_route']['kwargs']['token']
        self.user = await self.get_user(authToken)
        
        if not self.user:
            await self.close(code=4403)
        else:
            await self.accept()
            self.cameras = await self.get_user_cameras()
            for camera in self.cameras:
                loop = asyncio.get_running_loop()
                thread = threading.Thread(target=self.listen_to_rabbitmq, args=(camera, loop))
                thread.start()
                self.stream_threads.append(thread)
    
    def listen_to_rabbitmq(self, camera, loop):
        rabbitmq_server = 'localhost'
        rabbitmq_username = 'user'
        rabbitmq_password = 'password'
        credentials = pika.PlainCredentials(rabbitmq_username, rabbitmq_password)
        connection_parameters = pika.ConnectionParameters(
            host=rabbitmq_server,
            credentials=credentials
        )
        connection = pika.BlockingConnection(connection_parameters)
        channel = connection.channel()

        queue_name = f"camera_stream_{camera['id']}"
        channel.queue_declare(queue=queue_name, durable=True)

        def callback(ch, method, properties, body):
            frame_data = body.decode('utf-8')
            asyncio.run_coroutine_threadsafe(self.send_frame_to_websocket(frame_data, camera), loop)

        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

        channel.start_consuming()

    async def send_frame_to_websocket(self, frame_data, camera):
        try:
            await self.send(text_data=json.dumps({
                'camera_id': camera["id"],
                'location': camera["location"],
                'day': datetime.now().strftime('%d/%m/%Y'),
                'hour': datetime.now().strftime('%H:%M:%S'),
                'frame': frame_data,
            }))
        except Exception as e:
            pass
    
    async def disconnect(self, close_code):
        for task in self.stream_threads:
            pass

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

        # total_duration = self.get_video_duration_ffprobe(video_path)
        # print(f"Total video duration using ffprobe: {total_duration} seconds")

        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to read video frame.")
            cap.release()
            return

        height, width = frame.shape[:2]

        # Define the codec and create VideoWriter object with dynamic dimensions
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        temp_file_path = os.path.join(tempfile.gettempdir(), f"{uploaded_video_id}_processed.mp4")
        out = cv2.VideoWriter(temp_file_path, fourcc, 20.0, (width, height))


        if not cap.isOpened():
            print("Error: Unable to open video source.")
            return

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            timestamp_msec = cap.get(cv2.CAP_PROP_POS_MSEC)
            timestamp = timestamp_msec / 1000.0 

        
            detections, annotated_frame = self.process_frame_with_yolo(frame)
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
            await asyncio.sleep(0.1)

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
    
    '''
    def get_video_duration_ffprobe(self, video_path):
        """Use ffprobe to get the video duration in seconds."""
        try:
            cmd = ["ffprobe", "-v", "error", "-show_entries", 
                "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            return float(result.stdout.strip())
        except Exception as e:
            print(f"Failed to get video duration with ffprobe: {str(e)}")
            return 0
    '''

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
    
    def resize_frame(self, frame, size=640):
        h, w, _ = frame.shape
        scale = size / max(h, w)
        nh, nw = int(h * scale), int(w * scale)
        frame_resized = cv2.resize(frame, (nw, nh))

        new_frame = np.full((size, size, 3), 128, dtype=np.uint8)
        new_frame[(size - nh) // 2:(size - nh) // 2 + nh, (size - nw) // 2:(size - nw) // 2 + nw] = frame_resized
        return new_frame


    def process_frame_with_yolo(self, frame):
        frame_resized = self.resize_frame(frame)
        frame_tensor = torch.from_numpy(frame_resized).permute(2, 0, 1).float().div(255.0).unsqueeze(0).to(device)

        results = model(frame_tensor)

        confidence_threshold = 0.25
        mask = results[:, :, 4] > confidence_threshold
        results = results[mask]

        parsed_detections = []
        for result in results:
            x_center, y_center, width, height, conf, *class_probs = result
            class_probs_tensor = torch.tensor(class_probs)
            class_id = torch.argmax(class_probs_tensor)
            class_name = model.names[class_id.item()]

            x1 = (x_center - width / 2).item()
            y1 = (y_center - height / 2).item()
            x2 = (x_center + width / 2).item()
            y2 = (y_center + height / 2).item()

            parsed_detections.append({
                "label": class_name,
                "confidence": conf.item(),
                "bbox": [x1, y1, x2, y2]
            })

        annotated_frame = self.draw_boxes(frame_resized, parsed_detections) 

        return parsed_detections, annotated_frame


    def draw_boxes(self, image, detections):
        for det in detections:
            bbox = det['bbox']
            cv2.rectangle(image, (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3])), (255, 0, 0), 2)
            cv2.putText(image, f"{det['label']} {det['confidence']:.2f}", (int(bbox[0]), int(bbox[1]-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
        return image

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
        pass