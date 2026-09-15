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


// export model functions
export {getAllOrganizations, getOrganizationDetails}
