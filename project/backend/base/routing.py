from django.urls import re_path
from .consumers import VideoStreamConsumer, MultiCameraStreamConsumer, UploadedVideoStreamConsumer

websocket_urlpatterns = [
    re_path(r'ws/video/(?P<camera_id>\w+)/$', VideoStreamConsumer.as_asgi()),
    re_path(r'ws/multi_camera/(?P<token>\w+)/$', MultiCameraStreamConsumer.as_asgi()),
    re_path(r'ws/upload/(?P<videoUploadId>\w+)/$', UploadedVideoStreamConsumer.as_asgi()),
]