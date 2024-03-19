from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('user/', views.CurrentUserView.as_view(), name='current-user'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)