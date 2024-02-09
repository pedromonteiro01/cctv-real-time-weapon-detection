from django.urls import path
from .consumers import TextMessageConsumer, VideoStreamConsumer

websocket_urlpatterns = [
    path('ws/text/', TextMessageConsumer.as_asgi()),
    #path('ws/video/', VideoStreamConsumer.as_asgi())
]