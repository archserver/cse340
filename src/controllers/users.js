import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { createUser, authenticateUser, getAllUsers } from '../models/users.js';

/**
 * Server-side validation rules for the registration form.
 *
 * Length caps come from the users table: name and email are varchar(100).
 * The password cap of 72 comes from bcrypt itself, which silently ignores
 * anything past 72 bytes - without the cap a user could set a 100-character
 * password and log in with only the first 72, which is worth refusing rather
 * than accepting quietly.
 *
 * Each character-class rule is its own .matches() call so the user is told
 * exactly which requirement is missing instead of one vague message.
 *
 * Note that password is deliberately NOT trimmed. Leading and trailing spaces
 * are legitimate password characters, and stripping them would silently change
 * what the user typed.
 */
const userValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ max: 100 })
        .withMessage('Email cannot exceed 100 characters')
        // Normalises case so Bryon@Example.com and bryon@example.com are one
        // account. The login form must normalise identically or lookups miss.
        .normalizeEmail(),

    body('password')
        .isLength({ min: 7 })
        .withMessage('Password must be at least 7 characters long')
        .isLength({ max: 72 })
        .withMessage('Password cannot exceed 72 characters')
        // Uppercase requirement disabled so the course-mandated admin test
        // account (password cse340!) can be registered through this form.
        // .matches(/[A-Z]/)
        // .withMessage('Password must contain an uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain a lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain a number')
        .matches(/[!@#$%^&*,._+=~-]/)
        .withMessage('Password must contain a special character: ! @ # $ % ^ & * , . _ - + = ~')
];

const showUserRegistrationForm = (req, res) => {
    res.render('register', { title: 'Register' });
};

const processUserRegistrationForm = async (req, res, next) => {
    // Check for validation errors collected by userValidation
    const results = validationResult(req);
    if (!results.isEmpty()) {
        results.array().forEach((error) => {
            req.flash('error', error.msg);
        });

        return res.redirect('/register');
    }

    const { name, email, password } = req.body;

    try {
        // bcrypt generates a unique random salt per password and stores it
        // inside the returned hash, so there is no separate salt to keep.
        // 10 is the cost factor: 2^10 rounds.
        const passwordHash = await bcrypt.hash(password, 10);

        await createUser(name, email, passwordHash);

        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/');
    } catch (error) {
        // 23505 is PostgreSQL's unique_violation. Both name and email are
        // UNIQUE on the users table, so err.constraint says which one clashed.
        if (error.code === '23505') {
            const field = error.constraint && error.constraint.includes('email')
                ? 'email address'
                : 'name';
            req.flash('error', `That ${field} is already registered.`);
            return res.redirect('/register');
        }

        // Anything else is unexpected - hand it to the global error handler
        // rather than reporting a real fault as a retryable form problem.
        return next(error);
    }
};

/**
 * Validation rules for the login form.
 *
 * Deliberately minimal, and NOT a copy of userValidation above.
 *
 * The email rule matters for correctness rather than safety: registration
 * stores the address after normalizeEmail() has lowercased it and applied
 * Gmail's aliasing rules, so login must normalise identically or the lookup
 * searches for a string that was never stored. Bryon.Chase@Gmail.com is saved
 * as bryonchase@gmail.com, and without this the owner could never sign in.
 *
 * There are deliberately no password composition rules here. Repeating them
 * would leak the policy to anyone probing the form, would lock out existing
 * accounts if the policy were ever tightened, and would achieve nothing - a
 * password that breaks the rules cannot match a stored hash anyway.
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

/**
 * Display the login form.
 */
const showLoginForm = async (req, res) => {
    res.render('login', { title: 'Login' });
};

/**
 * Handle the login form submission.
 *
 * authenticateUser returns null both when no account has that email and when
 * the password is wrong. That is intentional, and the single error message
 * below preserves it: distinguishable responses would let someone discover
 * which addresses are registered.
 *
 * On success the user object is stored in the session. It arrives from the
 * model with password_hash already removed, so the hash never reaches the
 * session store.
 */
const processLoginForm = async (req, res, next) => {
    // Validation failures use the same message as a bad password, so the form
    // never reveals whether the email exists.
    const results = validationResult(req);
    if (!results.isEmpty()) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
    }

    const { email, password } = req.body;

    try {
        const user = await authenticateUser(email, password);

        if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        // Regenerate the session id on login to prevent session fixation: an
        // attacker who planted a known session id cannot reuse it afterwards.
        // The flash lives in the session, so it is set after regeneration.
        req.session.regenerate((err) => {
            if (err) {
                return next(err);
            }

            req.session.user = user;
            req.flash('success', 'Login successful!');

            if (res.locals.nodeEnv === 'development') {
                console.log('User logged in:', user.email);
            }

            res.redirect('/dashboard');
        });
    } catch (error) {
        // A failure here is the database or bcrypt, not bad credentials.
        // Hand it to the global error handler rather than telling the user to
        // try again with input that was never the problem.
        return next(error);
    }
};

/**
 * Log the user out and return them to the login form.
 *
 * destroy() removes the whole session server-side rather than deleting one
 * property, so nothing from the authenticated session survives. The flash is
 * set before destroying, then re-set on the fresh session, because the old
 * session is gone by the time the redirect is issued.
 */
const processLogout = async (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }

        res.redirect('/login');
    });
};

/**
 * Middleware that blocks a request unless someone is signed in.
 */
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash('error', 'You must be logged in to access that page.');
        return res.redirect('/login');
    }
    next();
};

/**
 * Build middleware that blocks a request unless the signed-in user holds a
 * given role.
 *
 * This is a middleware *factory*, not middleware itself. Express expects a
 * function taking (req, res, next), but the check also needs to know which
 * role to demand - and there is nowhere in that signature to put it. Calling
 * requireRole('admin') returns a function with the right shape that has the
 * role captured in its closure, so the route reads:
 *
 *     router.get('/admin', requireRole('admin'), showAdminPage);
 *
 * Note the call parentheses. Passing requireRole without them would hand
 * Express the factory instead of the middleware, and every request would hang.
 *
 * role_name reaches the session because findUserByEmail joins the roles table
 * and authenticateUser returns that row, which processLoginForm stores whole.
 *
 * A failure redirects to / rather than /login: the user IS authenticated, they
 * simply lack the privilege, so sending them to sign in again would be both
 * confusing and futile.
 *
 * @param   {string} role  The role_name the user must have, e.g. 'admin'.
 * @returns {Function} Express middleware enforcing that role.
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role_name === role) {
            return next();
        }

        req.flash('error', 'You do not have permission to access that page.');

        // A signed-in user lacking the role goes to their dashboard - sending
        // them to log in again would be futile, since re-authenticating grants
        // the same role. Anyone not signed in goes to the home page.
        const destination = req.session && req.session.user ? '/dashboard' : '/';
        res.redirect(destination);
    };
};

/**
 * Display the signed-in user's dashboard.
 *
 * Reached only behind requireLogin, so req.session.user is guaranteed to exist
 * by the time this runs.
 */
const showDashboard = (req, res, next) => {
    const user = req.session.user;
    res.render('dashboard', {
        title: 'Dashboard',
        name: user.name,
        email: user.email
    });
}

/**
 * Display every registered user with their role.
 *
 * Admin-only, enforced on the route by requireRole('admin') rather than here.
 * Keeping the check in middleware means the guard is visible at the route
 * definition and cannot be forgotten by a future controller that renders the
 * same view.
 */
const showUsersPage = async (req, res) => {
    const users = await getAllUsers();
    const title = 'Registered Users';

    res.render('users', { title, users });
};

export { showUserRegistrationForm, processUserRegistrationForm, showLoginForm, processLoginForm, processLogout, requireLogin, requireRole, showDashboard, showUsersPage, userValidation, loginValidation };
