import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import aiofiles 
from datetime import datetime, timedelta
import subprocess
import torch
import os
import base64
import cv2
import json
from uvicorn.protocols.utils import ClientDisconnected

model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/best.pt')

class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.cap = cv2.VideoCapture('base/sample3.mp4')  # Initialize video capture here
        await self.accept()
        # Starting both tasks
        self.time_task = asyncio.create_task(self.send_time_updates())
        self.video_task = asyncio.create_task(self.stream_video())

    async def disconnect(self, close_code):
        # Cleanup on disconnect
        self.time_task.cancel()
        self.video_task.cancel()
        self.cap.release()

    async def send_time_updates(self):
        while True:
            now = datetime.now()
            hour = now.strftime('%H:%M:%S')
            day = now.strftime('%Y-%m-%d')
            try:
                await self.send(text_data=json.dumps({
                    'type': 'time_update',
                    'day': day,
                    'hour': hour,
                }))
                await asyncio.sleep(1)  # Send time update every second
            except Exception as e:
                print(f"Error sending time update: {e}")
                break

    async def stream_video(self):
        # Example static camera information
        camera_info = {
            'id': '123',
            'location': 'Main Entrance',
            'day': datetime.now().strftime('%d/%m/%Y'),
            'hour': datetime.now().strftime('%H:%M:%S')
        }

        global model         
        cap = cv2.VideoCapture('base/sample3.mp4')
        last_alert_time = datetime.min
        alert_interval = timedelta(seconds=20)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame)
            current_time = datetime.now()

            for det in results.xyxy[0]:
                if det[-1] == 0 and current_time - last_alert_time >= alert_interval:
                    await self.send(text_data=json.dumps({
                        'type': 'warning',
                        'message': 'Weapon detected!',
                        **camera_info  # Include camera info in the warning message
                    }))                    
                    last_alert_time = current_time
                    break

            annotated_frame = results.render()[0]
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            try:
                await self.send(text_data=json.dumps({
                    'frame': frame_base64,
                    **camera_info  # Send camera info with each frame
                }))
            except ClientDisconnected:
                print("Client disconnected, stopping video stream.")
                break
            
        cap.release()

class CameraInfoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        # Schedule the send_camera_info task to run immediately upon connection
        asyncio.create_task(self.send_camera_info())

    async def disconnect(self, close_code):
        # Handle WebSocket disconnection here if necessary
        pass

    async def send_camera_info(self):
        # Hardcoded camera information
        cameras = [
            {"id": "1", "location": "Hall"},
            {"id": "2", "location": "Library"},
            {"id": "3", "location": "Main Entrance"},
            {"id": "4", "location": "Parking Lot"},
            {"id": "5", "location": "Cafeteria"},
            {"id": "6", "location": "Gym"},
        ]

        while True:
            current_day = datetime.now().strftime('%d/%m/%Y')
            current_hour = datetime.now().strftime('%H:%M:%S')

            for camera in cameras:
                camera["current_day"] = current_day
                camera["current_hour"] = current_hour

            await self.send(text_data=json.dumps({"cameras": cameras}))
            
            # Wait before sending the next update
            # Adjust the sleep time as needed
            await asyncio.sleep(1)
