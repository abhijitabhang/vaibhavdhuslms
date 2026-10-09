import crypto from 'crypto';
import pool from '../config/db.js';

export class SessionService {
  /**
   * Parse user agent into device name and browser
   */
  static parseDeviceInfo(userAgent = '') {
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let deviceType = 'desktop';

    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

    if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Macintosh|Mac OS/i.test(userAgent)) os = 'macOS';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';

    if (/Chrome/i.test(userAgent) && !/Edge|Edg|OPR/i.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
    else if (/Edg/i.test(userAgent)) browser = 'Edge';
    else if (/OPR/i.test(userAgent)) browser = 'Opera';

    return {
      deviceName: `${browser} on ${os} (${deviceType})`,
      deviceType,
      os,
      browser
    };
  }

  /**
   * Create new session and handle concurrent session policy
   */
  static async createSession(userId, req, forceRevokeOthers = false) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const { deviceName, deviceType, os, browser } = this.parseDeviceInfo(userAgent);
    const deviceFingerprint = crypto.createHash('md5').update(`${userAgent}:${ipAddress}`).digest('hex');

    // Fetch setting for max concurrent sessions
    const [settingRows] = await pool.query(
      `SELECT setting_value FROM platform_settings WHERE setting_key = 'max_concurrent_sessions'`
    );
    const maxSessions = settingRows.length ? parseInt(settingRows[0].setting_value, 10) : 1;

    // Check existing active sessions
    const [activeRows] = await pool.query(
      `SELECT id, device_name, ip_address, last_active_at FROM user_sessions WHERE user_id = ? AND is_active = 1 ORDER BY last_active_at DESC`,
      [userId]
    );

    if (forceRevokeOthers || (maxSessions === 1 && activeRows.length >= 1)) {
      // Invalidate existing sessions
      await pool.query(
        `UPDATE user_sessions SET is_active = 0, revoked_reason = 'Logged in from a newer device' WHERE user_id = ? AND is_active = 1`,
        [userId]
      );
    }

    // Insert new session
    const [result] = await pool.query(
      `INSERT INTO user_sessions (user_id, session_token, device_name, device_type, os, browser, ip_address, device_fingerprint, is_active, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [userId, sessionToken, deviceName, deviceType, os, browser, ipAddress, deviceFingerprint]
    );

    return {
      sessionId: result.insertId,
      sessionToken,
      deviceName,
      ipAddress,
      deviceFingerprint
    };
  }

  /**
   * Validate that a session token is still active
   */
  static async validateSession(userId, sessionToken) {
    if (!sessionToken) return false;

    const [rows] = await pool.query(
      `SELECT id, is_active, revoked_reason FROM user_sessions WHERE user_id = ? AND session_token = ? LIMIT 1`,
      [userId, sessionToken]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return { valid: false, reason: rows[0]?.revoked_reason || 'Session expired or revoked' };
    }

    // Update heartbeat
    await pool.query(
      `UPDATE user_sessions SET last_active_at = NOW() WHERE id = ?`,
      [rows[0].id]
    );

    return { valid: true, sessionId: rows[0].id };
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(sessionId, reason = 'Manually revoked by user/admin') {
    await pool.query(
      `UPDATE user_sessions SET is_active = 0, revoked_reason = ? WHERE id = ?`,
      [reason, sessionId]
    );
  }

  /**
   * Revoke all other sessions for a user except the current token
   */
  static async revokeOtherSessions(userId, currentSessionToken) {
    await pool.query(
      `UPDATE user_sessions SET is_active = 0, revoked_reason = 'Terminated by user' 
       WHERE user_id = ? AND session_token != ? AND is_active = 1`,
      [userId, currentSessionToken]
    );
  }

  /**
   * Get active sessions for a user
   */
  static async getUserActiveSessions(userId) {
    const [rows] = await pool.query(
      `SELECT id, session_token, device_name, device_type, os, browser, ip_address, last_active_at, created_at
       FROM user_sessions WHERE user_id = ? AND is_active = 1 ORDER BY last_active_at DESC`,
      [userId]
    );
    return rows;
  }
}
