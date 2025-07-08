# API Authentication & Permissions

## Authentication

- Uses JWT tokens for all API endpoints.
- On login, users receive an access and refresh token.

## Permissions

- All API endpoints require authentication.
- Endpoints check both the user's `org` and `role` for every request.
- Example: `/api/files/` only returns files where `file.org == request.user.org`.

## Example: Custom Permission Class

```python
from rest_framework.permissions import BasePermission

class IsOrgAdminOrOwner(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["admin", "owner"]
        )
