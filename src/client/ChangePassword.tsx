import { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../server/utils/axios";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import useSignOut from "react-auth-kit/hooks/useSignOut";
import UserType from "../server/utils/UserType";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState(""); // New state for answer
  const [message, setMessage] = useState({ text: "", isError: false });
  
  const auth = useAuthUser<UserType>();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const handleUpdate = async () => {
    setMessage({ text: "", isError: false });

    // 1. Client-side checks
    if (newPassword !== confirmPassword) {
      return setMessage({ text: "New passwords do not match!", isError: true });
    }

    if (!securityAnswer) {
      return setMessage({ text: "Please provide your security answer.", isError: true });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$*]).{8,64}$/; 
    if (!passwordRegex.test(newPassword)) {
      return setMessage({ 
        text: "Password must be 8-64 characters and include an uppercase letter, a number, and a special character (!@#$*).", 
        isError: true 
      });
    }

    try {
      const response = await http.post("/api/user/change-password", {
        userId: auth?.id,
        oldPassword,
        newPassword,
        securityAnswer // 2. Send the answer to the backend
      });

      if (response.status === 200) {
        alert("Password updated successfully! Please log in again.");
        signOut(); 
        navigate("/login");
      }
    } catch (err: any) {
      setMessage({ 
        text: err.response?.data?.message || "Failed to update password.", 
        isError: true 
      });
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card p-4 shadow">
        <h3 className="mb-4"><strong>Change Password</strong></h3>
        
        {/* Security Question Section */}
        <div className="alert alert-light border mb-3 py-2 px-3">
          <label className="form-label small text-muted mb-1">Security Question</label>
          <p className="mb-0 small fw-bold">{auth?.securityQuestion || "Loading question..."}</p>
        </div>

        <div className="mb-3">
          <input className="form-control" type="text" placeholder="Your Security Answer" 
                 onChange={(e) => setSecurityAnswer(e.target.value)} />
        </div>

        <hr />

        <div className="mb-3">
          <label className="form-label small text-muted">Current Password</label>
          <input className="form-control" type="password" placeholder="••••••••" 
                 onChange={(e) => setOldPassword(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label small text-muted">New Password</label>
          <input className="form-control" type="password" placeholder="••••••••" 
                 onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="form-label small text-muted">Confirm New Password</label>
          <input className="form-control" type="password" placeholder="••••••••" 
                 onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <button className="btn btn-primary w-100" onClick={handleUpdate}>Update & Logout</button>
        
        {message.text && (
          <p className={`mt-3 small text-center ${message.isError ? "text-danger" : "text-success"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;