# CSE 340 Service Network

A server-rendered website connecting volunteers with service opportunities in their
community. Built for CSE 340 (Web Backend Development) at BYU-Idaho.

**Live site:** https://cse340-bc.onrender.com

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (ES modules) |
| Server | Express 5 |
| Templating | EJS 6 |
| Database | PostgreSQL (Render-hosted), accessed with `pg` |
| Styling | Hand-written CSS (no framework) |
| Dev tooling | nodemon |
| Hosting | Render.com |

## Project structure

```
cse340/
├── server.js                     Express app: config, middleware, routes
├── nodemon.json                  Dev watch config, loads .env
├── public/                       Static assets served at the site root
│   ├── css/main.css              Full stylesheet
│   └── images/                   Logos
└── src/
    ├── models/                   Database access; no Express or EJS in here
    │   ├── db.js                 Connection pool, query logging, testConnection()
    │   ├── organizations.js      getAllOrganizations()
    │   ├── projects.js           getAllProjects() - joins projects to organization
    │   └── categories.js         getAllCategories()
    ├── sql/                      Schema and seed scripts, run by hand
    │   ├── orgsetup.sql          organization table + 3 seed rows
    │   ├── projectsetup.sql      projects table + 15 seed rows
    │   └── categorysetup.sql     category + project_category tables, seed data
    └── views/                    EJS templates
        ├── home.ejs
        ├── organizations.ejs
        ├── projects.ejs
        ├── categories.ejs
        └── partials/
            ├── header.ejs        Doctype through <nav>
            └── footer.ejs        <footer> through </html>
```

Files in `public/` are served from the site root, so `public/css/main.css` is
requested as `/css/main.css`.

## Database

Four tables. An organization runs many service projects (one-to-many), and a
project falls under many categories while a category covers many projects
(many-to-many, resolved by a junction table).

### `organization`

| Column | Type | Constraints |
| --- | --- | --- |
| `organization_id` | `SERIAL` | Primary key |
| `name` | `VARCHAR(150)` | `NOT NULL` |
| `description` | `TEXT` | `NOT NULL` |
| `contact_email` | `VARCHAR(255)` | `NOT NULL` |
| `logo_filename` | `VARCHAR(255)` | `NOT NULL` |

### `projects`

| Column | Type | Constraints |
| --- | --- | --- |
| `project_id` | `SERIAL` | Primary key |
| `organization_id` | `INT` | `NOT NULL`, foreign key to `organization`, `ON DELETE CASCADE` |
| `title` | `VARCHAR(150)` | `NOT NULL` |
| `description` | `TEXT` | `NOT NULL` |
| `location` | `VARCHAR(255)` | `NOT NULL` |
| `event_date` | `DATE` | `NOT NULL` |

### `category`

| Column | Type | Constraints |
| --- | --- | --- |
| `category_id` | `SERIAL` | Primary key |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` |
| `description` | `TEXT` | `NOT NULL` |

### `project_category`

A project can fall under several categories, and a category applies to many
projects. That is a many-to-many relationship, and a column on `projects` cannot
express it — one column holds one value, and a comma-separated list would break
first normal form and make filtering by category painful. The relationship instead
lives in its own table, one row per pairing.

| Column | Type | Constraints |
| --- | --- | --- |
| `project_id` | `INT` | `NOT NULL`, foreign key to `projects`, `ON DELETE CASCADE` |
| `category_id` | `INT` | `NOT NULL`, foreign key to `category`, `ON DELETE CASCADE` |

The primary key is composite over both columns rather than a `SERIAL` surrogate.
It is the *pairing* that must be unique, and a composite key makes it impossible to
file the same project under the same category twice — something a surrogate id
would happily allow. The table carries no other data; tables shaped this way are
also called bridge, join, or associative tables.

Column names are not prefixed with the table name — the table already supplies that
context, so it is `organization.name`, not `organization.organization_name`. The one
place this needs care is a join: `organization`, `projects`, and `category` all
define `description`, and both `organization` and `category` define `name`, so
queries alias their tables (`p`, `o`, `c`) and rename overlapping output columns.

`event_date` is deliberately not called `date`, because `date` is also a PostgreSQL
type name. It is legal as a column name but makes queries harder to read.

### Running the scripts

Order matters. `projectsetup.sql` declares a foreign key against `organization` and
looks each organization up by name, so it fails if run first:

```
src/sql/orgsetup.sql   →   src/sql/projectsetup.sql   →   src/sql/categorysetup.sql
```

`categorysetup.sql` goes last because its seed rows reference project ids that only
exist once `projectsetup.sql` has run.

All three scripts begin with `DROP TABLE IF EXISTS`, so they are safe to re-run —
but the cascades run downhill. Re-running `orgsetup.sql` deletes every project,
which in turn deletes every project/category pairing, so the two later scripts have
to be re-run after it.

## Routes

| Path | View | Data source | Page title |
| --- | --- | --- | --- |
| `/` | `home.ejs` | Static | Home |
| `/organizations` | `organizations.ejs` | `getAllOrganizations()` | Our Partner Organizations |
| `/projects` | `projects.ejs` | `getAllProjects()` | Service Projects |
| `/categories` | `categories.ejs` | `getAllCategories()` | Service Project Categories |

Each route passes a `title` variable to `res.render()`. The header partial reads it
into the `<title>` tag, so every page gets its own browser tab label from one place.
The three database-backed routes additionally pass the rows they loaded.

## Getting started

**Requires Node.js 20.6 or later** — `nodemon.json` uses the built-in `--env-file`
flag, which is unavailable in earlier versions.

```bash
git clone https://github.com/archserver/cse340.git
cd cse340
npm install
```

Create a `.env` file in the project root:

```
PORT=3000
NODE_ENV=development
DB_URL=postgresql://user:password@host/database
ENABLE_SQL_LOGGING=true
```

`.env` is gitignored and is never committed. In production, Render supplies these
through its own environment settings.

Create the schema by running the three scripts in `src/sql/` against the database
named in `DB_URL`, in the order given under [Running the scripts](#running-the-scripts).

Start the development server:

```bash
npm run dev
```

The site is then available at http://127.0.0.1:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon; watches `.js`, `.css`, `.ejs`, and `.env` files and reloads on change. Loads `.env`. |
| `npm start` | Start once with plain `node`. Does **not** load `.env` — this is what Render runs. |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server binds to. Render assigns this automatically. |
| `NODE_ENV` | `production` | Environment name, logged at startup. Also gates query logging. |
| `DB_URL` | none | PostgreSQL connection string. Without it the app starts but every database-backed page returns a 500. |
| `ENABLE_SQL_LOGGING` | none | Set to `true` **and** `NODE_ENV=development` to log every query with its duration and row count. |

The names are uppercase because they are read from the operating system, not
declared in application code. The local variables holding them (`hostPort`,
`nodeEnv`) follow the project's camelCase convention.

## Deployment

Hosted on Render.com with auto-deploy from the `main` branch of
`archserver/cse340`.

| Setting | Value |
| --- | --- |
| Build command | `npm install` |
| Start command | `npm start` |
| Environment | `PORT`, `NODE_ENV`, and `DB_URL` set in the Render dashboard |

Pushing to `main` triggers a rebuild. Because Render assigns the port at runtime,
`server.js` must read `process.env.PORT` rather than hardcoding a value.

`DB_URL` must be set in the Render dashboard, not read from `.env` — that file is
gitignored and never reaches the server.

## Notes on the implementation

- **ES modules.** `package.json` sets `"type": "module"`, so the project uses
  `import`/`export` rather than `require`. `__dirname` is not defined in ES modules
  and is reconstructed in `server.js` from `import.meta.url`, which keeps paths
  correct on both Windows and Render's Linux containers.
- **Models are isolated.** Everything in `src/models/` returns plain objects and
  imports nothing from Express or EJS. Routes stay short, and a query can change
  without touching a template.
- **Connection pooling.** `db.js` creates one `pg` `Pool` for the whole process
  rather than connecting per request. In development, with `ENABLE_SQL_LOGGING=true`,
  the pool is wrapped so each query logs its SQL, duration, and row count.
- **SSL.** Render's PostgreSQL presents a self-signed certificate, so the pool uses
  `ssl: { rejectUnauthorized: false }`. The connection is still encrypted, but the
  certificate chain is not verified. A production system handling real data should
  verify it instead.
- **Joining for display.** `getAllProjects()` joins `projects` to `organization` so
  each row arrives with `organization_name` already attached. The alternative — one
  query per project to look up its organization — is the N+1 query problem.
- **Date handling.** `pg` converts a `DATE` column into a JavaScript `Date`, so
  `projects.ejs` formats it with `toLocaleDateString()`. Printed raw it would render
  as a full timestamp.
- **Partials.** `header.ejs` and `footer.ejs` are included by every page, so shared
  markup such as the navigation is edited in one file. Neither is a complete
  document on its own; each page is valid only once the three are combined.
- **EJS output tags.** `<%-` is used only for the two `include()` calls, where raw
  markup must be inserted unescaped. All data uses `<%=`, which HTML-escapes its
  output and prevents injected markup from executing. `<%#` marks developer comments
  that are stripped before the HTML is sent.
- **Responsive CSS.** The stylesheet uses custom properties for colors and spacing,
  `clamp()` for fluid type, and CSS grid for the card lists. Two breakpoints refine
  the phone and wide-desktop ends.
- **Accessibility.** Colors meet WCAG AA contrast, `:focus-visible` provides a
  keyboard focus ring, `prefers-reduced-motion` is respected, and the uppercase
  `h1` styling is applied with `text-transform` rather than typed as capitals, so
  screen readers read the word rather than spelling it out.

## Known gaps

- Routes do not wrap their model calls in `try`/`catch`, so a database failure
  surfaces as a bare "Internal Server Error" with nothing logged against the
  request. Adding a `catch` that logs and forwards to `next(error)`, plus an
  error-handling middleware, is the next improvement.
- `project_category` is created and seeded, but nothing surfaces it yet. The
  categories page lists categories on their own; showing each project's categories
  (or filtering projects by category) means a three-table join through the
  junction table.

## Course

CSE 340 — Web Backend Development, Brigham Young University-Idaho.
