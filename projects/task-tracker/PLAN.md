# Task Tracker — PLAN.md

## What Is This?

A minimal internal task tracker. Teams create projects, add tasks, assign them, and track completion. No external integrations, no notifications — just clean CRUD with proper auth.

## Who Uses It?

- **Team leads** — create projects, assign tasks, track progress
- **Team members** — view assigned tasks, update status, add comments
- **Admins** — manage users, archive projects

## Auth

OIDC provider (generic). JWT validation via JWKS. Roles: ADMIN, MEMBER.

## Domain Models

### Project
- name, slug (unique), description, status (ACTIVE/ARCHIVED), owner
- Has many tasks, has many members

### Task
- title, description, status (TODO/IN_PROGRESS/DONE), priority (LOW/MEDIUM/HIGH/URGENT)
- Belongs to project, assigned to user (optional), created by user
- Due date (optional)

### ProjectMember
- project, user, role (OWNER/EDITOR/VIEWER)

### Comment
- body (text), task, author
- Soft-deletable

## Key Flows

### Flow 1: Create Project
1. Auth user → POST /api/v1/projects { name, description }
2. Auto-generates slug, sets creator as OWNER
3. Returns project with membership

### Flow 2: Add Task
1. Auth user → POST /api/v1/projects/:slug/tasks { title, description, priority }
2. Validates user is project member (OWNER or EDITOR)
3. Sets status=TODO, createdBy=current user

### Flow 3: Update Task Status
1. Auth user → PATCH /api/v1/projects/:slug/tasks/:id { status }
2. Validates member role

### Flow 4: List Tasks (filtered)
1. GET /api/v1/projects/:slug/tasks?status=TODO&assignee=me&priority=HIGH
2. Paginated (cursor-based), sorted by priority then createdAt

### Flow 5: Add Comment
1. POST /api/v1/projects/:slug/tasks/:id/comments { body }
2. Any project member can comment

## API Endpoints

| Method | Path | Role Required |
|--------|------|---------------|
| POST | /api/v1/projects | MEMBER+ |
| GET | /api/v1/projects | MEMBER+ (own projects) |
| GET | /api/v1/projects/:slug | Project member |
| PATCH | /api/v1/projects/:slug | OWNER |
| DELETE | /api/v1/projects/:slug | ADMIN |
| POST | /api/v1/projects/:slug/tasks | EDITOR+ |
| GET | /api/v1/projects/:slug/tasks | Project member |
| PATCH | /api/v1/projects/:slug/tasks/:id | EDITOR+ |
| DELETE | /api/v1/projects/:slug/tasks/:id | EDITOR+ |
| POST | /api/v1/projects/:slug/tasks/:id/comments | Project member |
| GET | /api/v1/projects/:slug/tasks/:id/comments | Project member |

## Non-Goals (v1)

- No real-time updates (WebSockets)
- No file attachments
- No email notifications
- No frontend (API only for this plan)
- No audit log (future)
