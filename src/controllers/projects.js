// Import any model functions to retrieve information from the projects table in the DB
import { getAllProjects, getUpcomingProjects, getProjectDetails, createProject, updateProject } from '../models/projects.js';
import { getCategoriesByProjectId } from '../models/categories.js';
// Organizations are needed to populate the dropdown on the new project form
import { getAllOrganizations } from '../models/organizations.js';
// Import express validation functions
import { body, validationResult } from 'express-validator';

// How many upcoming projects the /projects page lists. Named rather than passing
  // a bare 5 to the model, so the number has a meaning attached to it and changes
  // in one place.
  const NUMBER_OF_UPCOMING_PROJECTS = 5;

/**
 * Server-side validation rules for the project form.
 *
 * These run as middleware before the controller, collecting any failures onto
 * the request for validationResult() to read. The matching attributes on the
 * form (required, maxlength, type="date") only help honest browsers - anyone can
 * POST directly with curl, so these rules are the actual enforcement.
 *
 * The limits deliberately mirror the form attributes so a valid submission never
 * fails here for a reason the browser could have caught first.
 */
const projectValidation = [
    body('title')
        // projects.title is varchar(150) - exceeding it would be a database
        // error and a 500, so the validator stops it here as a friendly message
        .trim()
        .notEmpty()
        .withMessage('Project title is required')
        .isLength({ min: 3, max: 150 })
        .withMessage('Project title must be between 3 and 150 characters'),
    body('description')
        // projects.description is TEXT, so 500 is a product choice rather than
        // a database limit - kept in step with the form's maxlength
        .trim()
        .notEmpty()
        .withMessage('Project description is required')
        .isLength({ max: 500 })
        .withMessage('Project description cannot exceed 500 characters'),
    body('location')
        // projects.location is varchar(255); 250 leaves a small margin
        .trim()
        .notEmpty()
        .withMessage('Project location is required')
        .isLength({ max: 250 })
        .withMessage('Project location cannot exceed 250 characters'),
    body('date')
        .notEmpty()
        .withMessage('Project date is required')
        // type="date" submits YYYY-MM-DD, which is an ISO 8601 date
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('organizationId')
        .notEmpty()
        .withMessage('An organization is required')
        // The select submits the organization_id as a string; isInt checks the value
        .isInt({ min: 1 })
        .withMessage('Please select a valid organization')
];

// Define Projects controller functions for retrieving and showing Project information
const showAllProjectsPage = async (req, res) => {
    const projects = await getAllProjects();
    const title = 'Service Projects';

    res.render('allprojects', { title, projects });
};  

  // Define Projects controller functions for retrieving and showing Project information
  const showProjectsPage = async (req, res) => {
      const projects = await getUpcomingProjects(NUMBER_OF_UPCOMING_PROJECTS);
      const title = 'Upcoming Service Projects';

      res.render('projects', { title, projects });
  };

  // Show the details for a single service project
  const showProjectDetailsPage = async (req, res, next) => {
      const projectId = Number(req.params.id); // convert to number because by default it is a string
      
      // Validate it is and intinger and not a string for a 500 error just give 404 page not found
      if (!Number.isInteger(projectId) || projectId < 1) {
      const err = new Error('Project Not Found');
      err.status = 404;
      return next(err);
  }
      const project = await getProjectDetails(projectId);

      if (!project) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const categories = await getCategoriesByProjectId(projectId);
      const title = project.title;

      res.render('project', { title, project, categories });
  };

  /**
   * Display the form for adding a new service project.
   *
   * The organization list is loaded here rather than in the view because a
   * template should not reach into the database - the controller gathers the
   * data and hands the view everything it needs to render.
   */
  const showNewProjectForm = async (req, res) => {
      const organizations = await getAllOrganizations();
      const title = 'Add New Service Project';

      res.render('new-project', { title, organizations });
  };

  /**
   * Handle the new project form submission.
   *
   * projectValidation has already run as route middleware by the time this is
   * called, so validationResult() only has to read what it recorded. On failure
   * the messages go into flash and the user returns to the form; on success the
   * project is inserted and the user is sent to the project list.
   */
  const processNewProjectForm = async (req, res) => {
      // Check for validation errors collected by projectValidation
      const results = validationResult(req);
      if (!results.isEmpty()) {
          // Validation failed - queue each message for display on the next page
          results.array().forEach((error) => {
              req.flash('error', error.msg);
          });

          // Redirect back to the new project form
          return res.redirect('/new-project');
      }

      const { organizationId, title, description, location, date } = req.body;

      await createProject(title, description, location, date, organizationId);

      req.flash('success', 'Project added successfully!');
      res.redirect('/projects');
  };

  /**
   * Display the form for editing an existing service project.
   *
   * Needs two things from the database: the project itself, to pre-fill every
   * field, and the full organization list, so the dropdown can offer a
   * different organization than the one currently assigned.
   */
  const showEditProjectForm = async (req, res, next) => {
      const projectId = Number(req.params.id); // convert to number because by default it is a string

      // A malformed id is a 404, not a 500 - the same guard used elsewhere
      if (!Number.isInteger(projectId) || projectId < 1) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const project = await getProjectDetails(projectId);

      if (!project) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const organizations = await getAllOrganizations();
      const title = 'Edit Service Project';

      res.render('edit-project', { title, project, organizations });
  };

  /**
   * Handle the edit project form submission.
   *
   * The id is validated before validationResult() so an obviously bad id never
   * costs a database round-trip. On a validation failure the user returns to
   * this project's edit form rather than the create form, so the record being
   * edited is not lost.
   */
  const processEditProjectForm = async (req, res, next) => {
      const projectId = Number(req.params.id); // convert to number because by default it is a string

      if (!Number.isInteger(projectId) || projectId < 1) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      // Check for validation errors collected by projectValidation
      const results = validationResult(req);
      if (!results.isEmpty()) {
          results.array().forEach((error) => {
              req.flash('error', error.msg);
          });

          // Redirect back to this project's edit form
          return res.redirect(`/edit-project/${projectId}`);
      }

      const { organizationId, title, description, location, date } = req.body;

      await updateProject(projectId, title, description, location, date, organizationId);

      req.flash('success', 'Project updated successfully!');
      res.redirect(`/project/${projectId}`);
  };

// Export project controller functions
export { showAllProjectsPage, showProjectsPage, showProjectDetailsPage, showNewProjectForm, processNewProjectForm, showEditProjectForm, processEditProjectForm, projectValidation };