import { useState } from "react";
import { Link } from "react-router-dom";
import http from "../server/utils/axios";

const RequestReset = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      const res = await http.post("/api/request-reset", { email });
      setMessage({ text: res.data.message, isError: false });
    } catch (err: any) {
      setMessage({ 
        text: err.response?.data?.message || "Something went wrong.", 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow-sm p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <h3 className="mb-3">Reset Password</h3>
        <p className="text-muted small mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleRequest}>
          <div className="mb-3">
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@example.com"
              required
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message.text && (
          <div className={`alert ${message.isError ? "alert-danger" : "alert-success"} mt-3 small`}>
            {message.text}
          </div>
        )}

        <div className="text-center mt-3">
          <Link to="/login" className="small text-decoration-none">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RequestReset;