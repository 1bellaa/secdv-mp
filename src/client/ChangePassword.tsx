import { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../server/utils/axios";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import UserType from "../server/utils/UserType";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  
  const auth = useAuthUser<UserType>();
  const navigate = useNavigate();

  const handleUpdate = async () => {
    setMessage({ text: "", isError: false });

    // 1. Client-side checks
    if (newPassword !== confirmPassword) {
      return setMessage({ text: "New passwords do not match!", isError: true });
    }

    // 2. Reuse your Regex from Signup
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[#$%%!&*]).{5,20}$/;
    if (!passwordRegex.test(newPassword)) {
      return setMessage({ text: "Password must have 1 uppercase, 1 number, 1 special character (#$%%!&*), and be 5-20 characters long.", isError: true });
    }

    try {
      const response = await http.post("/api/user/change-password", {
        userId: auth?.id,
        oldPassword,
        newPassword
      });

      if (response.status === 200) {
        alert("Password updated successfully!");
        navigate("/home");
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
        <h3>Change Password</h3>
        <div className="mb-3">
          <input className="form-control" type="password" placeholder="Current Password" 
                 onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <hr />
        <div className="mb-3">
          <input className="form-control" type="password" placeholder="New Password" 
                 onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="mb-3">
          <input className="form-control" type="password" placeholder="Confirm New Password" 
                 onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button className="btn btn-warning w-100" onClick={handleUpdate}>Update Password</button>
        {message.text && (
          <p className={`mt-3 ${message.isError ? "text-danger" : "text-success"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;