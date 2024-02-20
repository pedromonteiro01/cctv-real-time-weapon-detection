import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime, timedelta
import torch
import base64
import cv2
from uvicorn.protocols.utils import ClientDisconnected

model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/best.pt')

class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.cap = cv2.VideoCapture('base/sample3.mp4')
        await self.accept()
        self.time_task = asyncio.create_task(self.send_time_updates())
        self.video_task = asyncio.create_task(self.stream_video())

    async def disconnect(self, close_code):
        # Cleanup on disconnect
        self.time_task.cancel()
        self.video_task.cancel()
        self.cap.release()

    async def send_time_updates(self):
        camera_info = {
            'id': '123',
            'location': 'Main Entrance',
            'day': datetime.now().strftime('%d/%m/%Y'),
            'hour': datetime.now().strftime('%H:%M:%S')
        }
        while True:
            now = datetime.now()
            camera_info['day'] = now.strftime('%d/%m/%Y')
            camera_info['hour'] = now.strftime('%H:%M:%S')
            try:
                await self.send(text_data=json.dumps({
                    'type': 'time_update',
                    **camera_info,
                }))
                await asyncio.sleep(1)  # Adjust as needed for your timing requirements
            except Exception as e:
                print(f"Error sending time update: {e}")
                break

    async def stream_video(self):
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
                        **camera_info
                    }))                    
                    last_alert_time = current_time
                    break

            annotated_frame = results.render()[0]
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            try:
                await self.send(text_data=json.dumps({
                    'frame': frame_base64,
                    **camera_info
                }))
                # Yield control back to the event loop to allow other tasks to run
                await asyncio.sleep(0)
            except ClientDisconnected:
                print("Client disconnected, stopping video stream.")
                break
            
        cap.release()


class CameraInfoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        asyncio.create_task(self.send_camera_info())

    async def disconnect(self, close_code):
        pass

    async def send_camera_info(self):
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
            
            await asyncio.sleep(1)

CAMERA_SOURCES = [
    {"id": "1", "video_path": "base/sample.mp4", "location": "Entrance"},
    {"id": "2", "video_path": "base/sample3.mp4", "location": "Lobby"},
    {"id": "3", "video_path": "base/sample.mp4", "location": "Parking Lot"},
    {"id": "4", "video_path": "base/sample3.mp4", "location": "Hallway 1"},
    {"id": "5", "video_path": "base/sample.mp4", "location": "Hallway 2"},
    {"id": "6", "video_path": "base/sample3.mp4", "location": "Office 1"},
]

class MultiCameraStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.stream_tasks = []
        for camera in CAMERA_SOURCES:
            camera_id = camera["id"]
            video_path = camera["video_path"]
            task = asyncio.create_task(self.stream_video(camera))
            self.stream_tasks.append(task)

    async def disconnect(self, close_code):
        # Cancel all streaming tasks on disconnect
        for task in self.stream_tasks:
            task.cancel()

    async def stream_video(self, camera):
        cap = cv2.VideoCapture(camera["video_path"])
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            try:
                await self.send(text_data=json.dumps({
                    'camera_id': camera["id"],
                    'location': camera["location"],
                    'day': datetime.now().strftime('%d/%m/%Y'),
                    'hour': datetime.now().strftime('%H:%M:%S'),
                    'frame': frame_base64,
                }))
                await asyncio.sleep(0)  # Adjust as needed
            except Exception as e:
                print(f"Error sending frame for camera {camera['id']}: {e}")
                break
            
        cap.release()
