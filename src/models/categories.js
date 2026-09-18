/**
 * Data access for the category table.
 *
 * Categories relate to projects many-to-many through the project_category
 * junction table, lists the categories themselves and a query that joins 
 * projects to their categorie.
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
};

/**
   * Fetch a single category by its id.
   *
   * @returns {Promise<Object|null>} category_id, name, and description, or null
   *                                 when no category has that id.
   */
  const getCategoryDetails = async (categoryId) => {
      const query = `
          SELECT category_id, name, description
          FROM public.category
          WHERE category_id = $1;
      `;

      const result = await db.query(query, [categoryId]);

      return result.rows.length > 0 ? result.rows[0] : null;
  };

  /**
   * Fetch every category a service project belongs to, through project_category.
   *
   * @returns {Promise<Array<Object>>} category_id and name, alphabetical.
   */
  const getCategoriesByProjectId = async (projectId) => {
      const query = `
          SELECT c.category_id, c.name
          FROM public.category AS c
          JOIN public.project_category AS pc
            ON pc.category_id = c.category_id
          WHERE pc.project_id = $1
          ORDER BY c.name;
      `;

      const result = await db.query(query, [projectId]);

      return result.rows;
  };

export {getAllCategories, getCategoryDetails, getCategoriesByProjectId}
