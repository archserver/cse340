//Import model function to retrieve organization information from the DB
import { getAllOrganizations, getOrganizationDetails } from '../models/organizations.js';
//Import model function to retrieve the projects by the organization id
import { getProjectsByOrganizationId } from '../models/projects.js';

// Define controller function(s)
// request and display organization information.
const showOrganizationsPage = async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Our Partner Organizations';

    res.render(`organizations`, { title, organizations });
};
// show the organization detailed information
const showOrganizationDetailsPage = async (req, res) => {
    const organizationId = req.params.id;
    const organizationDetails = await getOrganizationDetails(organizationId);
    const projects = await getProjectsByOrganizationId(organizationId);
    const title = 'Organization Details';

    res.render('organization', {title, organizationDetails, projects});
};

//

//Export controller functions 
export {showOrganizationsPage, showOrganizationDetailsPage};