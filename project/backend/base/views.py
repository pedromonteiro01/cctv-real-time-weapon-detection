from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
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
from .serializers import UploadedVideoSerializer

@api_view(['POST'])
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def detection_list_create(request, camera_id=None):
    if request.method == 'GET':
        user_cameras = request.user.cameras.all()
        if camera_id is not None:
            user_cameras = user_cameras.filter(id=camera_id)
        detections = Detection.objects.filter(camera__in=user_cameras).order_by('-date', '-time')
        serializer = DetectionSerializer(detections, many=True)
        print(f"\n {serializer.data} \n")
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
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_video(request):
    serializer = UploadedVideoSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def uploaded_videos_list(request):
    uploaded_videos = UploadedVideo.objects.filter(user=request.user).values('id', 'video')
    return JsonResponse(list(uploaded_videos), safe=False)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_video_detections(request, video_id):
    try:
        uploaded_video = UploadedVideo.objects.get(id=video_id, user=request.user)
    except UploadedVideo.DoesNotExist:
        return Response({"error": "Uploaded video not found or does not belong to the user."}, status=status.HTTP_404_NOT_FOUND)
    
    detections_data = request.data.get('detections', [])
    for detection_data in detections_data:
        from .models import UploadVideoDetections
        UploadVideoDetections.objects.create(
            uploaded_video=uploaded_video, 
            weapon_type=detection_data['label'], 
            confidence=detection_data['confidence']
        )
    
    return Response({"message": "Detections uploaded successfully."}, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)