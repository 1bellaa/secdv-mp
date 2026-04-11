import { Link, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useState } from "react";
import axios from "axios";
import http from "../server/utils/axios";

/*For 2.3.3 - data length*/
const LIMITS = {
  username: { min: 3, max: 20 },
  password: { min: 8, max: 64 },
  fullname: { min: 2, max: 50 },
  email: { min: 5, max: 100 },
};

const Signup = () => {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [errText, setErrText] = useState("");
  const [loading, setLoading] = useState(false);

  const QUESTIONS = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What was the make of your first car?",
    "In what city were you born?"
  ];

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErrText("");
    
    // 1. Check for missing fields
    if (!username || !fullname || !email || !password || !securityQuestion || !securityAnswer) {
      setErrText("Please fill in all fields, including security details.");
      return;
    }

    // 2. Validate username
    if (username.length < LIMITS.username.min || username.length > LIMITS.username.max) {
      setErrText(`Username must be ${LIMITS.username.min}-${LIMITS.username.max} characters.`);
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      setErrText("Username contains invalid characters.");
      return;
    }

    // 3. Validate full name
    if (fullname.length < LIMITS.fullname.min || fullname.length > LIMITS.fullname.max) {
      setErrText(`Full name must be ${LIMITS.fullname.min}-${LIMITS.fullname.max} characters.`);
      return;
    }
    if (!/^[a-zA-Z\s-]+$/.test(fullname)) {
      setErrText("Full name may only contain letters, spaces, and hyphens.");
      return;
    }

    // 4. Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrText("Please enter a valid email address.");
      return;
    }

    // 5. Validate password
    if (password.length < LIMITS.password.min || password.length > LIMITS.password.max) {
      setErrText(`Password must be ${LIMITS.password.min}-${LIMITS.password.max} characters.`);
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$*]/.test(password)) {
      setErrText("Password must have an uppercase letter, a number, and a special character (!@#$*).");
      return;
    }

    setLoading(true);

    try {
      const res = await http.post("/api/signup", {
        username,
        fullname,
        email,
        password,
        securityQuestion, 
        securityAnswer
      });

      if (res.status === 201) {
        alert("Account created successfully!");
        navigate("/login");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) setErrText("Username is already taken.");
        else setErrText("An error occurred during signup. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: "80vh" }}>
        <div className="card shadow-sm" style={{ width: "100%", maxWidth: "450px" }}>
          <div className="card-body p-4">
            <form onSubmit={(e) => e.preventDefault()}>
              <h1 className="h3 mb-4 fw-bold">Sign up</h1>
              
              <div className="mb-3">
                <input className="form-control" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>

              <div className="mb-3">
                <input className="form-control" type="text" placeholder="Full Name" value={fullname} onChange={(e) => setFullname(e.target.value)} />
              </div>

              <div className="mb-3">
                <input className="form-control" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="mb-3">
                <input className="form-control" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <hr />
              <p className="small text-muted mb-2">Security Question (for password recovery)</p>
              
              <div className="mb-3">
                <select 
                  className="form-select" 
                  value={securityQuestion} 
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                >
                  <option value="" disabled>Select a question...</option>
                  {QUESTIONS.map((q, index) => (
                    <option key={index} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <input 
                  className="form-control" 
                  type="text" 
                  placeholder="Your Answer" 
                  value={securityAnswer} 
                  onChange={(e) => setSecurityAnswer(e.target.value)} 
                />
              </div>

              <button 
                className="btn btn-primary w-100 mb-3" 
                type="button" 
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Registering..." : "Register"}
              </button>

              {errText && <p className="text-danger small text-center">{errText}</p>}
              
              <p className="text-muted text-center small">
                Already have an account? <Link to="/login">Login.</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;