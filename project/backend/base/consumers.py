import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import aiofiles 
from datetime import datetime 
import subprocess
import tempfile
import os

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
            await asyncio.sleep(10)  # wait 10 seconds

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def async_log_message(self, message):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"{current_time} - {message}\n"
        async with aiofiles.open(self.log_file_path, mode='a') as log_file:
            await log_file.write(log_message)

class VideoStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        await self.stream_video_detection('base/video.mp4', 'base/yolov5s-model.pt')

    async def disconnect(self, close_code):
        pass

    async def stream_video_detection(self, video_path, weights):
        detect_script_path = 'base/yolov5/detect.py'
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = os.path.join(temp_dir, 'output')
            os.makedirs(output_path, exist_ok=True)
            
            subprocess.run([
                'python3', detect_script_path,
                '--source', video_path,
                '--exist-ok'
            ], check=True)

            for frame_name in sorted(os.listdir(output_path)):
                frame_path = os.path.join(output_path, frame_name)
                with open(frame_path, 'rb') as frame:
                    await self.send(bytes_data=frame.read())
                    
                await asyncio.sleep(0.1)  

