# Organization and User Lifecycle

## Creating an Organization
- Orgs can be created by platform admins or via onboarding.
- Each organization gets a unique name and slug.

## Adding Users to an Organization
- Users can only join organizations by invitation from a user with sufficient privileges (`owner`, `admin`, etc.).
- Each user is assigned a role on creation (via invitation or by admin).
- Users cannot see or interact with users or data from other orgs.

## Changing Roles or Organization Membership
- Organization admins or owners can change the role of any user in their org (except their own role, unless by another owner or admin).
- Users cannot self-assign higher privileges.
- Users can be deactivated or removed from the org by admins.

## Removing a User
- When a user is deleted or deactivated, their actions remain in the audit log.
- Data and files created by that user remain with the org.
