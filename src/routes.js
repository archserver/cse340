import express from 'express';


// import from controlles
import { showHomePage } from './controllers/index.js';
import { showOrganizationsPage, showOrganizationDetailsPage, showNewOrganizationForm, processNewOrganizationForm, showEditOrganizationForm, processEditOrganizationForm, organizationValidation } from './controllers/organizations.js';
import { showAllProjectsPage, showProjectsPage, showProjectDetailsPage, showNewProjectForm, processNewProjectForm, projectValidation } from './controllers/projects.js';
import { showCategoriesPage, showCategoryDetailsPage, showAssignCategoriesForm, processAssignCategoriesForm } from './controllers/categories.js';
import { testErrorPage } from './controllers/errors.js';

const router = express.Router();

/**
 * Routes
 *
 * 
 */

router.get('/', showHomePage);
router.get('/organizations', showOrganizationsPage);
router.get(`/organization/:id`, showOrganizationDetailsPage);
router.get(`/new-organization`, showNewOrganizationForm);
// Route to handle new organization form submission
router.post('/new-organization', organizationValidation, processNewOrganizationForm);
// Route to handle editing an organization
router.get('/edit-organization/:id', showEditOrganizationForm);
// Route to handle proccessing of the edit of an organization form submission
router.post('/edit-organization/:id', organizationValidation, processEditOrganizationForm);
router.get('/allprojects', showAllProjectsPage);
router.get('/projects', showProjectsPage);
// Route to display the new project form
router.get('/new-project', showNewProjectForm);
// Route to handle new project form submission. projectValidation runs first as
// middleware, recording any failures for the controller to read.
router.post('/new-project', projectValidation, processNewProjectForm);
router.get('/project/:id', showProjectDetailsPage);
router.get('/categories', showCategoriesPage);
router.get('/category/:id', showCategoryDetailsPage);
// Route to display the assign categories form for one project
router.get('/assign-categories/:projectId', showAssignCategoriesForm);
// Route to handle the assign categories form submission
router.post('/assign-categories/:projectId', processAssignCategoriesForm);


// error-handling routes
router.get('/test-error', testErrorPage);

export default router;