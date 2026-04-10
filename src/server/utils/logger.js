import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve("logs/security.log");

/*log directory should exist*/
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

/*Log entry to security log file*/
export const logEvent = (type, status, details = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    type,       /*e.g. "AUTH", "VALIDATION", "ACCESS_CONTROL"*/
    status,     /*"SUCCESS" | "FAILURE"*/
    ...details, /*e.g. { username, ip, reason }*/
  };

  const line = JSON.stringify(entry) + "\n";

  /*For 2.4.3 - Write log entry for successes and failures*/
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error("Logger write error:", err.message);
  });
};

export const readLogs = () => {
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
};