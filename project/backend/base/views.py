from django.shortcuts import render
import os
from django.conf import settings
from rest_framework.decorators import api_view
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators import gzip
import subprocess
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

channel_layer = get_channel_layer()

VIDEO_FILE = "./video.mp4"
YOLO_COMMAND = ["python3", "../yolov5/detect.py", "--source", VIDEO_FILE, "../yolov5/yolov5s-model.pt"]

# Create your views here.
def getRoutes(request):
    return JsonResponse('Hello', safe=False)

def getVideoFrames(request):
    return JsonResponse('Get Video Frames View', safe=False)

@gzip.gzip_page
def yolo_video_feed(request):
    # Open subprocess to execute YOLO detection script
    yolo_process = subprocess.Popen(YOLO_COMMAND, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("YOLO detection process started...")  # Log that the YOLO detection process is running

    def generate():
        # Read output from YOLO detection process
        while True:
            frame_bytes = yolo_process.stdout.readline()
            print("sending frames...")

            # Check if process has terminated
            if not frame_bytes:
                break

            # Send frame bytes to the frontend
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    # Return streaming HTTP response with processed video frames
    return StreamingHttpResponse(generate(), content_type='multipart/x-mixed-replace; boundary=frame')
