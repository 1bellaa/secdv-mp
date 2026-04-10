import { Link, useNavigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import { useEffect, useState } from "react"
import axios from "axios"
import http from "../server/utils/axios"

/*For 2.3.3 - data length*/
const LIMITS = {
  username: { min: 3,  max: 20 },
  password: { min: 8,  max: 64 },
  fullname: { min: 2,  max: 50 },
  email:    { min: 5,  max: 100 },
};

const Signup = () => {
  const [username, setUsername] = useState<string | null>(null)
  const [fullname, setFullname] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [errText, setErrText] = useState<string | null>(null)
  const [errCount, setErrCount] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    if (username && fullname && email && password) {
      setErrText("")
      setErrCount(0)
    }

    if (username === "") {
      setErrText("Input username!")
      setUsername(null)
      setErrCount(errCount + 1)
    }

    if (fullname === "") {
      setErrText("Input full name!")
      setFullname(null)
      setErrCount(errCount + 1)
    }

    if (email === "") {
      setErrText("Input email!")
      setEmail(null)
      setErrCount(errCount + 1)
    }

    if (password === "") {
      setErrText("Input password!")
      setPassword(null)
      setErrCount(errCount + 1)
    }

    if (errCount > 1) {
      setErrText("Input missing fields!")
    }
  }, [username, fullname, email, password])

  const handleSubmit = async () => {
    try {

      // check if there is an error and stop
      if (errText !== "") {
        return
      }

      /*For 2.3.1 - Reject if any required field is missing*/
      if (!username || !fullname || !email || !password) {
        setErrText("Please fill in all fields.");
        return;
      }

      /*For 2.3.3 - Validate username length*/
      if (username.length < LIMITS.username.min || username.length > LIMITS.username.max) {
        setErrText(`Username must be between ${LIMITS.username.min} and ${LIMITS.username.max} characters.`);
        return;
      }

      /*For 2.3.2 - Username should be alphanumeric, period, hyphen, underscore only*/
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        setErrText("Username may only contain letters, numbers, periods, hyphens, and underscores.");
        return;
      }

      /*For 2.3.3 - Validate full name length*/
      if (fullname.length < LIMITS.fullname.min || fullname.length > LIMITS.fullname.max) {
        setErrText(`Full name must be between ${LIMITS.fullname.min} and ${LIMITS.fullname.max} characters.`);
        return;
      }

      /*For 2.3.2 - Full name should contain letters, spaces, and hyphens only*/
      if (!/^[a-zA-Z\s-]+$/.test(fullname)) {
        setErrText("Full name may only contain letters, spaces, and hyphens.");
        return;
      }

      /*For 2.3.2 - Email — basic format*/
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrText("Please enter a valid email address.");
        return;
      }

      /*For 2.3.3 - Validate email length */
      if (email.length < LIMITS.email.min || email.length > LIMITS.email.max) {
        setErrText(`Email must be between ${LIMITS.email.min} and ${LIMITS.email.max} characters.`);
        return;
      }

      /*For 2.3.3 - Validate password length */
      if (password.length < LIMITS.password.min || password.length > LIMITS.password.max) {
        setErrText(`Password must be between ${LIMITS.password.min} and ${LIMITS.password.max} characters.`);
        return;
      }

      /*For 2.3.2 - Password should contain alphanumeric + !@#$* only*/
      if (!/^[a-zA-Z0-9!@#$*]+$/.test(password)) {
        setErrText("Password may only contain letters, numbers, and the characters !@#$*");
        return;
      }

      /*For 2.3.2 - Password reqs must have uppercase, number, and special char*/
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$*]/.test(password)) {
        setErrText("Password must contain at least one uppercase letter, one number, and one special character (!@#$*).");
        return;
      }

      // all inputs are valid
      const res = await http.post("/api/signup", {
        username: username,
        fullname: fullname,
        email: email,
        password: password
      })

      if (res.status === 201) {
        alert("Successfully added account.")
        navigate("/login")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 500) {
          console.error("Database error.")
          setErrText("An error has occured.")
        }
        if (err.response?.status === 400) {
          console.error("User is in database.")
          setErrText("Username is taken.")
        }
      } else {
        console.error(err)
      }
    }
  }

  return (
    <div>
      <Navbar />

      <div className="container d-flex d-lg-flex justify-content-lg-center align-items-lg-center" style={{ height: "100%", display: "flex" }}>
        <div className="card mb-5" style={{ marginBottom: "0px", width: "30%" }}>
          <div className="card-body d-flex flex-column align-items-center">
            <form className="text-center" style={{ width: "90%" }} method="POST">
              <h1 className="text-start" style={{ marginBottom: "40px" }}><strong>Sign up</strong></h1>
              <div className="mb-3"><input className={`form-control ${(errText) && !username ? "is-invalid" : ""}`} type="text" name="username" placeholder="Username" maxLength={LIMITS.username.max} onChange={(e) => setUsername(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !fullname ? "is-invalid" : ""}`} type="text" name="fullname" placeholder="Full Name" maxLength={LIMITS.fullname.max} onChange={(e) => setFullname(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !email ? "is-invalid" : ""}`} type="email" name="email" placeholder="Email" maxLength={LIMITS.email.max} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !password ? "is-invalid" : ""}`} type="password" name="password" placeholder="Password" maxLength={LIMITS.password.max} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="mb-3"><button className="btn btn-primary d-block w-100" type="button" onClick={handleSubmit}>Register</button></div>
              <p className="text-danger">{errText}</p>
              <p className="text-muted">Already have an account? <Link to="/login">Login.</Link></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup