import crypto from 'crypto';

const SECRET_KEY = process.env.VIDEO_SIGNING_SECRET || 'video_protection_signing_secret_key_secure_8899!';
const DEFAULT_EXPIRY_SECONDS = parseInt(process.env.VIDEO_TOKEN_EXPIRY_SECONDS || '180', 10);

/**
 * Generates an ephemeral HMAC-SHA256 signed playback token for video streaming.
 */
export function generateVideoPlaybackToken(userId, lessonId, sessionId, expirySeconds = DEFAULT_EXPIRY_SECONDS) {
  const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
  const payloadString = `${userId}:${lessonId}:${sessionId}:${expiresAt}`;
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadString)
    .digest('hex');

  // Format: userId.lessonId.sessionId.expiresAt.signature
  return Buffer.from(`${payloadString}:${signature}`).toString('base64url');
}

/**
 * Validates a video playback token.
 * Returns decoded payload if valid, null otherwise.
 */
export function verifyVideoPlaybackToken(tokenString, expectedLessonId = null) {
  try {
    if (!tokenString) return null;
    const decoded = Buffer.from(tokenString, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 5) return null;

    const [userId, lessonId, sessionId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Expiry check
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return null;
    }

    // Optional lesson ID check
    if (expectedLessonId && parseInt(lessonId, 10) !== parseInt(expectedLessonId, 10)) {
      return null;
    }

    // Recalculate signature
    const payloadString = `${userId}:${lessonId}:${sessionId}:${expiresAtStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadString)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return {
        userId: parseInt(userId, 10),
        lessonId: parseInt(lessonId, 10),
        sessionId,
        expiresAt
      };
    }

    return null;
  } catch (err) {
    return null;
  }
}
