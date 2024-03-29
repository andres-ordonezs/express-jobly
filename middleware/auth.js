"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  const authHeader = req.headers?.authorization;
  if (authHeader) {
    // token is removing 'Bearer' so we can get the payload in oBJ FORM
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
    }
  }
  return next();

}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}

/** Middleware to use when user must be admin
 *
 * If not, raises Unauthorized.
 */
function ensureIsAdmin(req, res, next) {
  if (res.locals.user?.username &&
    (res.locals.user?.isAdmin === true)) {
    return next();
  }
  throw new UnauthorizedError("Must be admin for this route");
}

/** Middleware to use when user must be admin or the specified user
 *
 * If not, raises Unauthorized.
 */
function ensureIsAdminOrUser(req, res, next) {
  if (res.locals.user?.username &&
    (req.params.username === res.locals.user?.username ||
      res.locals.user?.isAdmin === true)) {
    return next();
  }

  throw new UnauthorizedError("Must be logged in as admin or desired user");
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsAdminOrUser
};
