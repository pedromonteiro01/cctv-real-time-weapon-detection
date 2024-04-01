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
from .models import Detection, Camera
from .serializers import DetectionSerializer
from django.core.serializers import serialize
from rest_framework.decorators import api_view, permission_classes

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
def detection_list_create(request):
    if request.method == 'GET':
        # Filter detections to only those belonging to the user's cameras
        user_cameras = request.user.cameras.all()
        print("user cameras: ", user_cameras)
        detections = Detection.objects.filter(camera__in=user_cameras).order_by('-date', '-time')
        serializer = DetectionSerializer(detections, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        camera_id = request.data.get('camera')
        try:
            # Ensure the camera belongs to the currently authenticated user
            camera = request.user.cameras.get(id=camera_id)
        except Camera.DoesNotExist:
            return Response({"error": "Camera does not belong to the current user."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DetectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(camera=camera)  # Save detection with the validated camera
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)