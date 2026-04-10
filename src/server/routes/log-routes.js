import { Router } from "express";
import jwt from "jsonwebtoken";
import { readLogs } from "../utils/logger.js";
import "dotenv/config";

const logRouter = Router();

/*For 2.4.4 - admins read logs*/
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    /* For 2.4.7 - Log access control failure, no token provided */
    return res.status(401).json({ message: "Access denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (decoded.role !== "admin") {
      /*For 2.4.7 - Log access control failure, non-admin attempted log access */
      return res.status(403).json({ message: "Access denied." });
    }

    req.user = decoded;
    next();
  } catch {
    /*For 2.4.1 - error handlers, debug info not leaked*/
    return res.status(401).json({ message: "Access denied." });
  }
};

/*For 2.4.4 - admins read logs*/
logRouter.get("/api/admin/logs", requireAdmin, (req, res) => {
  const logs = readLogs();
  res.json(logs);
});

export default logRouter;