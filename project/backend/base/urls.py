from django.urls import path
from .views import detection_list_create, login_view, CurrentUserView, upload_video, uploaded_videos_list, upload_video_detections, upload_video, download_processed_video, delete_video_detections
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('login/', login_view, name='login'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('detections/', detection_list_create, name='detections'),
    path('detections/camera/<int:camera_id>/', detection_list_create, name='detections_by_camera'),
    path('upload_video/', upload_video, name='upload_video'),
    path('uploaded_videos/', uploaded_videos_list, name='uploaded_videos_list'),
    path('delete_detections/<int:video_id>/', delete_video_detections, name='delete_detections'),
    path('uploaded_videos/<int:video_id>/', uploaded_videos_list, name='uploaded_video_detail'),
    path('uploaded_videos/<int:video_id>/detections/', upload_video_detections, name='upload_video_detections'),
    path('download_video/<int:video_id>/', download_processed_video, name='download_processed_video'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
