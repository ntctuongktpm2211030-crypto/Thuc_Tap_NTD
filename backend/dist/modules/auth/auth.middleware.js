"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev';
/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches decoded payload to req.user.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        return next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired access token.' });
    }
}
/**
 * Middleware: Restrict endpoint to ADMIN role only.
 * Must be used after requireAuth.
 */
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin privileges required.' });
    }
    return next();
}
/**
 * Middleware: Try to extract JWT from Authorization header if present.
 * Does not reject requests without tokens.
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
    }
    catch (err) {
        // Token is invalid or expired, but we allow the request to proceed anonymously
    }
    next();
}
