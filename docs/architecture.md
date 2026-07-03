# Cantus architecture

## Request flow

```text
Browser SPA
    -> JSON or multipart HTTP
Routes -> Validators -> Controllers -> Services -> Repositories -> Prisma -> SQLite
```

- Routes define the public HTTP surface.
- Validators accept and normalize supported request and query fields.
- Controllers translate HTTP input/output and contain no business rules.
- Services enforce lifecycle, reference, upload, and uniqueness rules.
- Repositories are the only application modules that access Prisma or disk.
- Middleware produces one consistent JSON error shape.

The API error contract is:

```json
{
  "error": {
    "message": "Validation failed",
    "details": {
      "field": "Reason"
    }
  }
}
```

## Modules

Each implemented domain owns a route/controller/service/repository chain:

- Songs, tags, attachments, archive and restore
- Contributors and role-based filtering
- Scores and immutable PDF/MusicXML versions
- Liturgical seasons and celebrations
- Mass planning, typed music slots, and calendar ranges
- Statistics and grouped global search
- Singleton application and church settings

Controllers never import Prisma or repositories. Cross-entity checks belong in
services: for example, the Mass service verifies every Song and calendar
reference before persistence, while the Score service verifies the parent Song
and file format.

## Frontend

Express serves one HTML entry point from `backend/public/index.html`. The
history router supports:

- `/`, `/search`, and `/settings`
- `/songs`, `/contributors`, `/scores`, and `/masses`
- `new`, detail, and edit routes for each managed domain
- `/statistics`

Shared layout, navigation, API client, tables, pagination, modals, form
controls, feedback, loading/empty states, and formatting helpers live beneath
`public/assets/js`. Pages reuse the existing Cantus design tokens; settings
only alter identity colors or the logo after a user explicitly saves them.

## Data lifecycle

Songs, Contributors, Scores, and Masses use nullable `deletedAt` fields.
Archive operations also set `active` to false. Normal reads exclude archived
records, archived list filters expose them deliberately, and restore endpoints
return them to active use.

Score files are never overwritten. Each upload creates a numbered
`ScoreVersion`. Song imports and Score versions keep database references to
files beneath `backend/storage`, which is mounted as a persistent Docker
volume.

## Upload safety

- Song imports: PDF or UTF-8 TXT, maximum 10 MB
- Scores: PDF, MusicXML, or compressed MXL, maximum 20 MB
- Application logo: PNG, JPEG, or WebP, maximum 2 MB

Services validate extensions and signatures before writing. Storage path
resolution cannot escape its configured root. Files are served through guarded
API routes rather than public static storage.

## Remaining boundary

Users, authentication, roles, and permissions remain the next isolated
security increment. They should wrap the established routes with authorization
middleware without moving business logic into controllers.
