/**
 * CSE 340 Service Network - application entry point.
 *
 * Creates the Express application, configures EJS templating and static file
 * serving, defines the site's routes, and starts the HTTP server.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { testConnection } from './src/models/db.js';
import { getAllOrganizations } from './src/models/organizations.js';
import { getAllProjects } from './src/models/projects.js';
import { getAllCategories } from './src/models/categories.js';

/**
 * Rebuild __filename and __dirname.
 *
 * These are provided automatically in CommonJS but do not exist in ES modules,
 * which this project uses ("type": "module" in package.json). Deriving them from
 * import.meta.url keeps every path below anchored to this file's location rather
 * than to whatever directory the process happens to be started from.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read configuration from the environment.
 *
 * Both fall back to a safe default so the server still starts if a variable is
 * missing. Render assigns PORT at runtime, which is why it must never be
 * hardcoded. Locally these come from .env via the --env-file flag in nodemon.json.
 */
const nodeEnv = process.env.NODE_ENV?.toLowerCase() || 'production';
const hostPort = process.env.PORT || 3000;

const app = express();

/**
 * Set EJS
 */

// Set EJS as the templating engine, so res.render() looks for .ejs files
app.set('view engine', 'ejs');

// Tell Express where to find your templates
app.set('views', path.join(__dirname, 'src/views'));

/**
 * Configure Express middleware
 */

// Serve static files from the public directory. Contents are exposed at the site
// root, so public/css/main.css is requested as /css/main.css.
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routes
 *
 * Every route passes a `title` to res.render(). The header partial reads it into
 * the <title> tag, so each page gets its own browser tab label from one place.
 */

// Home - static content only, no database access needed.
app.get('/', async (req, res) => {
    const title = 'Home';
    res.render('home', { title });
});

// Organizations - lists every partner organization from the database.
app.get('/organizations', async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Our Partner Organizations';

    res.render(`organizations`, { title, organizations });
});

// Service projects - lists every project with the organization that runs it.
app.get('/projects', async (req, res) => {
    const projects = await getAllProjects();
    const title = 'Service Projects';
    res.render('projects', { title, projects });
});

// Categories - lists every service project category from the database.
app.get('/categories', async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Project Categories';
    res.render('categories', { title, categories });
});

/**
 * Start the server.
 *
 * The database connection is tested once at startup so a bad DB_URL or SSL
 * setting shows up immediately in the logs rather than as a 500 on the first
 * request. The error is caught rather than rethrown so the site still serves its
 * static pages even when the database is unreachable.
 */
app.listen(hostPort, async () => {
  try {
    await testConnection();
    console.log(`Server is running at http://127.0.0.1:${hostPort}`);
    console.log(`Environment: ${nodeEnv}`);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
});
