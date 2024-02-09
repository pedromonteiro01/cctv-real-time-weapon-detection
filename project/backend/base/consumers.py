import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import aiofiles 
from datetime import datetime 

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
