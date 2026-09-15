// Import Categories model functions to retrieve information from categories table in DB
import { getAllCategories } from '../models/categories.js';

// Define categories controller function to rretrieve and diaplay categories page
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Categories';

    res.render('categories', { title, categories });
};  

// Export categories controller functions
export { showCategoriesPage };