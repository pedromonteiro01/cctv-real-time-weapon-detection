import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import aiofiles 
from datetime import datetime 
import subprocess
import torch
import os
import base64
import cv2
import json
from uvicorn.protocols.utils import ClientDisconnected

class TextMessageConsumer(AsyncWebsocketConsumer):
    log_file_path = 'websocket_logs.log'

    async def connect(self):
        await self.accept()

        c = 0
        while True:
            message = f'Warning! Message count is at {c}'
            await self.send(json.dumps({
                'type': 'warning',
                'message': message,
            }))
            await self.async_log_message(message)
            c += 1
            await asyncio.sleep(30)  # wait 10 seconds

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def async_log_message(self, message):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"{current_time} - {message}\n"
        async with aiofiles.open(self.log_file_path, mode='a') as log_file:
            await log_file.write(log_message)

model = torch.hub.load('ultralytics/yolov5', 'custom', path='base/yolov5s-model.pt')

class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        asyncio.get_event_loop().create_task(self.stream_video())

    async def disconnect(self, close_code):
        pass

    async def stream_video(self):
        global model         
        cap = cv2.VideoCapture('base/sample3.mp4')
        alert_sent = False

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame)

            '''
            for det in results.xyxy[0]:  # detections for each frame
                if det[-1] == 0:  # Ensure this matches the class ID for "person"
                    await self.send(text_data=json.dumps({
                                        'type': 'warning',
                                        'message': 'Person detected!'
                            }))                    
                    break
            '''

            annotated_frame = results.render()[0]

            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            try:
                await self.send(text_data=json.dumps({'frame': frame_base64}))
            except ClientDisconnected:
                print("Client disconnected, stopping video stream.")
                break
            
        cap.release()
