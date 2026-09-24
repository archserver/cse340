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

// retrieve the projects that are asssociated with an organization ID
const getProjectsByOrganizationId = async (organizationId) => {
      const query = `
        SELECT
          project_id,
          organization_id,
          title,
          description,
          location,
          event_date
        FROM public.projects
        WHERE organization_id = $1
        ORDER BY event_date;
      `;
      
      const queryParams = [organizationId];
      const result = await db.query(query, queryParams);

      return result.rows;
};

 /**
   * Fetch the next N upcoming service projects, soonest first.
   *
   * "Upcoming" means on or after today, so a project happening later today still
   * counts. CURRENT_DATE is evaluated by PostgreSQL, not Node, so the cutoff comes
   * from the database server's clock rather than the web server's.
   *
   * @param   {number} number_of_projects  How many projects to return.
   * @returns {Promise<Array<Object>>} One object per project, with the keys
   *                                   project_id, title, description, location,
   *                                   event_date, organization_id, and
   *                                   organization_name. event_date arrives as a
   *                                   JavaScript Date.
   */
  const getUpcomingProjects = async (number_of_projects) => {
      const query = `
          SELECT p.project_id,
                 p.title,
                 p.description,
                 p.location,
                 p.event_date,
                 p.organization_id,
                 o.name AS organization_name
          FROM public.projects AS p
          JOIN public.organization AS o
            ON p.organization_id = o.organization_id
          WHERE p.event_date >= CURRENT_DATE
          ORDER BY p.event_date ASC
          LIMIT $1;
      `;

      const queryParams = [number_of_projects];
      const result = await db.query(query, queryParams);

      return result.rows;
  };

/**
   * Fetch a single service project by its id, with the organization running it.
   *
   * @param   {number|string} projectId  The project_id to look up.
   * @returns {Promise<Object|null>} One object with the keys project_id, title,
   *                                 description, location, event_date,
   *                                 organization_id, and organization_name, or
   *                                 null when no project has that id.
   */
  const getProjectDetails = async (projectId) => {
      const query = `
          SELECT p.project_id,
                 p.title,
                 p.description,
                 p.location,
                 p.event_date,
                 p.organization_id,
                 o.name AS organization_name
          FROM public.projects AS p
          JOIN public.organization AS o
            ON p.organization_id = o.organization_id
          WHERE p.project_id = $1;
      `;

      const queryParams = [projectId];
      const result = await db.query(query, queryParams);

      // Return the first row, or null if no project has that id.
      return result.rows.length > 0 ? result.rows[0] : null;
  };

  /**
   * Fetch every service project in a category, through project_category.
   *
   * @returns {Promise<Array<Object>>} project_id, title, and event_date, soonest first.
   */
  const getProjectsByCategoryId = async (categoryId) => {
      const query = `
          SELECT p.project_id, p.title, p.event_date
          FROM public.projects AS p
          JOIN public.project_category AS pc
            ON pc.project_id = p.project_id
          WHERE pc.category_id = $1
          ORDER BY p.event_date;
      `;

      const result = await db.query(query, [categoryId]);

      return result.rows;
  };

/**
   * Insert a new service project and return its generated id.
   *
   * RETURNING is a PostgreSQL feature that hands back a column from the row just
   * inserted, so the caller learns the new project_id without a second SELECT.
   * The date arrives from the form as a YYYY-MM-DD string, which PostgreSQL
   * accepts directly for a date column - no parsing is needed in Node.
   *
   * Note the column is event_date, not date, and the table is plural (projects)
   * unlike organization.
   *
   * @param   {string} title           The project title.
   * @param   {string} description     A description of the project.
   * @param   {string} location        Where the project takes place.
   * @param   {string} date            The event date as YYYY-MM-DD.
   * @param   {number} organizationId  The organization running the project.
   * @returns {Promise<number>} The id of the newly created project.
   */
  const createProject = async (title, description, location, date, organizationId) => {
      const query = `
          INSERT INTO public.projects (title, description, location, event_date, organization_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING project_id;
      `;

      const queryParams = [title, description, location, date, organizationId];
      const result = await db.query(query, queryParams);

      // An INSERT ... RETURNING always yields a row on success, so an empty
      // result means the insert did not happen and the caller must not continue.
      if (result.rows.length === 0) {
          throw new Error('Failed to create project');
      }

      return result.rows[0].project_id;
  };

/**
   * Update an existing service project.
   *
   * organization_id is included so a project can be reassigned to a different
   * organization as part of the edit, not just have its text fields changed.
   *
   * RETURNING gives back the id only when a row actually matched. An empty
   * result therefore means no project had that id, which is an error the caller
   * needs to know about rather than a silent no-op.
   *
   * @param   {number} projectId       The project to update.
   * @param   {string} title           The project title.
   * @param   {string} description     A description of the project.
   * @param   {string} location        Where the project takes place.
   * @param   {string} date            The event date as YYYY-MM-DD.
   * @param   {number} organizationId  The organization running the project.
   * @returns {Promise<number>} The id of the updated project.
   */
  const updateProject = async (projectId, title, description, location, date, organizationId) => {
      const query = `
          UPDATE public.projects
          SET title = $1, description = $2, location = $3, event_date = $4, organization_id = $5
          WHERE project_id = $6
          RETURNING project_id;
      `;

      const queryParams = [title, description, location, date, organizationId, projectId];
      const result = await db.query(query, queryParams);

      if (result.rows.length === 0) {
          throw new Error('Project not found');
      }

      return result.rows[0].project_id;
  };

// export project functions
export {getAllProjects, getProjectsByOrganizationId, getUpcomingProjects, getProjectDetails, getProjectsByCategoryId, createProject, updateProject}
