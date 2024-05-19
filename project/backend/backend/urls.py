# backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('base.urls')),
    path('metrics/', include('django_prometheus.urls')), 
]
