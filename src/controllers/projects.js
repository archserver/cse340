// Import any model functions to retrieve information from the projects table in the DB
import { getAllProjects } from '../models/projects.js';

// Define Projects controller functions for retrieving and showing Project information
const showProjectsPage = async (req, res) => {
    const projects = await getAllProjects();
    const title = 'Service Projects';

    res.render('projects', { title, projects });
};  

// Export project controller functions
export { showProjectsPage };