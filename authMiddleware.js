// authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = (req, res, next) => {
    let token;

    // Check if the token is in the Authorization header and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer eyJhbGci...")
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using our secret
            const decoded = jwt.verify(token, JWT_SECRET);

            // Attach the decoded user payload to the request object
            // so our endpoints can know who the user is.
            req.user = decoded;

            next(); // The token is valid, proceed to the next function (the endpoint logic)
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

// Optional: Middleware to restrict access to specific roles
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user.roles is an array we created when we signed the JWT
        if (!roles.some(role => req.user.roles.includes(role))) {
            return res.status(403).json({ error: 'You do not have permission to perform this action' });
        }
        next();
    };
};