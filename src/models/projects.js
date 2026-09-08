/**
 * Data access for the projects table.
 *
 * Projects belong to an organization through the organization_id foreign key,
 * so the query here joins the two tables to return display-ready rows.
 */

import db from './db.js'

/**
 * Fetch every service project along with the name of the organization running it.
 *
 * The JOIN resolves organization_id (a number, meaningless to a visitor) into the
 * organization's name. Table aliases `p` and `o` are required because both tables
 * define a `description` column - without them the reference would be ambiguous.
 * The result of o.name is aliased to organization_name so it cannot be confused
 * with a project column once the row reaches the template.
 *
 * Rows are ordered by date so the page reads as a chronological schedule.
 *
 * @returns {Promise<Array<Object>>} One object per project, with the keys
 *                                   project_id, title, description, location,
 *                                   event_date, and organization_name.
 *                                   event_date arrives as a JavaScript Date.
 */
const getAllProjects = async() => {
    const query = `
        SELECT p.project_id, p.title, p.description, p.location, p.event_date, o.name AS organization_name
      FROM public.projects AS p
      JOIN public.organization AS o
      ON p.organization_id = o.organization_id
      ORDER BY p.event_date;
    `;

    const result = await db.query(query);

    return result.rows;
}

export {getAllProjects}
