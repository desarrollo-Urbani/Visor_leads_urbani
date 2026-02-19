const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
}

/**
 * Middleware to verify JWT token on protected routes.
 * Expects header: Authorization: Bearer <token>
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Acceso no autorizado: token requerido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role, nombre }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

/**
 * Middleware to require admin role.
 * Must be used AFTER verifyToken.
 */
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    }
    next();
};

module.exports = { verifyToken, requireAdmin };
