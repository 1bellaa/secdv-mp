import { useState, useEffect } from "react";

const NoticeBar = () => {
  const [notice, setNotice] = useState<any>(null);

  useEffect(() => {
    // Pull the data we saved during Login.tsx
    const saved = sessionStorage.getItem("last_login_report");
    if (saved) {
      setNotice(JSON.parse(saved));
    }
  }, []);

  const handleClose = () => {
    setNotice(null);
    sessionStorage.removeItem("last_login_report");
  };

  if (!notice) return null;

  const isSuccess = notice.method === "Successful";

  return (
    <div 
      className={`alert ${isSuccess ? "alert-info" : "alert-warning"} alert-dismissible fade show mb-0 rounded-0`} 
      role="alert"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
    >
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <span>
          <strong>Security Notice:</strong> Your last login attempt was <strong>{notice.method}</strong> on {new Date(notice.timestamp).toLocaleString()} from IP: {notice.ip}
        </span>
        <button 
          type="button" 
          className="btn-close" 
          onClick={handleClose} 
          aria-label="Close"
          style={{ position: "static", padding: "0.5rem" }}
        ></button>
      </div>
    </div>
  );
};

export default NoticeBar;