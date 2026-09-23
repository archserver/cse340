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

  /**
   * Link one category to one project in the junction table.
   *
   * Not exported - updateCategoryAssignments below is the only caller, and
   * assignments are always changed as a complete set rather than one at a time.
   *
   * ON CONFLICT DO NOTHING makes the insert idempotent: if the pair already
   * exists it is skipped instead of raising a duplicate key error.
   *
   * @param {number} projectId   The project to link.
   * @param {number} categoryId  The category to link it to.
   */
  const assignCategoryToProject = async (projectId, categoryId) => {
      const query = `
          INSERT INTO public.project_category (project_id, category_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
      `;

      await db.query(query, [projectId, categoryId]);
  };

  /**
   * Replace a project's category assignments with a new set.
   *
   * Delete-then-insert is used rather than working out which rows to add and
   * which to remove. The junction table holds nothing but the pairing itself -
   * no timestamps or extra columns - so there is no data to preserve, and
   * replacing the whole set is simpler and harder to get wrong.
   *
   * An empty or missing categoryIds array is valid: it clears every assignment,
   * which is how a user removes the last category from a project.
   *
   * @param {number}         projectId    The project whose assignments change.
   * @param {Array<number>}  categoryIds  The complete set of categories it should have.
   */
  const updateCategoryAssignments = async (projectId, categoryIds) => {
      // Remove every existing assignment for this project first
      const deleteQuery = `
          DELETE FROM public.project_category
          WHERE project_id = $1;
      `;

      await db.query(deleteQuery, [projectId]);

      // Then add back only the categories that were selected
      for (const categoryId of categoryIds) {
          await assignCategoryToProject(projectId, categoryId);
      }
  };

export {getAllCategories, getCategoryDetails, getCategoriesByProjectId, updateCategoryAssignments}
