from rest_framework import viewsets

class TenantScopedViewSet(viewsets.ModelViewSet):
    """
    Filters all queries to client_id for tenant isolation, and always sets client_id on create/update.
    Assumes user.client_id exists (adjust as needed).
    """
    def get_queryset(self):
        base = super().get_queryset()
        client_id = getattr(self.request.user, 'client_id', None)
        if not client_id:
            # Optionally handle superusers/staff here
            return base.none()
        return base.filter(client_id=client_id)

    def perform_create(self, serializer):
        serializer.save(client_id=getattr(self.request.user, 'client_id', None))

    def perform_update(self, serializer):
        serializer.save(client_id=getattr(self.request.user, 'client_id', None))
