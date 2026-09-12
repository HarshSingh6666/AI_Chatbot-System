import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // Attaching decoded payload (e.g., { id: ... }) to req.user
    next();
  } catch (error) {
    console.error('Token Verification Error:', error);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// 👇 Alias export to support files using authenticateToken
export const authenticateToken = verifyToken;