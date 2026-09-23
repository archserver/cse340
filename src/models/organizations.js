/**
 * Data access for the organization table.
 *
 * Every function here returns plain JavaScript objects and knows nothing about
 * Express or EJS. Keeping SQL confined to the models directory means the routes
 * in server.js stay readable and the queries can be reused or changed in one place.
 */

import db from './db.js'

/**
 * Fetch every partner organization.
 *
 * Columns are listed explicitly rather than using SELECT *, so adding a column
 * to the table later cannot silently change what the views receive.
 *
 * @returns {Promise<Array<Object>>} One object per organization, with the keys
 *                                   organization_id, name, description,
 *                                   contact_email, and logo_filename.
 */
const getAllOrganizations = async() => {
    const query = `
        SELECT organization_id, name, description, contact_email, logo_filename
      FROM public.organization;
    `;

    const result = await db.query(query);

    // result.rows is the array of records; the rest of the result object
    // (row counts, field metadata) is not needed by the views.
    return result.rows;
}
// get the detail of an organization
const getOrganizationDetails = async (organizationId) => {
      const query = `
      SELECT
        organization_id,
        name,
        description,
        contact_email,
        logo_filename
      FROM organization
      WHERE organization_id = $1;
    `;

      const queryParams = [organizationId];
      const result = await db.query(query, queryParams);

      // Return the first row of the result set, or null if no rows are found
      return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Creates a new organization in the database.
 * @param {string} name - The name of the organization.
 * @param {string} description - A description of the organization.
 * @param {string} contactEmail - The contact email for the organization.
 * @param {string} logoFilename - The filename of the organization's logo.
 * @returns {string} The id of the newly created organization record.
 */
const createOrganization = async (name, description, contactEmail, logoFilename) => {
    const query = `
      INSERT INTO organization (name, description, contact_email, logo_filename)
      VALUES ($1, $2, $3, $4)
      RETURNING organization_id
    `;

    const queryParams = [name, description, contactEmail, logoFilename];
    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
        throw new Error('Failed to create organization');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new organization with ID:', result.rows[0].organization_id);
    }

    return result.rows[0].organization_id;
};

const updateOrganization = async (organizationId, name, description, contactEmail, logoFilename) => {
  const query = `
    UPDATE organization
    SET name = $1, description = $2, contact_email = $3, logo_filename = $4
    WHERE organization_id = $5
    RETURNING organization_id;
  `;

  const queryParams = [name, description, contactEmail, logoFilename, organizationId];
  const result = await db.query(query, queryParams);

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  if (process.env.ENABLE_SQL_LOGGING === 'true') {
    console.log('Updated organization with ID:', organizationId);
  }

  return result.rows[0].organization_id;
};

// export model functions
export {getAllOrganizations, getOrganizationDetails, createOrganization, updateOrganization}
