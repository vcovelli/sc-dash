from django.urls import path
from .views import (
    UploadCSVView, UploadedFileListView, MarkSuccessView,
    FileDownloadView, StartIngestionView, download_user_file
)

urlpatterns = [
    path('upload/', UploadCSVView.as_view(), name='upload-csv'),
    path('list/', UploadedFileListView.as_view(), name='uploaded-file-list'),
    path('uploaded-files/', UploadedFileListView.as_view(), name='uploaded-files-list'),
    path('mark-success/', MarkSuccessView.as_view(), name='mark-success'),
    path('download/<uuid:file_id>/', FileDownloadView.as_view(), name='file-download'),
    path('ingestion/start/', StartIngestionView.as_view(), name='start-ingestion'),
    path('minio-download/<uuid:file_id>/', download_user_file, name='minio-download'),
]