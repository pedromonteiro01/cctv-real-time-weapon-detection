from django.urls import re_path
from .consumers import VideoStreamConsumer, CameraInfoConsumer

websocket_urlpatterns = [
    re_path(r'ws/video/', VideoStreamConsumer.as_asgi()),
    re_path(r'ws/camera_info/', CameraInfoConsumer.as_asgi()),
]