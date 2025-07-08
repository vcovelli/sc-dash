# Audit Logging

## What is Logged

- User logins, logouts, and failed login attempts
- File uploads, downloads, deletions
- User and role changes
- Organization-level changes (settings, plan upgrades, etc.)
- Invitation sends, accepts, and revokes

## Why Audit Logging?

- Supports compliance and security requirements
- Enables tracing of who did what and when
- Helps investigate incidents and roll back mistakes

## Accessing Logs

- Use the admin panel to view user activity.
- Advanced: Query `UserActivity` in the database or via an API endpoint.

## Retention

- Logs are stored indefinitely by default (can be pruned/archived per org or compliance needs).
