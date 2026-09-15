// Test route for code 500 error

const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
};

// Export the controller function for 500 error test page 
export { testErrorPage };