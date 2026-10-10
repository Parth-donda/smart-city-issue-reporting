from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication & User Management
    path('api/auth/', include('accounts.urls')),

    # Issues & Categories
    path('api/issues/', include('issues.urls')),

    # Departments
    path('api/departments/', include('departments.urls')),

    # Notifications
    path('api/notifications/', include('notifications.urls')),

    # Audit Trail
    path('api/audit/', include('audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
