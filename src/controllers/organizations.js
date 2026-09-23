//Import model function to retrieve organization information from the DB
import { getAllOrganizations, getOrganizationDetails, createOrganization, updateOrganization } from '../models/organizations.js';
//Import model function to retrieve the projects by the organization id
import { getProjectsByOrganizationId } from '../models/projects.js';
// Import express validation functions
import { body, validationResult } from 'express-validator';

// Define validation and sanitization rules for organization form
// Define validation rules for organization form
const organizationValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Organization name is required')
        .isLength({ min: 3, max: 150 })
        .withMessage('Organization name must be between 3 and 150 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Organization description is required')
        .isLength({ max: 500 })
        .withMessage('Organization description cannot exceed 500 characters'),
    body('contactEmail')
        .normalizeEmail()
        .notEmpty()
        .withMessage('Contact email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
];

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

const showNewOrganizationForm = async (req, res) => {
    const title = 'Add New Organization';

    res.render('new-organization', { title });
}

const processNewOrganizationForm = async (req, res) => {
    // Check for validation errors
    const results = validationResult(req);
    if (!results.isEmpty()) {
        // Validation failed - loop through errors
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        // Redirect back to the new organization form
        return res.redirect('/new-organization');
    }

    const { name, description, contactEmail } = req.body;
    const logoFilename = 'placeholder-logo.png'; // Use the placeholder logo for all new organizations    

    const organizationId = await createOrganization(name, description, contactEmail, logoFilename);
    req.flash('success', 'Organization added successfully!');
    res.redirect(`/organization/${organizationId}`);
};

const showEditOrganizationForm = async (req, res, next) => {
    const organizationId = Number(req.params.id); // convert to number because by default it is a string

    // Validate it is and intinger and not a string for a 500 error just give 404 page not found
    if (!Number.isInteger(organizationId) || organizationId < 1) {
      const err = new Error('Organization Not Found');
      err.status = 404;
      return next(err);
  }

    const organizationDetails = await getOrganizationDetails(organizationId);
    const title = 'Edit Organization';

    if (!organizationDetails) {
          const err = new Error('Organization Not Found');
          err.status = 404;
          return next(err);
      }

    res.render('edit-organization', {title, organizationDetails });
};

const processEditOrganizationForm = async (req, res, next) => {
    const organizationId = Number(req.params.id); // convert to number because by default it is a string

    // Validate it is an integer; a bad id should be a 404, not a 500
    if (!Number.isInteger(organizationId) || organizationId < 1) {
        const err = new Error('Organization Not Found');
        err.status = 404;
        return next(err);
    }

    // Check for validation errors
    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        // Redirect back to the edit form for this organization
        return res.redirect(`/edit-organization/${organizationId}`);
    }

    const { name, description, contactEmail, logoFilename } = req.body;

    await updateOrganization(organizationId, name, description, contactEmail, logoFilename);

    req.flash('success', 'Organization updated successfully!');
    res.redirect(`/organization/${organizationId}`);
};

//

//Export controller functions 
export {showOrganizationsPage, showOrganizationDetailsPage, showNewOrganizationForm, processNewOrganizationForm, showEditOrganizationForm, processEditOrganizationForm, organizationValidation};