from django.shortcuts import render
import os
from django.conf import settings
from rest_framework.decorators import api_view
from django.http import JsonResponse, StreamingHttpResponse

# Create your views here.
def getRoutes(request):
    return JsonResponse('Hello', safe=False)

def getVideoFrames(request):
    return JsonResponse('Get Video Frames View', safe=False)

def stream_video(request):
    def stream_generator():
        video_path = os.path.join(settings.BASE_DIR, 'base', 'sample.mp4')
        with open(video_path, "rb") as video_file:
            while chunk := video_file.read(8192):
                yield chunk

    response = StreamingHttpResponse(stream_generator(), content_type="video/mp4")
    response['Content-Disposition'] = 'inline; filename="video.mp4"'
    return response