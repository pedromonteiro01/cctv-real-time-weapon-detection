# base/urls.py
from django.urls import path
from .views import (
    detection_list_create, login_view, CurrentUserView, upload_video,
    uploaded_videos_list, upload_video_detections, download_processed_video,
    delete_video_detections
)
from rest_framework.permissions import AllowAny
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from rest_framework_swagger.views import get_swagger_view

from django.conf.urls.static import static

schema_view = get_swagger_view(title='API Documentation')

schema_view = get_schema_view(
    openapi.Info(
        title="API Documentation",
        default_version='v1',
        description="Detailed documentation of API endpoints",
        terms_of_service="https://www.example.com/policies/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(AllowAny,),
)

urlpatterns = [
    path('user/login/', login_view, name='login'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('detections/', detection_list_create, name='detections'),
    path('detections/camera/<int:camera_id>/', detection_list_create, name='detections_by_camera'),
    path('uploaded_videos/upload_video/', upload_video, name='upload_video'),
    path('uploaded_videos/', uploaded_videos_list, name='uploaded_videos_list'),
    path('detections/<int:video_id>/delete/', delete_video_detections, name='delete_detections'),
    path('uploaded_videos/<int:video_id>/', uploaded_videos_list, name='uploaded_video_detail'),
    path('uploaded_videos/<int:video_id>/detections/', upload_video_detections, name='upload_video_detections'),
    path('download_video/<int:video_id>/', download_processed_video, name='download_processed_video'),

    # Swagger and Redoc paths
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
