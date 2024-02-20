from django.urls import path
from . import views

urlpatterns = [
    path('', views.getRoutes, name="routes"),
    path('cameras/', views.get_cameras_info, name='camera-info'),
]