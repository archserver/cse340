// Import Categories model functions to retrieve information from categories table in DB
import { getAllCategories, getCategoryDetails, getCategoriesByProjectId, updateCategoryAssignments, createCategory, updateCategory } from '../models/categories.js';
import { getProjectsByCategoryId, getProjectDetails } from '../models/projects.js';
// Import express validation functions
import { body, validationResult } from 'express-validator'


 /**
   * Server-side validation rules for the category form.
   *
   * Both columns are NOT NULL in the database, so notEmpty() is required rather
   * than optional politeness. The 100-character cap mirrors category.name's
   * varchar(100) - exceeding it would be a Postgres error and a 500, so it is
   * caught here and returned as a readable message instead.
   *
   * description is a TEXT column with no database limit, so 500 is a product
   * choice, kept in step with the maxlength on both forms.
   */
  const categoryValidation = [
      body('name')
          .trim()
          .notEmpty()
          .withMessage('Category name is required')
          .isLength({ min: 3, max: 100 })
          .withMessage('Category name must be between 3 and 100 characters'),
      body('description')
          .trim()
          .notEmpty()
          .withMessage('Category description is required')
          .isLength({ max: 500 })
          .withMessage('Category description cannot exceed 500 characters')
  ];

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

/**
* Display the form for adding a new category.
*/
const showNewCategoryForm = async (req, res) => { 
    const title = 'Add New Category'; 
    res.render('new-category', { title });
};

/**
* Handle the new category form submission.
*
* categoryValidation has already run as route middleware, so validationResult()
* only has to read what it recorded.
*/
const processNewCategoryForm = async (req, res) => {
    const results = validationResult(req);
    if (!results.isEmpty()) {
        // Validation failed - queue each message for the next page render
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        return res.redirect('/new-category');
    }

    const { name, description } = req.body;

    const categoryId = await createCategory(name, description);

    req.flash('success', 'Category added successfully!');
    res.redirect(`/category/${categoryId}`);
};

/**
* Display the form for editing an existing category.
*
* The category is loaded here so the view can pre-fill both fields with the
* current values.
*/
const showEditCategoryForm = async (req, res, next) => {
    const categoryId = Number(req.params.id); // convert to number because by default it is a string

    // An inproper id is a 404, not a 500 - same guard used elsewhere
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

    const title = 'Edit Category';

    res.render('edit-category', { title, category });
};

/**
* Handle the edit category form submission.
*
* The id is checked before validationResult() so an obviously bad id never
* costs a database round-trip. A validation failure returns the user to THIS
* category's edit form, not the create form, so the record is not lost.
*/
const processEditCategoryForm = async (req, res, next) => {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId < 1) {
        const err = new Error('Category Not Found');
        err.status = 404;
        return next(err);
    }

    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        return res.redirect(`/edit-category/${categoryId}`);
    }

    const { name, description } = req.body;

    await updateCategory(categoryId, name, description);

    req.flash('success', 'Category updated successfully!');
    res.redirect(`/category/${categoryId}`);
};


// Export categories controller functions
export { showCategoriesPage, showCategoryDetailsPage, showAssignCategoriesForm, processAssignCategoriesForm, showNewCategoryForm, processNewCategoryForm, showEditCategoryForm, processEditCategoryForm, categoryValidation };