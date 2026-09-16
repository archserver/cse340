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
const showOrganizationDetailsPage = async (req, res, next) => {
    const organizationId = Number(req.params.id); // convert to number because by default it is a string

    // Validate it is and intinger and not a string for a 500 error just give 404 page not found
    if (!Number.isInteger(organizationId) || organizationId < 1) {
      const err = new Error('Organization Not Found');
      err.status = 404;
      return next(err);
  }

    const organizationDetails = await getOrganizationDetails(organizationId);
    const projects = await getProjectsByOrganizationId(organizationId);
    const title = 'Organization Details';

    if (!organizationDetails) {
          const err = new Error('Organization Not Found');
          err.status = 404;
          return next(err);
      }

    res.render('organization', {title, organizationDetails, projects});
};

//

//Export controller functions 
export {showOrganizationsPage, showOrganizationDetailsPage};