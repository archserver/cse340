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
    ├── routes.js                 Maps URL paths to controller functions
    ├── controllers/              Request handlers; one file per section
    │   ├── index.js              showHomePage()
    │   ├── organizations.js      show/process New + Edit Organization forms,
    │   │                         organizationValidation, list and detail pages
    │   ├── projects.js           show/process New + Edit Project forms,
    │   │                         projectValidation, list and detail pages
    │   ├── categories.js         show/process New + Edit Category forms,
    │   │                         categoryValidation, assign-categories form,
    │   │                         list and detail pages
    │   └── errors.js             testErrorPage()
    ├── models/                   Database access; no Express or EJS in here
    │   ├── db.js                 Connection pool, query logging, testConnection()
    │   ├── organizations.js      getAllOrganizations(), getOrganizationDetails(),
    │   │                         createOrganization(), updateOrganization()
    │   ├── projects.js           getAllProjects(), getUpcomingProjects(),
    │   │                         getProjectDetails(), getProjectsByOrganizationId(),
    │   │                         getProjectsByCategoryId(), createProject(),
    │   │                         updateProject()
    │   └── categories.js         getAllCategories(), getCategoryDetails(),
    │                             getCategoriesByProjectId(), createCategory(),
    │                             updateCategory(), updateCategoryAssignments()
    ├── sql/                      Schema and seed scripts, run by hand
    │   ├── orgsetup.sql          organization table + 3 seed rows
    │   ├── projectsetup.sql      projects table + 15 seed rows
    │   └── categorysetup.sql     category + project_category tables, seed data
    └── views/                    EJS templates
        ├── home.ejs
        ├── organizations.ejs     List of partner organizations
        ├── organization.ejs      One organization, with its projects
        ├── projects.ejs          Next five upcoming projects
        ├── project.ejs           One project, with its organization and category tags
        ├── allprojects.ejs       Every project (nothing links here yet)
        ├── categories.ejs        List of categories
        ├── category.ejs          One category, with its projects
        ├── new-organization.ejs  Add an organization
        ├── edit-organization.ejs Edit an organization, fields pre-filled
        ├── new-project.ejs       Add a project; organization dropdown
        ├── edit-project.ejs      Edit a project; dropdown pre-selected
        ├── new-category.ejs      Add a category
        ├── edit-category.ejs     Edit a category, fields pre-filled
        ├── assign-categories.ejs Checkbox list of every category for one project
        ├── errors/
        │   ├── 404.ejs           Page not found
        │   └── 500.ejs           Server error; shows the stack in development only
        └── partials/
            ├── header.ejs        Doctype through <nav>
            └── footer.ejs        <footer> through </html>
```

Files in `public/` are served from the site root, so `public/css/main.css` is
requested as `/css/main.css`.

## Architecture

The app follows the MVC (model-view-controller) separation. A request moves through
four files, each with one job:

```
request  →  src/routes.js        which URL maps to which handler
         →  src/controllers/*    read the request, call models, choose a view
         →  src/models/*         SQL only; returns plain JavaScript objects
         →  src/views/*          HTML only; renders what it is handed
```

The rules that keep the separation honest:

- **Models import nothing from Express or EJS.** They take plain arguments, return
  plain objects, and never touch `req` or `res`. That is what lets the same
  `getProjectsByOrganizationId()` serve a page today and something else later.
- **Controllers contain no SQL.** They read parameters, call model functions, and
  hand the result to `res.render()`. A controller is also where a missing row
  becomes a 404.
- **Views contain no queries.** They render exactly the object passed in. Anything a
  template needs — an organization's id for a link, say — has to be selected by the
  model and passed through by the controller.
- **`server.js` owns no routes.** It builds the app, registers middleware in order,
  mounts the router, and starts listening.

The practical payoff is that a bug has one address. A wrong column name is a model
problem, a 404 that should be a 200 is a routing problem, and a link pointing at
`/organization/undefined` is a view being handed data the model never selected.

### Naming

Model functions are named for the data they return (`getUpcomingProjects`),
controllers for the page they produce (`showProjectsPage`). The view name passed to
`res.render()` matches the template file, and **the key passed to the view must match
the name the template uses** — `res.render('project', { project })` pairs with
`project.title` inside `project.ejs`.

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

The site reads the junction table in both directions. `getCategoriesByProjectId()`
starts from a project and joins `project_category` to `category`;
`getProjectsByCategoryId()` starts from a category and joins `project_category` to
`projects`. Each is a single join from the junction table to the side being
returned — neither query needs all three tables.

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

All routes live in `src/routes.js` on an `express.Router()`, which `server.js`
mounts with a single `app.use(router)`.

### Read routes

| Path | Controller | View | Model call |
| --- | --- | --- | --- |
| `GET /` | `showHomePage` | `home.ejs` | none |
| `GET /organizations` | `showOrganizationsPage` | `organizations.ejs` | `getAllOrganizations()` |
| `GET /organization/:id` | `showOrganizationDetailsPage` | `organization.ejs` | `getOrganizationDetails()`, `getProjectsByOrganizationId()` |
| `GET /projects` | `showProjectsPage` | `projects.ejs` | `getUpcomingProjects(5)` |
| `GET /project/:id` | `showProjectDetailsPage` | `project.ejs` | `getProjectDetails()`, `getCategoriesByProjectId()` |
| `GET /allprojects` | `showAllProjectsPage` | `allprojects.ejs` | `getAllProjects()` |
| `GET /categories` | `showCategoriesPage` | `categories.ejs` | `getAllCategories()` |
| `GET /category/:id` | `showCategoryDetailsPage` | `category.ejs` | `getCategoryDetails()`, `getProjectsByCategoryId()` |
| `GET /test-error` | `testErrorPage` | `errors/500.ejs` | none; raises a test error |

### Write routes

Each form is two routes sharing one path: a `GET` that renders the form and a
`POST` that processes the submission. The `POST` runs its validation array as
middleware before the controller.

| Path | Controller | View / redirect | Model call |
| --- | --- | --- | --- |
| `GET /new-organization` | `showNewOrganizationForm` | `new-organization.ejs` | none |
| `POST /new-organization` | `processNewOrganizationForm` | → `/organization/:id` | `createOrganization()` |
| `GET /edit-organization/:id` | `showEditOrganizationForm` | `edit-organization.ejs` | `getOrganizationDetails()` |
| `POST /edit-organization/:id` | `processEditOrganizationForm` | → `/organization/:id` | `updateOrganization()` |
| `GET /new-project` | `showNewProjectForm` | `new-project.ejs` | `getAllOrganizations()` |
| `POST /new-project` | `processNewProjectForm` | → `/projects` | `createProject()` |
| `GET /edit-project/:id` | `showEditProjectForm` | `edit-project.ejs` | `getProjectDetails()`, `getAllOrganizations()` |
| `POST /edit-project/:id` | `processEditProjectForm` | → `/project/:id` | `updateProject()` |
| `GET /new-category` | `showNewCategoryForm` | `new-category.ejs` | none |
| `POST /new-category` | `processNewCategoryForm` | → `/category/:id` | `createCategory()` |
| `GET /edit-category/:id` | `showEditCategoryForm` | `edit-category.ejs` | `getCategoryDetails()` |
| `POST /edit-category/:id` | `processEditCategoryForm` | → `/category/:id` | `updateCategory()` |
| `GET /assign-categories/:projectId` | `showAssignCategoriesForm` | `assign-categories.ejs` | `getProjectDetails()`, `getAllCategories()`, `getCategoriesByProjectId()` |
| `POST /assign-categories/:projectId` | `processAssignCategoriesForm` | → `/project/:id` | `updateCategoryAssignments()` |

The `GET` form routes load whatever the form needs beyond the record itself — the
project forms fetch every organization so the dropdown has options, and the assign
form fetches every category plus the project's current ones so the right checkboxes
start ticked.

Each route passes a `title` variable to `res.render()`. The header partial reads it
into the `<title>` tag, so every page gets its own browser tab label from one place.

### How the pages link together

```
/organizations ──► /organization/:id ◄──► /project/:id ◄──► /category/:id ◄── /categories
                                                ▲
/projects ──────────────────────────────────────┘   (each row also links to its organization)
```

- An organization page lists its projects; a project page links back to its
  organization.
- A project page shows its categories as tags; a category page lists its projects.
  Both directions read the same `project_category` rows, so they always agree.
- The list pages (`/organizations`, `/projects`, `/categories`) link into the
  detail pages.

### Route parameters

`/organization/:id`, `/project/:id`, and `/category/:id` use **route parameters**:
`:id` is a named placeholder matching one path segment, and Express puts the matched
value on `req.params` under that name.

```js
router.get('/project/:id', showProjectDetailsPage);

const projectId = req.params.id;          // "/project/7" → "7"
```

Three things to keep straight:

- **The names must match.** `:id` in the route means `req.params.id` in the
  controller. Renaming one without the other yields `undefined`.
- **A route parameter is not a query parameter.** `/project/7` is a route parameter
  read from `req.params`; `/project?id=7` would be a query parameter read from
  `req.query`. This project uses route parameters throughout.
- **The value is always a string, and it comes from the URL,** so it is untrusted. It
  is handed to the model as a `$1` placeholder and never concatenated into SQL:

```sql
WHERE p.project_id = $1
```

PostgreSQL then treats it strictly as a value, so a crafted URL cannot alter the
query.

### Not-found handling

An id that parses but matches no row is a separate case. The detail model functions
return `null` rather than throwing, and the controller turns that into a 404 before
rendering anything:

```js
if (!project) {
    const err = new Error('Project Not Found');
    err.status = 404;
    return next(err);
}
```

The `return` matters — without it the function carries on to `res.render()` after
already handing the request off.

## Forms and validation

### Reading a submitted form

`server.js` registers two body parsers above the router, so `req.body` is populated
before any route handler runs:

```js
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
```

`express.urlencoded` handles what a normal HTML `<form method="POST">` sends.
Registering it *after* `app.use(router)` would leave `req.body` undefined, because
middleware runs in registration order.

### Two layers, and only one of them enforces anything

Every form carries HTML attributes — `required`, `maxlength`, `minlength`,
`type="date"` — and every `POST` route runs a matching `express-validator` array.
These are not redundant; they do different jobs.

The HTML attributes are a **convenience**. They catch mistakes before a round-trip
and tell the user immediately. They vanish entirely if someone edits the DOM,
replays the request, or submits with `curl`:

```bash
curl -X POST http://localhost:3000/new-project -d "title=x&organizationId=abc"
```

The validator array is the **enforcement**. It runs on the server, where the user
has no reach. The attributes and the rules are kept in step so an honest submission
never fails server-side for something the browser could have explained first.

### Where the limits come from

Validator limits are taken from the database columns, not chosen arbitrarily. A
validator looser than its column produces a Postgres error and a 500 — the exact
failure the validation exists to prevent.

| Field | Column | Validator | Form attribute |
| --- | --- | --- | --- |
| `organization.name` | `varchar(150)` | 3–150 | `maxlength="150"` |
| `organization.description` | `text` | max 500 | `maxlength="500"` |
| `organization.contact_email` | `varchar(255)` | `isEmail()` | `type="text"` |
| `projects.title` | `varchar(150)` | 3–150 | `maxlength="150"` |
| `projects.description` | `text` | max 500 | `maxlength="500"` |
| `projects.location` | `varchar(255)` | max 250 | `maxlength="250"` |
| `projects.event_date` | `date` | `isISO8601()` | `type="date"` |
| `projects.organization_id` | `integer` | `isInt({ min: 1 })` | `<select required>` |
| `category.name` | `varchar(100)` | 3–100 | `maxlength="100"` |
| `category.description` | `text` | max 500 | `maxlength="500"` |

Where a column is `text`, there is no database ceiling and the 500-character cap is
a product decision. Where a column is `varchar(n)`, the validator sits at or below
`n`. Both `category` columns are `NOT NULL`, so `.notEmpty()` there prevents a
constraint violation rather than merely enforcing a preference.

Every rule calls `.trim()` before `.isLength()`, so trailing whitespace cannot push
a value over its limit.

### The submission cycle

All six write controllers follow the same shape:

```js
const results = validationResult(req);
if (!results.isEmpty()) {
    results.array().forEach((error) => req.flash('error', error.msg));
    return res.redirect('/edit-project/' + projectId);   // back to THIS record
}
```

Three details are deliberate:

- **Redirect, never render.** Responding to a `POST` with a redirect means a browser
  refresh re-requests the *redirected* page instead of resubmitting the form. This is
  the Post/Redirect/Get pattern, and it is why a refresh cannot create a duplicate.
- **Failures return to the same record.** An edit that fails validation redirects to
  `/edit-project/:id`, not to the create form. Sending the user to `/new-project`
  would discard the id and lose the record being edited.
- **Messages travel by flash.** Because the response is a redirect, errors cannot be
  passed to `res.render()`. `req.flash()` stores them in the session for exactly one
  subsequent page render.

### Id validation on write routes

Every `:id` write route validates the parameter before doing anything else:

```js
const projectId = Number(req.params.id);

if (!Number.isInteger(projectId) || projectId < 1) {
    const err = new Error('Project Not Found');
    err.status = 404;
    return next(err);
}
```

`Number()` is used rather than `parseInt()` because it is all-or-nothing:
`Number("5project")` is `NaN`, while `parseInt("5project")` returns `5` and silently
discards the rest — which would let a malformed URL resolve to a real record.

The check runs before `validationResult()` so an obviously bad id never costs a
database round-trip. It sits in the controller rather than the model because only the
controller knows what an appropriate failure looks like; the model relies on
parameterized queries, which hold regardless of which caller invokes them.

## Assigning categories to projects

A project belongs to many categories and a category contains many projects, so the
link lives in the `project_category` junction table. `/assign-categories/:projectId`
edits that relationship as a whole.

### The form

The view receives every category plus the project's current ones, and marks the
matching boxes:

```ejs
<% const assignedIds = assignedCategories.map(category => category.category_id); %>

<input type="checkbox" name="categoryIds" value="<%= category.category_id %>"
  <%= assignedIds.includes(category.category_id) ? 'checked' : '' %> />
```

Every box shares the name `categoryIds`, which is what makes the browser submit them
as one group rather than as separate fields.

### Normalising the submission

A checkbox group does not submit a consistent shape, and this is the trap worth
knowing about:

| Boxes ticked | `req.body.categoryIds` |
| --- | --- |
| none | `undefined` |
| one | `"3"` — a string |
| two or more | `["3", "6"]` — an array |

Code that assumes an array crashes on zero boxes and silently iterates the
*characters* of the string on one. The controller collapses all three cases first:

```js
const submitted = req.body.categoryIds;
const categoryIds = submitted === undefined
    ? []
    : Array.isArray(submitted) ? submitted : [submitted];
```

An empty array is valid input — it is how a user removes the last category from a
project.

### Replacing rather than diffing

`updateCategoryAssignments` deletes every existing row for the project, then inserts
the selected set:

```js
await db.query('DELETE FROM public.project_category WHERE project_id = $1;', [projectId]);

for (const categoryId of categoryIds) {
    await assignCategoryToProject(projectId, categoryId);
}
```

Working out which rows to add and which to remove would be more code with nothing to
show for it here: `project_category` holds only `project_id` and `category_id`, so a
deleted and re-inserted row is identical to the original. There is no timestamp,
ordering, or foreign key that a delete would destroy. Were such a column added later,
this should become a diff.

`assignCategoryToProject` uses `ON CONFLICT DO NOTHING`, so a duplicate pair is
skipped rather than raising a unique-constraint error. It is not exported —
assignments are always changed as a complete set, never one at a time.

## Middleware

`server.js` registers middleware in a deliberate order, because Express runs it in
registration order and a request stops at the first handler that ends it:

1. **Request logging** — logs method and URL, development only.
2. **Template locals** — sets `res.locals.nodeEnv`, making it readable by every
   template without being passed through each `res.render()` call.
3. **Static files** — `express.static` serves `public/`.
4. **The router** — every application route.
5. **404 catch-all** — anything still unmatched becomes a 404 error passed to
   `next(err)`.
6. **Error handler** — renders the error page.

Two ordering rules are easy to get wrong:

- **The 404 catch-all must come after the router.** It matches every request, so
  registering it earlier turns every page into a 404.
- **The error handler must be registered last.** Express searches only *forward*
  from the point an error was raised, so a handler registered before the routes never
  sees their errors, and the built-in handler prints a stack trace instead.

### Error handling

The error handler is identified by its **four** parameters. Arity is the only signal
Express uses — drop `next` and it silently becomes ordinary middleware:

```js
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';
    res.status(status).render(`errors/${template}`, context);
});
```

Anything reaching it renders `errors/404.ejs` or `errors/500.ejs` with the matching
HTTP status. `500.ejs` prints the message and stack only when
`nodeEnv === 'development'`, so the deployed site never exposes file paths.

Because the app runs Express 5, a rejected promise inside an `async` controller
reaches this handler automatically — a database failure renders the 500 page with no
`try`/`catch` in the controller.

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
  imports nothing from Express or EJS. Controllers stay short, and a query can change
  without touching a template.
- **Ids are validated before they reach the database.** The detail controllers run
  `Number(req.params.id)` through `Number.isInteger()` and a `< 1` check, so
  `/project/abc`, `/category/0` and `/organization/3.14` render the 404 page instead of
  throwing a PostgreSQL cast error. Alternate spellings of a valid id (`1.0`, `+1`,
  `1e0`) resolve to the same record, which is intended.
- **Detail lookups return one row or null.** `getOrganizationDetails(id)`,
  `getProjectDetails(id)`, and `getCategoryDetails(id)` end with
  `return result.rows.length > 0 ? result.rows[0] : null`, which is what lets a
  controller tell "no such row" apart from a real result and answer with a 404.
- **`getUpcomingProjects(n)` takes the count as an argument** rather than hardcoding
  five. The controller holds that policy in `NUMBER_OF_UPCOMING_PROJECTS`; the model
  stays reusable. The count binds as `LIMIT $1` rather than being interpolated, and
  "upcoming" means `event_date >= CURRENT_DATE`, evaluated by PostgreSQL rather than
  by Node.
- **A model function lives with the table it returns.** `getProjectsByCategoryId()`
  is in `models/projects.js` and `getCategoriesByProjectId()` is in
  `models/categories.js`, even though each looks up by the other side's id — the same
  rule that puts `getProjectsByOrganizationId()` in `projects.js`. Controllers are
  organized by page instead, so they import across: `controllers/categories.js` pulls
  from `models/projects.js` because the category page lists projects, and
  `controllers/projects.js` pulls from `models/categories.js` because the project
  page shows category tags.
- **Related rows are fetched after the not-found check.** The detail controllers
  confirm the main record exists before querying anything related to it, so an id
  that matches nothing costs one query rather than two.
- **Connection pooling.** `db.js` creates one `pg` `Pool` for the whole process
  rather than connecting per request. In development, with `ENABLE_SQL_LOGGING=true`,
  the pool is wrapped so each query logs its SQL, duration, and row count.
- **SSL.** Render's PostgreSQL presents a self-signed certificate, so the pool uses
  `ssl: { rejectUnauthorized: false }`. The connection is still encrypted, but the
  certificate chain is not verified. A production system handling real data should
  verify it instead.
- **Joining for display.** The project queries join `projects` to `organization` so
  each row arrives with `organization_name` already attached. The alternative — one
  query per project to look up its organization — is the N+1 query problem. They also
  select `p.organization_id`, because a view needs the id to build a link to
  `/organization/:id` and the name alone is not enough.
- **Date handling.** `pg` converts a `DATE` column into a JavaScript `Date`, so
  `projects.ejs`, `project.ejs`, and `category.ejs` format it with
  `toLocaleDateString()`. Printed raw it would render as a full timestamp. The same
  formatting call is now repeated in three templates; a helper on `app.locals` would
  define the format once.
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
- **Cards versus tags.** Every `<ul>` inside `<main>` is styled as a list of cards,
  which suits primary content — the records a page exists to browse. Category tags on
  a project page are different: they are links through the `project_category`
  relation, secondary to the project itself. That list carries `class="tags"`, and
  section 7a of the stylesheet resets the inherited card styles and draws each link as
  a pill.
- **Accessibility.** Colors meet WCAG AA contrast, `:focus-visible` provides a
  keyboard focus ring, `prefers-reduced-motion` is respected, and the uppercase
  `h1` styling is applied with `text-transform` rather than typed as capitals, so
  screen readers read the word rather than spelling it out.

## Known gaps

- `/allprojects` works but nothing links to it; it is reachable only by typing the
  URL. Its organization names are plain text rather than links, because
  `getAllProjects()` does not select `organization_id`.
- The date format is duplicated across three templates rather than defined once.
- **No authentication or authorization.** Anyone who can reach the site can create
  and edit every record. Validating that an id is a positive integer is not the same
  as checking that the requester may edit *that* record, which is the flaw known as
  an insecure direct object reference. Closing it needs a login system.
- **A form that fails validation loses what was typed.** The redirect sends the user
  back to an empty create form or to an edit form re-populated from the database, so
  their edits are discarded along with the error. Keeping them would mean storing
  submitted values in the session alongside the flash messages.
- **`updateCategoryAssignments` is not transactional.** It deletes every assignment
  and then re-inserts. If an insert failed partway, the project would be left with
  fewer categories than it started with. Wrapping both in `BEGIN`/`COMMIT` would make
  it all-or-nothing.
- **No concurrency control on edits.** The edit forms submit every field, so two
  people saving the same record means the later save silently overwrites changes the
  second person never saw.
- `logoFilename` on the edit-organization form is accepted without a validation rule.
  The views escape it with `<%=` and `express.static` blocks path traversal, so it is
  not exploitable, but it is unchecked input reaching the database.

## Course

CSE 340 — Web Backend Development, Brigham Young University-Idaho.
