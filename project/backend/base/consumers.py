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
import pika
from asgiref.sync import sync_to_async
import threading
from channels.db import database_sync_to_async
import numpy as np

model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/best.pt')

class VideoStreamConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.connection_open = False

    async def connect(self):
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.camera_details = await self.get_camera_details(self.camera_id)

        if self.camera_details:
            await self.accept()
            self.connection_open = True
            loop = asyncio.get_running_loop()
            thread = threading.Thread(target=self.listen_to_rabbitmq, args=(self.camera_id, loop))
            thread.start()
        else:
            await self.close(code=4404)

    def listen_to_rabbitmq(self, camera_id, loop):
        rabbitmq_server = 'rabbitmq'
        rabbitmq_username = 'user'
        rabbitmq_password = 'password'
        credentials = pika.PlainCredentials(rabbitmq_username, rabbitmq_password)
        connection_parameters = pika.ConnectionParameters(host=rabbitmq_server, credentials=credentials)
        
        connection = pika.BlockingConnection(connection_parameters)
        channel = connection.channel()

        queue_name = f"camera_stream_{camera_id}"
        channel.queue_declare(queue=queue_name, durable=True)

        def callback(ch, method, properties, body):
            message = json.loads(body)
            frame_data = base64.b64decode(message['frame'])
            frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
            
            detections, annotated_frame = self.process_frame_with_yolo(frame)
            
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            asyncio.run_coroutine_threadsafe(
                self.send_frame_to_websocket(detections, frame_base64, camera_id),
                loop
            )

        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
        channel.start_consuming()

    async def send_frame_to_websocket(self, detections, frame_base64, camera_id):
        camera_details = await self.get_camera_details(camera_id)
        if camera_details:
            if self.connection_open:
                try:
                    await self.send(text_data=json.dumps({
                        'camera_id': camera_details['id'],
                        'location': camera_details['location'],
                        'day': datetime.now().strftime('%d/%m/%Y'),
                        'hour': datetime.now().strftime('%H:%M:%S'),
                        'detections': detections,
                        'frame': frame_base64,
                    }))
                except Exception as e:
                    print(f"Error sending frame to websocket: {e}")

    def process_frame_with_yolo(self, frame):
        results = model(frame)
        detections = []
        for *xyxy, conf, cls in results.xyxy[0]:
            label = model.names[int(cls)]
            bbox = [float(coord) for coord in xyxy]
            confidence = float(conf)
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": bbox
            })
        
        annotated_frame = results.render()[0]
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
        rabbitmq_server = 'rabbitmq'
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
            # Process the video and stream results
            asyncio.get_event_loop().create_task(self.stream_video_analysis(self.uploaded_video_id))
        else:
            await self.close(code=4404)

    async def stream_video_analysis(self, uploaded_video_id):
        video_path = self.uploaded_video_details['video_path']
        # Open the video file
        cap = cv2.VideoCapture(video_path)
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            detections, annotated_frame = self.process_frame_with_yolo(frame)

            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await self.send(text_data=json.dumps({
                'videoUploadId': uploaded_video_id,
                'detections': detections,
                'frame': frame_base64,
            }))
            await asyncio.sleep(0.033)  # Simulate real-time frame rate (about 30 FPS)
        cap.release()

    def process_frame_with_yolo(self, frame):
        results = model(frame)
        detections = []
        for *xyxy, conf, cls in results.xyxy[0]:
            label = model.names[int(cls)]
            bbox = [float(coord) for coord in xyxy]
            confidence = float(conf)
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": bbox
            })

        annotated_frame = results.render()[0]
        return detections, annotated_frame

    @database_sync_to_async
    def get_uploaded_video_details(self, uploaded_video_id):
        from .models import UploadedVideo
        try:
            uploaded_video = UploadedVideo.objects.get(id=uploaded_video_id)
            return {
                'id': uploaded_video.id,
                'video_path': uploaded_video.video.path if uploaded_video.video else None
            }
        except UploadedVideo.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        pass