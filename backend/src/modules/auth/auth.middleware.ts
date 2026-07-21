import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev';

export interface AuthRequest extends Request {
  user?: { sub: string; role: string };
}

/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches decoded payload to req.user.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }
}

/**
 * Middleware: Restrict endpoint to ADMIN role only.
 * Must be used after requireAuth.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'USER') {
    return res.status(403).json({ error: 'User privileges required.' });
  }
  return next();
}

/**
 * Middleware: Try to extract JWT from Authorization header if present.
 * Does not reject requests without tokens.
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    req.user = payload;
  } catch (err) {
    // Token is invalid or expired, but we allow the request to proceed anonymously
  }
  next();
}
