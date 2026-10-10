from django.urls import path
from .views import (
    IssueCategoryListView,
    IssueCategoryDetailView,
    IssueListCreateView,
    IssueDetailView,
    IssueTrackPublicView,
    IssueSummaryView,
    IssueStartReviewView,
    IssueAcceptView,
    IssueRejectView,
    IssueAssignWorkerView,
    IssueChangePriorityView,
    IssueRerouteView,
    IssueWorkerTransitionView,
    IssueCompleteWorkView,
    IssueSupervisorVerifyView,
    IssueCitizenFeedbackView,
    IssueAdminOverviewView,
    SLAConfigurationListView,
    IssueCheckDuplicatesView,
    IssueUpvoteView,
)

urlpatterns = [
    path('categories/', IssueCategoryListView.as_view(), name='issue-categories-list'),
    path('categories/<int:pk>/', IssueCategoryDetailView.as_view(), name='issue-category-detail'),
    path('summary/', IssueSummaryView.as_view(), name='issue-summary'),
    path('admin-overview/', IssueAdminOverviewView.as_view(), name='issue-admin-overview'),
    path('sla-config/', SLAConfigurationListView.as_view(), name='issue-sla-config'),
    path('track/<str:issue_id>/', IssueTrackPublicView.as_view(), name='issue-track-public'),
    
    # Action endpoints
    path('<str:lookup>/start-review/', IssueStartReviewView.as_view(), name='issue-start-review'),
    path('<str:lookup>/accept/', IssueAcceptView.as_view(), name='issue-accept'),
    path('<str:lookup>/reject/', IssueRejectView.as_view(), name='issue-reject'),
    path('<str:lookup>/assign/', IssueAssignWorkerView.as_view(), name='issue-assign-worker'),
    path('<str:lookup>/change-priority/', IssueChangePriorityView.as_view(), name='issue-change-priority'),
    path('<str:lookup>/reroute/', IssueRerouteView.as_view(), name='issue-reroute'),
    
    # Worker, verification, and duplicate endpoints
    path('check-duplicates/', IssueCheckDuplicatesView.as_view(), name='issue-check-duplicates'),
    path('<str:lookup>/upvote/', IssueUpvoteView.as_view(), name='issue-upvote'),
    path('<str:lookup>/worker-transition/', IssueWorkerTransitionView.as_view(), name='issue-worker-transition'),
    path('<str:lookup>/complete/', IssueCompleteWorkView.as_view(), name='issue-complete-work'),
    path('<str:lookup>/verify/', IssueSupervisorVerifyView.as_view(), name='issue-supervisor-verify'),
    path('<str:lookup>/feedback/', IssueCitizenFeedbackView.as_view(), name='issue-citizen-feedback'),
    
    # Generic detail and list
    path('<str:lookup>/', IssueDetailView.as_view(), name='issue-detail'),
    path('', IssueListCreateView.as_view(), name='issue-list-create'),
]
