from django.urls import path
from .consumers import TextMessageConsumer

websocket_urlpatterns = [
    path('ws/text/', TextMessageConsumer.as_asgi()),
]