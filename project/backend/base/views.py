from django.shortcuts import render
from django.conf import settings
from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.views.decorators import gzip
from channels.layers import get_channel_layer
from datetime import datetime

channel_layer = get_channel_layer()

VIDEO_FILE = "./video.mp4"
YOLO_COMMAND = ["python3", "../yolov5/detect.py", "--source", VIDEO_FILE, "../yolov5/yolov5s-model.pt"]

# Create your views here.
def getRoutes(request):
    return JsonResponse('Hello', safe=False)

def getVideoFrames(request):
    return JsonResponse('Get Video Frames View', safe=False)

def get_cameras_info(request):
    current_day = datetime.now().strftime('%Y-%m-%d')
    current_hour = datetime.now().strftime('%H:%M:%S')

    # Hardcoded camera information
    cameras = [
        {"id": "1", "location": "Hall"},
        {"id": "2", "location": "Library"},
        {"id": "3", "location": "Main Entrance"},
        {"id": "4", "location": "Parking Lot"},
        {"id": "5", "location": "Cafeteria"},
        {"id": "6", "location": "Gym"},
    ]

    # Add current day and hour to each camera info
    for camera in cameras:
        camera["current_day"] = current_day
        camera["current_hour"] = current_hour

    return JsonResponse({"cameras": cameras})