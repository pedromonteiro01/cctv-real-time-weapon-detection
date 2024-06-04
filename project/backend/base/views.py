from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import CustomUserSerializer
from rest_framework.authtoken.models import Token
from .models import Detection, Camera, UploadedVideo
from .serializers import DetectionSerializer
from django.core.serializers import serialize
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .serializers import UploadedVideoSerializer, UploadVideoDetectionsSerializer
from django.http import Http404
from django.http import FileResponse
from django.core.exceptions import ObjectDoesNotExist
from drf_yasg.utils import swagger_auto_schema
from silk.profiling.profiler import silk_profile

@swagger_auto_schema(method='post', operation_summary="User Login")  
@api_view(['POST'])
@silk_profile(name='Login View Profiling')
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)  # Get or create a token for the user
        return Response({
            "message": "Login successful",
            "token": token.key  # Return the token key in the response
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    

@swagger_auto_schema(methods=['post'], operation_summary="Post Detections For Specific Camera")
@swagger_auto_schema(methods=['get'], operation_summary="Get All Detections")
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@silk_profile(name='Detection List/Create Profiling')
def detection_list_create(request):
    if request.method == 'GET':
        user_cameras = request.user.cameras.all()
        detections = Detection.objects.filter(camera__in=user_cameras).order_by('-date', '-time')
        serializer = DetectionSerializer(detections, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        camera_id = request.data.get('camera')
        try:
            camera = request.user.cameras.get(id=camera_id)
        except Camera.DoesNotExist:
            return Response({"error": "Camera does not belong to the current user."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DetectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(camera=camera)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(method='get', operation_summary="Get Specific Camera Detections",
                     operation_description="Lists detections for a specific camera belonging to the authenticated user.",
                     responses={200: DetectionSerializer(many=True)})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def camera_specific_detections(request, camera_id):
    user_cameras = request.user.cameras.all()
    user_cameras = user_cameras.filter(id=camera_id)
    detections = Detection.objects.filter(camera__in=user_cameras).order_by('-date', '-time')
    serializer = DetectionSerializer(detections, many=True)
    return Response(serializer.data)

@swagger_auto_schema(method='post', operation_summary="Upload Video",
                     operation_description="Uploads a video and saves it.",
                     responses={201: UploadedVideoSerializer})   
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@silk_profile(name='Upload Video Profiling')
def upload_video(request):
    serializer = UploadedVideoSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(method='get', operation_summary="Get All Uploaded Videos",
                     operation_description="Retrieves a list of all videos uploaded by the authenticated user.")
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_uploaded_videos(request):
    uploaded_videos = UploadedVideo.objects.filter(user=request.user).values('id', 'video', 'analyzed')
    return JsonResponse(list(uploaded_videos), safe=False)

@swagger_auto_schema(method='get', operation_summary="Get Uploaded Video Details",
                     operation_description="Retrieves details of a specific video uploaded by the authenticated user, identified by video ID.")
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_uploaded_video_details(request, video_id):
    try:
        uploaded_video = UploadedVideo.objects.get(user=request.user, id=video_id)
        video_details = {
            'id': uploaded_video.id,
            'video': uploaded_video.video.url,
            'analyzed': uploaded_video.analyzed
        }
        return JsonResponse(video_details)
    except UploadedVideo.DoesNotExist:
        raise Http404("Uploaded video not found.")

@swagger_auto_schema(method='delete', operation_summary="Delete Video Detections",
                     operation_description="Deletes all detections associated with a video.",
                     responses={204: 'Detections deleted successfully.'})
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_video_detections(request, video_id):
    try:
        video = UploadedVideo.objects.get(id=video_id, user=request.user)
        video.video_detections.all().delete()  # Correct related_name used here
        return Response({"message": "Detections deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except UploadedVideo.DoesNotExist:
        return Response({"error": "Video not found."}, status=status.HTTP_404_NOT_FOUND)

@swagger_auto_schema(methods=['post'], operation_summary="Upload Video Detections",
                     operation_description="Uploads detections for a specific video.",
                     responses={201: 'Detections uploaded successfully.'})
@swagger_auto_schema(methods=['get'], operation_summary="List Video Detections",
                     operation_description="Lists all detections for a specific video.",
                     responses={200: UploadVideoDetectionsSerializer(many=True)})
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def upload_video_detections(request, video_id):
    from .models import UploadVideoDetections
    try:
        uploaded_video = UploadedVideo.objects.get(id=video_id, user=request.user)
    except UploadedVideo.DoesNotExist:
        return Response({"error": "Uploaded video not found or does not belong to the user."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        detections_data = request.data.get('detections', [])
        
        for detection_data in detections_data:
            UploadVideoDetections.objects.create(
                uploaded_video=uploaded_video,
                weapon_type=detection_data['label'],
                confidence=detection_data['confidence'],
                frame=detection_data.get('frame', ''),  # Save the frame data if available
                timestamp=detection_data['timestamp']
            )
        return Response({"message": "Detections uploaded successfully."}, status=status.HTTP_201_CREATED)

    elif request.method == 'GET':
        detections = UploadVideoDetections.objects.filter(uploaded_video=uploaded_video).order_by('-created_at')
        detections_list = [{
            'label': detection.weapon_type,
            'confidence': detection.confidence,
            'frame': detection.frame,
            'timestamp': detection.timestamp,
            'created_at': detection.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        } for detection in detections]

        return Response(detections_list, status=status.HTTP_200_OK)


def download_processed_video(request, video_id):
    try:
        video = UploadedVideo.objects.get(id=video_id)
        if video.processed_video:
            return FileResponse(video.processed_video.open(), as_attachment=True, filename=f"{video_id}_processed.mp4")
        else:
            return HttpResponse("Processed video not available.", status=404)
    except UploadedVideo.DoesNotExist:
        return HttpResponse("Video not found.", status=404)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)