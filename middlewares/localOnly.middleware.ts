import type { Context, Next } from 'jsr:@oak/oak';
import { Status } from 'jsr:@oak/oak';

/**
 * Middleware to restrict access to local/internal requests only
 * Allows requests from:
 * - localhost (127.0.0.1, ::1)
 * - Private network ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
 * - Docker internal networks
 */
export const localOnly = () => {
  return async (ctx: Context, next: Next) => {
    const clientIP = getClientIP(ctx);
    
    if (!isLocalIP(clientIP)) {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = {
        success: false,
        message: 'Access denied: This endpoint is only available for local requests',
        clientIP: clientIP
      };
      return;
    }

    // If local IP, continue to next middleware
    await next();
  };
};

/**
 * Extract client IP from request
 */
function getClientIP(ctx: Context): string {
  // Check for forwarded IP headers first
  const forwardedFor = ctx.request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = ctx.request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fall back to connection remote address
  const remoteAddr = ctx.request.ip;
  return remoteAddr || 'unknown';
}

/**
 * Check if IP is considered local/internal
 */
function isLocalIP(ip: string): boolean {
  if (!ip || ip === 'unknown') {
    return false;
  }

  // Remove any port number
  const cleanIP = ip.replace(/:\d+$/, '');

  // Localhost addresses
  if (cleanIP === '127.0.0.1' || cleanIP === '::1' || cleanIP === 'localhost') {
    return true;
  }

  // Private network ranges (RFC 1918)
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
  ];

  for (const range of privateRanges) {
    if (range.test(cleanIP)) {
      return true;
    }
  }

  // Docker internal networks
  const dockerRanges = [
    /^172\.(1[7-9]|2[0-9]|3[0-1])\./,  // Docker default bridge networks
    /^10\.0\./,                         // Common Docker compose networks
  ];

  for (const range of dockerRanges) {
    if (range.test(cleanIP)) {
      return true;
    }
  }

  // Link-local addresses
  if (/^169\.254\./.test(cleanIP)) {
    return true;
  }

  return false;
} 