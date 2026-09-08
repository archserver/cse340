/**
 * Data access for the category table.
 *
 * Categories relate to projects many-to-many through the project_category
 * junction table, but that relationship is not queried here - this module only
 * lists the categories themselves. A query that joins projects to their
 * categories would go here too, once the site displays them.
 */

import db from './db.js'

/**
 * Fetch every service project category.
 *
 * @returns {Promise<Array<Object>>} One object per category, with the keys
 *                                   category_id, name, and description.
 */
const getAllCategories = async() => {
    const query = `
        SELECT category_id, name, description
      FROM public.category;
    `;

    const result = await db.query(query);

    return result.rows;
}

export {getAllCategories}
