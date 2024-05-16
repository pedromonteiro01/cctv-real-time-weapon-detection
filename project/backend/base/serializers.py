# serializers.py in your app directory

from rest_framework import serializers
from .models import CustomUser, Detection, Camera, UploadedVideo, UploadVideoDetections

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'number', 'phone', 'city')

class DetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detection
        fields = '__all__'

class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camera
        fields = '__all__'

class UploadedVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedVideo
        fields = ['id', 'user', 'video']
        read_only_fields = ('user',)  # Ensure user field is not required from the request

    def create(self, validated_data):
        # Automatically assign the authenticated user to the uploaded video
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
class UploadVideoDetectionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadVideoDetections
        fields = ['weapon_type', 'confidence', 'frame', 'timestamp', 'created_at']
