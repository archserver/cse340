// Import any model functions to retrieve information from the projects table in the DB
import { getAllProjects, getUpcomingProjects, getProjectDetails } from '../models/projects.js';

// How many upcoming projects the /projects page lists. Named rather than passing
  // a bare 5 to the model, so the number has a meaning attached to it and changes
  // in one place.
  const NUMBER_OF_UPCOMING_PROJECTS = 5;
  
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
      const projectId = req.params.id;
      const project = await getProjectDetails(projectId);

      if (!project) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const title = project.title;

      res.render('project', { title, project });
  };

// Export project controller functions
export { showAllProjectsPage, showProjectsPage, showProjectDetailsPage };