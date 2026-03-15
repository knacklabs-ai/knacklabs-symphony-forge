# Domain Model

This document describes the entities, relationships, and domain boundaries for {{PROJECT_NAME}}.

**Keep this up to date.** When you add a Prisma model, update this document. When you add a relationship, update the diagram.

## Entity Overview

| Entity | Domain | Description |
|--------|--------|-------------|
| User | auth | A person who can log in to the system |

_Add new entities to this table as you create them._

## Entity Definitions

### User

**Domain:** auth  
**Table:** `users`  
**Description:** A person authenticated via AWS Cognito who can access the system.

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Internal primary key |
| cognitoId | String | Yes | Cognito user sub (unique) |
| email | String | Yes | User email (from Cognito claims) |
| createdAt | DateTime | Yes | Record creation timestamp |
| updatedAt | DateTime | Yes | Last modification timestamp |

**Relationships:**
- (Add relationships as you build features)

**Invariants:**
- Email must be unique across all users
- cognitoId is immutable after creation
- A User record is created on first login via Cognito

---

_Copy this template for new entities:_

### [EntityName]

**Domain:** [domain-name]  
**Table:** `[table_name]`  
**Description:** [What this entity represents in the real world]

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| createdAt | DateTime | Yes | Creation timestamp |
| updatedAt | DateTime | Yes | Last modification timestamp |

**Relationships:**
- [EntityName] belongs to [OtherEntity] via [foreignKey]
- [EntityName] has many [OtherEntities]

**Invariants:**
- [Business rules that must always be true]

---

## Entity Relationship Diagram

```
User
 └── (your relationships here)
```

_Update this as you add entities. Use ASCII or link to a diagram tool._

## Domain Boundaries

Each domain owns its entities. Cross-domain reads go through service calls, never direct DB queries.

| Domain | Owns |
|--------|------|
| auth | User |

**Rule:** Domain A's repository never queries Domain B's tables directly. If Domain A needs data from Domain B, it calls Domain B's service.

## Shared Types

Types that cross domain boundaries live in `packages/shared/src/types/`. Document them here when added:

| Type | Used By | Description |
|------|---------|-------------|
| UserDto | auth → all | Public user representation (no sensitive fields) |
