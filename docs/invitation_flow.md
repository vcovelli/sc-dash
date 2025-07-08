# Invitation & Onboarding Flow

## How Invites Work

1. **Admin/Owner/CEO** initiates an invite by entering the new user's email and selecting a role.
2. System generates a secure, single-use token and emails an invite link to the user.
3. The user clicks the link and is taken to a registration page.
4. Upon registering, the new user is automatically added to the inviter's organization and assigned the selected role.
5. The invite is marked as "accepted" and cannot be reused.

## Permissions

- Only users with `owner`, `admin`, or a privileged role can send invites.
- Invitations specify both the organization and the intended role for the new user.

## Resending & Revoking Invites

- Pending invites can be resent or revoked by the inviter.
- Expired or revoked invites cannot be used to register.

## Security

- Tokens are time-limited (recommended: 24 hours).
- All invite links are single-use.

## Onboarding Progress

- The platform can track and display onboarding steps for each user (e.g. "Uploaded First File", "Configured Dashboard").
