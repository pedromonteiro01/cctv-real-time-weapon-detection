import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TextMessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        c = 0
        while True:
            await self.send(json.dumps({
                'type': 'warning',
                'message': f'Warning! Message count is at {c}',
            }))
            c += 1
            await asyncio.sleep(10)  # wait 10 seconds

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        pass
