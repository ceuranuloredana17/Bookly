const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).json({ message: 'Access denied, token is missing' });
  }
  try {
    const decoded = jwt.verify(token, 'secretKey');
    req.userId = decoded.id; 
    req.isBusiness = decoded.business; 
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticateJWT;


