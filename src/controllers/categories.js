// Import Categories model functions to retrieve information from categories table in DB
import { getAllCategories, getCategoryDetails } from '../models/categories.js';
import { getProjectsByCategoryId } from '../models/projects.js';

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

// Export categories controller functions
export { showCategoriesPage, showCategoryDetailsPage };