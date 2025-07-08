# Data Isolation & Security

## Organization Data Isolation

- All data (files, reports, analytics, etc.) is tagged with the organization.
- Queries, views, and APIs always filter by the user's organization.

## Security Principles

- **Principle of Least Privilege:** No user can see or edit data beyond their org/role.
- **Audit Logging:** Every sensitive or administrative action is recorded.
- **No Cross-Org Access:** Even accidental, through the API or admin, is blocked.

## Best Practices

- Always filter queries by `org`.
- Never trust the frontend for access control—enforce everything in the backend.
- Use strong passwords and require 2FA for high-privilege accounts.

## Example Query

# Get all files for the logged-in user's org
files = UploadedFile.objects.filter(org=request.user.org)