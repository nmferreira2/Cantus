# Cantus

Cantus is a liturgical repertoire management system for parish and choir use.
It manages Songs, Contributors, versioned Scores, Mass planning, the
liturgical calendar, statistics, global search, and application settings.

## Stack

- Node.js 22 and Express 5
- Prisma ORM and SQLite
- Vanilla JavaScript ES modules
- Bootstrap 5 with a custom responsive theme
- Docker and Docker Compose

## Quick start

Requirements: Node.js 22 or newer.

```bash
cp backend/.env.example backend/.env
npm install
npm run db:deploy
npm run dev
```

Open <http://localhost:3000>. The development server watches backend and
frontend files served by Express.

The existing local `.env` can be kept when it already defines `DATABASE_URL`
and `PORT`. Access credentials are configured with `AUTH_USERNAME`,
`AUTH_PASSWORD`, and `SESSION_SECRET`.

## Commands

```bash
npm run dev          # Generate Prisma Client and start with file watching
npm start            # Start without file watching
npm test             # Run the Node test suite
npm run db:migrate   # Create/apply a development migration
npm run db:deploy    # Apply committed migrations
npm run db:import-repertoire # Import/update the supplied repertoire batch
npm run db:import-plans # Import/update the supplied historical mass plans
```

## Docker

```bash
docker compose up --build
```

The SQLite database is stored in the named `cantus-data` volume and imported
files in `cantus-files`. Migrations are applied before the container starts the
application.

## Song API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/songs` | Paginated, sorted, filtered song list |
| `GET` | `/api/songs/:id` | Get one non-deleted song |
| `POST` | `/api/songs` | Create a validated song |
| `PUT` | `/api/songs/:id` | Replace a song's editable data |
| `DELETE` | `/api/songs/:id` | Soft-delete a song |
| `PATCH` | `/api/songs/:id/restore` | Restore an archived song |
| `DELETE` | `/api/songs/:id/permanent` | Permanently delete an archived song |
| `POST` | `/api/songs/:id/import` | Import a PDF or UTF-8 TXT file |
| `GET` | `/api/tags` | List assignable liturgical tags |

Titles and composers are required. The combination of title, composer, and
arrangement identifies duplicate active songs, allowing common titles by
different composers to coexist. Each song has one or more `songTypes`, while
the `songType` list parameter filters songs containing that type. Normal delete
operations set `deletedAt`; permanent deletion is only available for archived
songs. List parameters include `search`,
`page`, `pageSize`, `sortBy`, `sortOrder`, `status`, `songType`, `language`,
and `tagId`.

PDF imports are stored as referenced attachments. TXT imports are stored and
also update the Song lyrics. MusicXML and ChordPro return an explicit
not-implemented response while their future UI affordances remain visible.

## Additional APIs

| Module | Endpoints |
| --- | --- |
| Contributors | CRUD and restore under `/api/contributors` |
| Scores | CRUD under `/api/scores`; version uploads/deletion at `/:id/versions` |
| Mass planner | CRUD under `/api/masses`; `/calendar`, `/references`, and `/:id/celebration-pdf` |
| Users | Admin-only account and permission management under `/api/users` |
| Statistics | Aggregates and chart data at `/api/statistics` |
| Global search | Grouped results at `/api/search?q=` |
| Settings | Application/church settings and logo at `/api/settings` |

Contributor, Score, Mass, and Score Version deletion is soft. Uploaded files
remain in storage when a version is archived. Scores are categorized as choir,
organ, piano, guitar, or other. Uploading a replacement creates the next
version; active versions can still be previewed or downloaded through guarded
API routes.

The account configured with `AUTH_USERNAME` and `AUTH_PASSWORD` remains the
environment administrator with every permission. Additional administrators
and contributor accounts are managed in **Utilizadores**. Contributor accounts
are linked to one contributor record and may optionally receive permission to
manage scores for songs associated with their own composer/arranger/
harmonizer name.

## Structure

```text
backend/
  prisma/              schema and migrations
  storage/             imported files (ignored by Git)
  public/
    assets/
      css/             custom theme
      js/
        api/           HTTP clients
        components/    shared UI shell
        pages/         SPA pages
        utils/         browser helpers
        app.js
        router.js
    index.html         the only HTML entry point
  src/
    config/
    controllers/
    middleware/
    repositories/
    routes/
    services/
    utils/
    validators/
    app.js
    server.js
  test/
docs/
```

See [docs/architecture.md](docs/architecture.md) for design and extension
guidance.
