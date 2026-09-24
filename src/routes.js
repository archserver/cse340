import express from 'express';


// import from controlles
import { showHomePage } from './controllers/index.js';
import { showOrganizationsPage, showOrganizationDetailsPage, showNewOrganizationForm, processNewOrganizationForm, showEditOrganizationForm, processEditOrganizationForm, organizationValidation } from './controllers/organizations.js';
import { showAllProjectsPage, showProjectsPage, showProjectDetailsPage, showNewProjectForm, processNewProjectForm, showEditProjectForm, processEditProjectForm, projectValidation } from './controllers/projects.js';
import { showCategoriesPage, showCategoryDetailsPage, showAssignCategoriesForm, processAssignCategoriesForm, showNewCategoryForm, processNewCategoryForm, showEditCategoryForm, processEditCategoryForm, categoryValidation } from './controllers/categories.js';
import { testErrorPage } from './controllers/errors.js';

const router = express.Router();

/**
* 
*  Routes
* 
*/
router.get('/', showHomePage);

/**
* 
* Organization Routes
* 
*/

router.get('/organizations', showOrganizationsPage);
router.get(`/organization/:id`, showOrganizationDetailsPage);
router.get(`/new-organization`, showNewOrganizationForm);
// Route to handle new organization form submission
router.post('/new-organization', organizationValidation, processNewOrganizationForm);
// Route to handle editing an organization
router.get('/edit-organization/:id', showEditOrganizationForm);
// Route to handle proccessing of the edit of an organization form submission
router.post('/edit-organization/:id', organizationValidation, processEditOrganizationForm);

/*
*
* Service Projetc routes
* 
*/
router.get('/allprojects', showAllProjectsPage);
router.get('/projects', showProjectsPage);
// Route to display the new project form
router.get('/new-project', showNewProjectForm);
// Route to handle new project form submission. projectValidation runs first as
// middleware, recording any failures for the controller to read.
router.post('/new-project', projectValidation, processNewProjectForm);
// Route to display the edit project form
router.get('/edit-project/:id', showEditProjectForm);
// Route to handle the edit project form submission
router.post('/edit-project/:id', projectValidation, processEditProjectForm);
router.get('/project/:id', showProjectDetailsPage);

/*
*
* Cetegory routes
* 
*/
router.get('/categories', showCategoriesPage);
router.get('/category/:id', showCategoryDetailsPage);
// Route to display the assign categories form for one project
router.get('/assign-categories/:projectId', showAssignCategoriesForm);
// Route to handle the assign categories form submission
router.post('/assign-categories/:projectId', processAssignCategoriesForm);
// Route to display the new category form
router.get('/new-category', showNewCategoryForm);
// Route to handle new category form submission
router.post('/new-category', categoryValidation, processNewCategoryForm);
// Route to display the edit category form
router.get('/edit-category/:id', showEditCategoryForm);
// Route to handle the edit category form submission
router.post('/edit-category/:id', categoryValidation, processEditCategoryForm);



// error-handling routes
router.get('/test-error', testErrorPage);

export default router;