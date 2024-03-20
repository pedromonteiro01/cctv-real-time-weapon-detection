from django.urls import re_path
from .consumers import VideoStreamConsumer, CameraInfoConsumer, MultiCameraStreamConsumer

websocket_urlpatterns = [
    re_path(r'ws/video/(?P<camera_id>\w+)/$', VideoStreamConsumer.as_asgi()),
    re_path(r'ws/camera_info/', CameraInfoConsumer.as_asgi()),
    re_path(r'ws/multi_camera/(?P<token>\w+)/$', MultiCameraStreamConsumer.as_asgi()),
]
