const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'moviela@secret';

const RequireAdmin = (req, res, next) => {
    const token = req.header("auth-token") || req.header("authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).send({ error: "Access denied. No token provided." });

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data;

        if (req.user && req.user.role === "admin") {
            next();
        } else {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }
    } catch (error) {
        console.log(error.message);
        res.status(401).send({ error: "Invalid token" });
    }
};

module.exports = RequireAdmin;