import jwt from "jsonwebtoken";
import "dotenv/config";

export const authenticateToken = (req, res, next) => {
  // Grab the token from the cookie (matching your auth-store logic)
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    
    // This makes 'req.user.id' and 'req.user.role' available in your routes!
    req.user = decoded; 
    next();
  });
};