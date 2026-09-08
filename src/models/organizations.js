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

export {getAllOrganizations}
