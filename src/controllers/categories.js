// Import Categories model functions to retrieve information from categories table in DB
import { getAllCategories, getCategoryDetails, getCategoriesByProjectId, updateCategoryAssignments } from '../models/categories.js';
import { getProjectsByCategoryId, getProjectDetails } from '../models/projects.js';

// Define categories controller function to rretrieve and diaplay categories page
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Categories';

    res.render('categories', { title, categories });
};  

// Show one category and every project filed under it
  const showCategoryDetailsPage = async (req, res, next) => {
      const categoryId = Number(req.params.id);

      if (!Number.isInteger(categoryId) || categoryId < 1) {
          const err = new Error('Category Not Found');
          err.status = 404;
          return next(err);
      }

      const category = await getCategoryDetails(categoryId);

      if (!category) {
          const err = new Error('Category Not Found');
          err.status = 404;
          return next(err);
      }

      const projects = await getProjectsByCategoryId(categoryId);
      const title = category.name;

      res.render('category', { title, category, projects });
  };

  /**
   * Display the form for assigning categories to a project.
   *
   * Three pieces of data are needed: the project (for its title), every
   * category (to draw a checkbox for each), and the project's current
   * assignments (to decide which boxes start checked).
   */
  const showAssignCategoriesForm = async (req, res, next) => {
      const projectId = Number(req.params.projectId);

      // A malformed id is a 404, not a 500 - the same guard used elsewhere
      if (!Number.isInteger(projectId) || projectId < 1) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const project = await getProjectDetails(projectId);

      if (!project) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const categories = await getAllCategories();
      const assignedCategories = await getCategoriesByProjectId(projectId);
      const title = 'Assign Categories to Project';

      res.render('assign-categories', { title, project, categories, assignedCategories });
  };

  /**
   * Handle the assign categories form submission.
   *
   * Checkbox groups do not submit a consistent shape: with none checked the
   * field is missing entirely, with one checked it arrives as a single string,
   * and only with two or more is it an array. The normalisation below turns all
   * three cases into an array so the model always receives the same type.
   */
  const processAssignCategoriesForm = async (req, res, next) => {
      const projectId = Number(req.params.projectId);

      if (!Number.isInteger(projectId) || projectId < 1) {
          const err = new Error('Project Not Found');
          err.status = 404;
          return next(err);
      }

      const submitted = req.body.categoryIds;
      const categoryIds = submitted === undefined
          ? []                                            // nothing checked
          : Array.isArray(submitted) ? submitted : [submitted];  // one or many

      await updateCategoryAssignments(projectId, categoryIds);

      req.flash('success', 'Categories updated successfully!');
      res.redirect(`/project/${projectId}`);
  };

// Export categories controller functions
export { showCategoriesPage, showCategoryDetailsPage, showAssignCategoriesForm, processAssignCategoriesForm };