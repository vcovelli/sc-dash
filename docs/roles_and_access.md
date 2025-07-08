# 🚀 Platform Roles, Permissions & Multi-Tenancy

## Overview

This platform is a **multi-tenant business intelligence system** built with Django.  
It is designed to keep data secure, separated by organization, and controlled via robust role-based access.

---

## Table of Contents

- [Key Concepts](#key-concepts)
  - [Organizations](#organizations)
  - [Users](#users)
  - [Roles](#roles)
- [Role Table](#role-table)
- [Access Control](#access-control)
- [Invitations](#invitations)
- [Activity Logging & Onboarding](#activity-logging--onboarding)
- [Data Model Relationships](#data-model-relationships)
- [Example Access Rules](#example-access-rules)
- [Best Practices & Principles](#best-practices--principles)
- [How to Extend](#how-to-extend)
- [Summary](#summary)

---

## Key Concepts

### Organizations

- An **Organization** represents a company or team.
- Every user, file, invite, and action is always associated with a single organization.
- **No data is shared between organizations by default.**

### Users

- Each user (`CustomUser`) belongs to exactly one organization.
- Every user has a **role** that determines their permissions and access level.
- Django’s built-in groups/permissions are available, but the `role` field is the main business logic control.

### Roles

- The `role` field on users is **central** to permission and access decisions.
- Roles are hierarchical and modeled after real-world organizations.

---

## Role Table

| Role                 | Description & Typical Privileges                             |
|----------------------|-------------------------------------------------------------|
| **admin**            | Platform superuser. Full access everywhere.                 |
| **owner**            | Organization owner. Can invite/manage users, org settings.  |
| **ceo**              | Org-wide top leader. Global visibility within org.          |
| **national_manager** | Manages national or multi-region data.                      |
| **regional_manager** | Manages a specific region.                                  |
| **local_manager**    | Manages a specific site/location.                           |
| **employee**         | Standard user. Basic access to org data.                    |
| **client**           | External user (client, partner, 3rd party). Limited access. |
| **tech_support**     | Internal/external tech support.                             |
| **read_only**        | Can view data, cannot edit.                                 |
| **custom**           | Reserved for advanced, org-specific roles.                  |

---

## Access Control

- **Every action and query is scoped to the user's organization.**
- **Role determines access:**
    - Only `owner` or `admin` can invite new users or change org settings.
    - Managers (`ceo`, `national_manager`, etc.) have higher-level access.
    - `employee`, `client`, and `read_only` have restricted or view-only access.
- **Superusers** (`admin` with `is_superuser=True`) can access everything.

---

## Invitations

- High-level roles (`owner`, `admin`) can invite new users to their org.
- Invites specify both organization and role for the new user.
- New users join the inviter's org with the assigned role upon accepting.

---

## Activity Logging & Onboarding

- All significant user actions are logged for auditing and compliance (`UserActivity`).
- Onboarding progress is tracked for each user.

---

## Data Model Relationships

- **Organization**
    - Has many users, invitations, files, etc.
- **CustomUser**
    - Belongs to one organization (`org`)
    - Has a `role`
- **Invitation**
    - Belongs to an org, sent by a user, specifies a role for the invitee
- **UserActivity**
    - Logs user actions (including org and timestamp)

---

## Example Access Rules

- **View Organization Data:**  
  User must belong to the organization.
- **Invite New Users:**  
  User’s `role` must be `owner`, `admin`, or other privileged role.
- **Edit Org Settings:**  
  Only `owner` or `admin`.
- **View All Files/Reports:**  
  `ceo`, `national_manager`, `regional_manager`, or higher.
- **Read-Only Access:**  
  `read_only`, `client`, and `employee` roles.

---

## Best Practices & Principles

- **Principle of Least Privilege:**  
  Every user gets only the access required for their job.
- **Multi-Tenancy:**  
  Each org’s data is fully isolated.
- **Auditability:**  
  Every important action is logged.
- **Extensibility:**  
  Roles and org structure can grow as the business grows.

---

## How to Extend

- Add new roles by updating the `ROLE_CHOICES` in your models.
- Add fields to organizations for regions, sites, or business units as needed.
- Write Django/DRF permissions and business logic using `request.user.role` and `request.user.org`.

---

## Summary

This platform ensures:
- **Security:** Org isolation and least-privilege role-based access.
- **Flexibility:** Supports organizations of any size and structure.
- **Auditability:** All actions are logged for compliance.
- **Scalability:** Easily add orgs, users, roles, and new features.

**Questions? Check a user’s `role` and `organization`—that’s the core of our platform’s access control.**

---

