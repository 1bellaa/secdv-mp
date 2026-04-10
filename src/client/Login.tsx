import { Link, useNavigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import { useState } from "react"
import http from "../server/utils/axios"
import axios from "axios"
import useSignIn from 'react-auth-kit/hooks/useSignIn';

const Login = () => {
  // Initialize as empty strings rather than null for easier form handling
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errText, setErrText] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()
  const signIn = useSignIn()

  const handleSubmit = async () => {
    // 1. Reset state
    setErrText("");
    
    // 2. Immediate Validation
    if (!username || !password) {
      setErrText("Input username and password!");
      return; // Stop here
    }

    setLoading(true);

    try {
      console.log("Attempting login for:", username);
      
      const response = await http.post("/api/login", {
        username: username, 
        password: password
      })

      const signedIn = signIn({
        auth: {
          token: response.data.token,
          type: "Bearer"
        },
        refresh: response.data.refreshToken,
        userState: response.data.user
      });

      if (signedIn) {
        navigate("/home");
      }
      
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) setErrText("User does not exist.");
        else if (status === 401) setErrText("Wrong password.");
        else if (status === 503) setErrText("Server is starting up... please wait.");
        else setErrText("An error has occurred on the server.");
      } else {
        setErrText("Unable to connect to server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="card shadow-sm" style={{ width: "100%", maxWidth: "400px" }}>
          <div className="card-body p-4 d-flex flex-column align-items-center">
            {/* Added onSubmit and preventDefault for better UX (Enter key support) */}
            <form className="text-center" style={{ width: "90%" }} onSubmit={(e) => e.preventDefault()}>
              <h1 className="text-start mb-4"><strong>Log in</strong></h1>
              
              <div className="mb-3">
                <input 
                  className={`form-control ${errText && !username ? "is-invalid" : ""}`} 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>

              <div className="mb-3">
                <input 
                  className={`form-control ${errText && !password ? "is-invalid" : ""}`} 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>

              <div className="mb-3">
                <button 
                  className="btn btn-primary d-block w-100" 
                  type="button" 
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>

              {errText && <p className="text-danger small">{errText}</p>}
              
              <p className="text-muted small">Forgot your password?</p>
              <p className="text-muted small">
                Dont have an account? <Link to="/signup">Signup.</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login