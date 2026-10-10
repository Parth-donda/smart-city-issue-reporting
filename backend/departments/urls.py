from django.urls import path
from .views import DepartmentListView, DepartmentDetailView, DepartmentWorkersListView

urlpatterns = [
    path('', DepartmentListView.as_view(), name='department-list'),
    path('my-workers/', DepartmentWorkersListView.as_view(), name='department-my-workers'),
    path('<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('<int:pk>/workers/', DepartmentWorkersListView.as_view(), name='department-workers-list'),
]
