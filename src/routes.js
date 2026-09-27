import express from 'express';


// import from controlles
import { showHomePage } from './controllers/index.js';
import { showOrganizationsPage, showOrganizationDetailsPage, showNewOrganizationForm, processNewOrganizationForm, showEditOrganizationForm, processEditOrganizationForm, organizationValidation } from './controllers/organizations.js';
import { showAllProjectsPage, showProjectsPage, showProjectDetailsPage, showNewProjectForm, processNewProjectForm, showEditProjectForm, processEditProjectForm, projectValidation } from './controllers/projects.js';
import { showCategoriesPage, showCategoryDetailsPage, showAssignCategoriesForm, processAssignCategoriesForm, showNewCategoryForm, processNewCategoryForm, showEditCategoryForm, processEditCategoryForm, categoryValidation } from './controllers/categories.js';
import { testErrorPage } from './controllers/errors.js';
import { showUserRegistrationForm, processUserRegistrationForm, userValidation, showLoginForm, processLoginForm, loginValidation, processLogout, requireLogin, showDashboard, requireRole, showUsersPage } from './controllers/users.js';

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
router.get(`/new-organization`, requireRole('admin'), showNewOrganizationForm);
// Route to handle new organization form submission
router.post('/new-organization', requireRole('admin'), organizationValidation, processNewOrganizationForm);
// Route to handle editing an organization
router.get('/edit-organization/:id', requireRole('admin'), showEditOrganizationForm);
// Route to handle proccessing of the edit of an organization form submission
router.post('/edit-organization/:id', requireRole('admin'), organizationValidation, processEditOrganizationForm);

/*
*
* Service Projetc routes
* 
*/
router.get('/allprojects', showAllProjectsPage);
router.get('/projects', showProjectsPage);
// Route to display the new project form
router.get('/new-project', requireRole('admin'), showNewProjectForm);
// Route to handle new project form submission. projectValidation runs first as
// middleware, recording any failures for the controller to read.
router.post('/new-project', requireRole('admin'), projectValidation, processNewProjectForm);
// Route to display the edit project form
router.get('/edit-project/:id', requireRole('admin'), showEditProjectForm);
// Route to handle the edit project form submission
router.post('/edit-project/:id', requireRole('admin'), projectValidation, processEditProjectForm);
router.get('/project/:id', showProjectDetailsPage);

/*
*
* Cetegory routes
* 
*/
router.get('/categories', showCategoriesPage);
router.get('/category/:id', showCategoryDetailsPage);
// Route to display the assign categories form for one project
router.get('/assign-categories/:projectId', requireRole('admin'), showAssignCategoriesForm);
// Route to handle the assign categories form submission
router.post('/assign-categories/:projectId', requireRole('admin'), processAssignCategoriesForm);
// Route to display the new category form
router.get('/new-category', requireRole('admin'), showNewCategoryForm);
// Route to handle new category form submission
router.post('/new-category', requireRole('admin'), categoryValidation, processNewCategoryForm);
// Route to display the edit category form
router.get('/edit-category/:id', requireRole('admin'), showEditCategoryForm);
// Route to handle the edit category form submission
router.post('/edit-category/:id', requireRole('admin'), categoryValidation, processEditCategoryForm);

/*
*
* User Routes
* 
*/

// Route to display the registration form
router.get('/register', showUserRegistrationForm);
// Route to handle registration; userValidation runs first as middleware
router.post('/register', userValidation, processUserRegistrationForm);
// Route to display the login form
router.get('/login', showLoginForm);
// Route to handle login. loginValidation normalises the email exactly as
// registration did, so a stored address is actually found.
router.post('/login', loginValidation, processLoginForm);
// Route to log out and destroy the session
router.get('/logout', processLogout);
// Route for User Dashboard
router.get('/dashboard', requireLogin, showDashboard);
// Route for the admin-only users list. requireLogin runs first so a signed-out
// visitor is sent to log in rather than told they lack permission.
router.get('/users', requireLogin, requireRole('admin'), showUsersPage);

// error-handling routes
router.get('/test-error', testErrorPage);

export default router;