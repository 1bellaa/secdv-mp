import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../server/utils/axios";

const ResetPassword = () => {
  const { token } = useParams();
  const [question, setQuestion] = useState("Loading question...");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch the question associated with this token when the page opens
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        // You'll need a small GET route or use the POST route to just get the question
        const res = await http.get(`/api/get-question-by-token/${token}`);
        setQuestion(res.data.question);
      } catch (err) {
        setError("This reset link is invalid or has expired.");
      }
    };
    fetchQuestion();
  }, [token]);

const handleReset = async () => {
  // 1. Basic UI validation
  if (newPassword !== confirmPassword) {
    return setError("Passwords do not match.");
  }

  setError(""); // Clear previous errors
  setLoading(true); // Disable button while waiting

  try {
    const res = await http.post(`/api/reset-password/${token}`, { 
      newPassword, 
      securityAnswer 
    });
    
    alert("Password updated! Please login.");
    navigate("/login");
  } catch (err: any) {
    setError(err.response?.data?.message || "Reset failed. Please try again.");
    setLoading(false); 
  }
};
  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card p-4 shadow">
        <h3>Finalize Reset</h3>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        
        <div className="mb-3 p-2 bg-dark border rounded small">
          <strong>Security Question:</strong><br/>{question}
        </div>

        <input className="form-control mb-2" placeholder="Your Answer" 
               onChange={e => setSecurityAnswer(e.target.value)} />
        <hr/>
        <input className="form-control mb-2" type="password" placeholder="New Password" 
               onChange={e => setNewPassword(e.target.value)} />
        <input className="form-control mb-3" type="password" placeholder="Confirm New Password" 
               onChange={e => setConfirmPassword(e.target.value)} />
        
        <button 
        className="btn btn-primary w-100" 
        onClick={handleReset} 
        disabled={loading || question === "Loading..." || !!error && !securityAnswer}
        >
        {loading ? (
            <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Updating...
            </>
        ) : (
            "Reset Password"
        )}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;