// Controll of calling the index page  

const showHomePage = async (req, res) => {
    const title = 'Home';
    res.render('home', { title });
};

// Export any controller functions
export { showHomePage };