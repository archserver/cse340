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
import router from './src/routes.js';

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

// Middleware to log all incoming requests
app.use((req, res, next) => {
    if (nodeEnv === 'development') {
        console.log(`${req.method} ${req.url}`);
    }
    next(); // Pass control to the next middleware or route
});

// Middleware to make NodeEnv avaliable to all templates
app.use((req, res, next) => {
    res.locals.nodeEnv = nodeEnv;
    next();
});

// Serve static files from the public directory. Contents are exposed at the site
// root, so public/css/main.css is requested as /css/main.css.

app.use(express.static(path.join(__dirname, 'public')));


// Use the imported touter for routes
app.use(router);

// 404 not found error handler
// Catch-all route for 404 errors
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Global error handler
app.use((err, req, res, next) => {
    // Log error details for debugging
    console.error('Error occurred:', err.message);
    console.error('Stack trace:', err.stack);
    
    // Determine status and template
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';
    
    // Prepare data for the template
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };
    
    // Render the appropriate error template
    res.status(status).render(`errors/${template}`, context);
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
