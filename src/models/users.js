/**
 * Data access for the users table.
 *
 * Passwords never exist here in plaintext. Registration hands this module an
 * already-hashed value, and authentication compares against the stored hash
 * without ever decoding it - bcrypt hashes are one-way by design.
 */

import bcrypt from 'bcrypt';
import db from './db.js'

/**
 * Insert a new user with the default role.
 *
 * The role is resolved inside the INSERT with a subquery rather than looked up
 * first, so one round-trip does both. If the roles table had no matching row
 * the subquery would yield NULL and role_id would be left empty, since the
 * column is nullable.
 *
 * The caller passes a hash, never a plaintext password - hashing belongs to the
 * controller so this module never handles a raw credential.
 *
 * @param   {string} name          The user's display name (unique, max 100).
 * @param   {string} email         The user's email address (unique, max 100).
 * @param   {string} passwordHash  A bcrypt hash, always 60 characters.
 * @returns {Promise<number>} The id of the newly created user.
 * @throws  Postgres error 23505 when the name or email is already taken.
 */
const createUser = async (name, email, passwordHash) => {
    const default_role = 'user';
    const query = `
        INSERT INTO users (name, email, password_hash, role_id) 
        VALUES ($1, $2, $3, (SELECT role_id FROM roles WHERE role_name = $4)) 
        RETURNING user_id
    `;
    const queryParams = [name, email, passwordHash, default_role];
    
    const result = await db.query(query, queryParams);

    // INSERT ... RETURNING always yields a row on success, so an empty result
    // means the insert did not happen and the caller must not continue.
    if (result.rows.length === 0) {
        throw new Error('Failed to create user');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new user with ID:', result.rows[0].user_id);
    }

    return result.rows[0].user_id;
};

/**
 * Fetch one user by email address, including the stored password hash.
 *
 * password_hash is selected deliberately: authenticateUser needs it to compare
 * against, and including it here means authentication costs one query instead
 * of two. Because the hash is in the returned object, every caller is
 * responsible for stripping it before the object travels any further -
 * authenticateUser does exactly that.
 *
 * This is why the function is not exported. Handing a row containing a
 * password hash to a controller invites it ending up in a session or a
 * template; authenticateUser is the only intended caller.
 *
 * Returns null rather than throwing when no user matches, so the caller can
 * treat "not found" as an ordinary outcome instead of an error.
 *
 * The JOIN resolves role_id into role_name, which lives on the roles table.
 * Carrying the name rather than the id means requireRole can compare against a
 * readable value such as 'admin' instead of a number whose meaning is only
 * discoverable by querying. A LEFT JOIN is used because users.role_id is
 * nullable - a user with no role still authenticates, with role_name as null.
 *
 * @param   {string} email  The email address to look up.
 * @returns {Promise<Object|null>} user_id, name, email, password_hash,
 *                                 role_id and role_name, or null when no user
 *                                 has that email.
 */
const findUserByEmail = async (email) => {
    const query = `
        SELECT u.user_id, u.name, u.email, u.password_hash, u.role_id, r.role_name
        FROM users AS u
        LEFT JOIN roles AS r
          ON r.role_id = u.role_id
        WHERE u.email = $1
    `;
    const queryParams = [email];
    
    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
        return null; // User not found
    }
    
    return result.rows[0];
};

/**
 * Compare a plaintext password against a stored bcrypt hash.
 *
 * bcrypt reads the salt and cost factor out of the hash itself, so nothing
 * beyond these two values is needed. Not exported - only authenticateUser
 * below calls it.
 *
 * @param   {string} password      The plaintext password from the login form.
 * @param   {string} passwordHash  The stored hash from the users table.
 * @returns {Promise<boolean>} True when the password matches.
 */
const verifyPassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

/**
 * Authenticate a user by email and password.
 *
 * findUserByEmail already selects password_hash along with the rest of the
 * row, so the hash needed for comparison arrives in that one query - there is
 * no second lookup.
 *
 * Returns null for both "no such user" and "wrong password" deliberately. A
 * caller that could tell those apart would let an attacker discover which
 * email addresses are registered.
 *
 * @param   {string} email     The submitted email address.
 * @param   {string} password  The submitted plaintext password.
 * @returns {Promise<Object|null>} The user row without password_hash, or null.
 */
const authenticateUser = async (email, password) => {
    const user = await findUserByEmail(email);

    if (!user) {
        return null;
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    // Strip the hash before the object leaves the model. Whatever the
    // controller does next - put it in the session, hand it to a template -
    // must never carry the hash along with it.
    delete user.password_hash;

    return user;
};

// Only createUser and authenticateUser are used outside this file.
// findUserByEmail and verifyPassword stay private to the module.
export { createUser, authenticateUser };
