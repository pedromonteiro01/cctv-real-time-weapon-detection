from django.urls import path
from . import views
from . import consumers

urlpatterns = [
    path('', views.getRoutes, name="routes"),
    path('yolo-video-feed/', views.yolo_video_feed, name="stream yolo video"),
]