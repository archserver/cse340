//Import model function to retrieve organization information from the DB
import { getAllOrganizations } from '../models/organizations.js';

// Define controller function(s) to request and display organization information.
const showOrganizationsPage = async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Our Partner Organizations';

    res.render(`organizations`, { title, organizations });
};

//Export controller functions 
export {showOrganizationsPage};