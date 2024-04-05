from django.urls import path
from .views import detection_list_create, login_view, CurrentUserView, upload_video, uploaded_videos_list
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('login/', login_view, name='login'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('detections/', detection_list_create, name='detections'),
    path('detections/camera/<int:camera_id>/', detection_list_create, name='detections_by_camera'),
    path('upload_video/', upload_video, name='upload_video'),
    path('uploaded_videos/', uploaded_videos_list, name='uploaded_videos_list'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
