import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { SessionService } from '../services/sessionService.js';
import { sendError } from '../utils/responseHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_vaibhavdhus_lms_jwt_key_2026_xyz!';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401, null, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session token has expired. Please login again.', 401, null, 'TOKEN_EXPIRED');
      }
      return sendError(res, 'Invalid authentication token.', 401, null, 'INVALID_TOKEN');
    }

    // Verify user exists and is active
    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? LIMIT 1`,
      [decoded.userId]
    );

    if (userRows.length === 0) {
      return sendError(res, 'User account not found.', 401, null, 'USER_NOT_FOUND');
    }

    const user = userRows[0];
    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Please contact support.', 403, null, 'ACCOUNT_DEACTIVATED');
    }

    // Verify session validity
    if (decoded.sessionToken) {
      const sessionStatus = await SessionService.validateSession(user.id, decoded.sessionToken);
      if (!sessionStatus.valid) {
        return sendError(
          res,
          sessionStatus.reason || 'This session has been revoked because you logged in from another device.',
          401,
          null,
          'SESSION_REVOKED'
        );
      }
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      roleId: user.role_id,
      sessionToken: decoded.sessionToken
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return sendError(res, 'Authentication failed due to internal error.', 500);
  }
};

/**
 * Role-Based Access Control middleware
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission to perform this action.', 403, null, 'FORBIDDEN');
    }
    next();
  };
};
