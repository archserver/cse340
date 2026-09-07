import db from './db.js'

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