import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { SessionService } from '../services/sessionService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_vaibhavdhus_lms_jwt_key_2026_xyz!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return sendError(res, 'An account with this email address already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, phone, is_active, email_verified_at)
       VALUES (?, ?, ?, 3, ?, 1, NOW())`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone || null]
    );

    const userId = result.insertId;

    // Automatically enroll in the default flagship masterclass course for immediate learning experience
    await pool.query(
      `INSERT IGNORE INTO enrollments (user_id, course_id, status, enrolled_at) VALUES (?, 1, 'active', NOW())`,
      [userId]
    );

    // Create session
    const session = await SessionService.createSession(userId, req);

    const token = jwt.sign(
      { userId, sessionToken: session.sessionToken },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return sendSuccess(res, {
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'student'
      },
      session: {
        deviceName: session.deviceName,
        sessionToken: session.sessionToken
      }
    }, 'Account registered successfully!', 201);
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 'Registration failed due to a server error.', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, forceRevokeOthers } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return sendError(res, 'Invalid email or password credentials.', 401);
    }

    const user = users[0];

    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Please contact administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password credentials.', 401);
    }

    // Create session & handle multi-device management
    const session = await SessionService.createSession(user.id, req, !!forceRevokeOthers);

    const token = jwt.sign(
      { userId: user.id, sessionToken: session.sessionToken },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name
      },
      session: {
        sessionId: session.sessionId,
        deviceName: session.deviceName,
        sessionToken: session.sessionToken
      }
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed due to a server error.', 500);
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user?.sessionToken) {
      await pool.query(
        `UPDATE user_sessions SET is_active = 0, revoked_reason = 'User logged out' WHERE session_token = ?`,
        [req.user.sessionToken]
      );
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'Failed to log out cleanly.', 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.created_at, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? LIMIT 1`,
      [req.user.id]
    );

    if (users.length === 0) {
      return sendError(res, 'User not found.', 404);
    }

    const [activeSessions] = await pool.query(
      `SELECT count(*) as count FROM user_sessions WHERE user_id = ? AND is_active = 1`,
      [req.user.id]
    );

    return sendSuccess(res, {
      user: users[0],
      activeSessionCount: activeSessions[0].count,
      currentSessionToken: req.user.sessionToken
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'Failed to retrieve profile.', 500);
  }
};

export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await SessionService.getUserActiveSessions(req.user.id);
    return sendSuccess(res, sessions, 'Active sessions retrieved');
  } catch (error) {
    console.error('Get active sessions error:', error);
    return sendError(res, 'Failed to fetch sessions.', 500);
  }
};

export const revokeOtherSessions = async (req, res) => {
  try {
    await SessionService.revokeOtherSessions(req.user.id, req.user.sessionToken);
    return sendSuccess(res, null, 'All other sessions have been logged out.');
  } catch (error) {
    console.error('Revoke other sessions error:', error);
    return sendError(res, 'Failed to revoke other sessions.', 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current password and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters.', 400);
    }

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    // Invalidate other devices for security
    await SessionService.revokeOtherSessions(req.user.id, req.user.sessionToken);

    return sendSuccess(res, null, 'Password updated successfully. Other active devices were logged out.');
  } catch (error) {
    console.error('Change password error:', error);
    return sendError(res, 'Failed to update password.', 500);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email address is required.', 400);
    }

    const [users] = await pool.query(
      'SELECT id, name, email FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return sendSuccess(res, { message: 'If that email exists in our system, password reset instructions have been generated.' });
    }

    const user = users[0];
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return sendSuccess(res, {
      resetToken,
      email: user.email,
      expiresIn: '1 hour'
    }, 'Password reset instructions generated successfully.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return sendError(res, 'Failed to process forgot password request.', 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return sendError(res, 'Reset token and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return sendError(res, 'Invalid or expired password reset link.', 400);
    }

    if (decoded.type !== 'password_reset') {
      return sendError(res, 'Invalid reset token format.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, decoded.userId]);

    // Revoke all existing sessions for security
    await pool.query(
      `UPDATE user_sessions SET is_active = 0, revoked_reason = 'Password was reset' WHERE user_id = ?`,
      [decoded.userId]
    );

    return sendSuccess(res, null, 'Password has been successfully reset! You can now log in with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    return sendError(res, 'Failed to reset password.', 500);
  }
};
