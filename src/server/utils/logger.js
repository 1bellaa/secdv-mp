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
    if (!fs.existsSync(LOG_FILE)) return []; // Prevent error if file doesn't exist yet

    const raw = fs.readFileSync(LOG_FILE, "utf-8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0) // Remove empty lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (parseErr) {
          console.error("Skipping malformed log line:", line);
          return null;
        }
      })
      .filter((entry) => entry !== null); // Remove the failed parses
  } catch (err) {
    console.error("Log read error:", err);
    return [];
  }
};