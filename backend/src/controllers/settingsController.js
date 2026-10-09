import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getPlatformSettings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value, group_name, description 
       FROM platform_settings 
       WHERE is_public = 1`
    );

    const settingsObj = {};
    rows.forEach(r => {
      let val = r.setting_value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val.trim() !== '') {
        // Keep hex colors or numbers appropriately
        if (!val.startsWith('#')) {
          val = Number(val);
        }
      }
      settingsObj[r.setting_key] = val;
    });

    return sendSuccess(res, settingsObj, 'Platform settings retrieved');
  } catch (error) {
    console.error('Get platform settings error:', error);
    return sendError(res, 'Failed to fetch platform configuration.', 500);
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return sendError(res, 'Invalid settings payload.', 400);
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const [key, value] of Object.entries(updates)) {
        await conn.query(
          `INSERT INTO platform_settings (setting_key, setting_value, group_name, is_public)
           VALUES (?, ?, 'theme', 1)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, String(value), String(value)]
        );
      }

      await conn.commit();
      return sendSuccess(res, updates, 'Platform settings updated successfully');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Update settings error:', error);
    return sendError(res, 'Failed to update settings.', 500);
  }
};
