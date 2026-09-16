import express from 'express';


// import from controlles
import { showHomePage } from './controllers/index.js';
import { showOrganizationsPage, showOrganizationDetailsPage } from './controllers/organizations.js';
import { showAllProjectsPage, showProjectsPage, showProjectDetailsPage } from './controllers/projects.js';
import { showCategoriesPage } from './controllers/categories.js';
import { testErrorPage } from './controllers/errors.js';

const router = express.Router();

/**
 * Routes
 *
 * 
 */

router.get('/', showHomePage);
router.get('/organizations', showOrganizationsPage);
router.get('/allprojects', showAllProjectsPage);
router.get('/projects', showProjectsPage);
router.get('/project/:id', showProjectDetailsPage);
router.get('/categories', showCategoriesPage);
router.get(`/organization/:id`, showOrganizationDetailsPage);

// error-handling routes
router.get('/test-error', testErrorPage);

export default router;