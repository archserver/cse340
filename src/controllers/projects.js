// Import any model functions to retrieve information from the projects table in the DB
import { getAllProjects, getUpcomingProjects, getProjectDetails, createProject } from '../models/projects.js';
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
        .trim()
        .notEmpty()
        .withMessage('Project title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Project title must be between 3 and 200 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Project description is required')
        .isLength({ max: 1000 })
        .withMessage('Project description cannot exceed 1000 characters'),
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Project location is required')
        .isLength({ max: 200 })
        .withMessage('Project location cannot exceed 200 characters'),
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

// Export project controller functions
export { showAllProjectsPage, showProjectsPage, showProjectDetailsPage, showNewProjectForm, processNewProjectForm, projectValidation };