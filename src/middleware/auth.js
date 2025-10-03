const jwt = require('jsonwebtoken');
require('dotenv').config();


module.exports = function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed token' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
