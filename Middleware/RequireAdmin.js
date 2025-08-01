const jwt = require('jsonwebtoken');
const JWT_SECRET = 'food_store@446';

const RequireAdmin = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send({ error: "Access denied. No token provided." });

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            console.error('Access denied. Admins only.')
            return res.status(403).json({ error: "Access denied. Admins only." });
        }
    } catch (error) {
        console.log(error.message);
        res.status(401).send({ error: "Invalid token" });
    }
}

module.exports = RequireAdmin;