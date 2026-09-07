import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { testConnection } from './src/models/db.js';
import { getAllOrganizations } from './src/models/organizations.js';
import { getAllProjects } from './src/models/projects.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeEnv = process.env.NODE_ENV?.toLowerCase() || 'production';
const hostPort = process.env.PORT || 3000;

const app = express();

/**
 *  Set EJS
 */

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Tell Express where to find your templates
app.set('views', path.join(__dirname, 'src/views'));


/**
  * Configure Express middleware
  */

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

/**
  * Routes
  */
app.get('/', async (req, res) => {
    const title = 'Home';
    res.render('home', { title });
});

app.get('/organizations', async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Our Partner Organizations';

    res.render(`organizations`, { title, organizations });
});

app.get('/projects', async (req, res) => {
    const projects = await getAllProjects();
    const title = 'Service Projects';
    res.render('projects', { title, projects });
});

app.get('/categories', async (req, res) => {
    const title = 'Service Project Categories';
    res.render('categories', { title });
});

app.listen(hostPort, async () => {
  try {
    await testConnection();
    console.log(`Server is running at http://127.0.0.1:${hostPort}`);
    console.log(`Environment: ${nodeEnv}`);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
});