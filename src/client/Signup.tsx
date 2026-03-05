import { Link, useNavigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import { useEffect, useState } from "react"
import axios from "axios"
import http from "../server/utils/axios"

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
              <div className="mb-3"><input className={`form-control ${(errText) && !username ? "is-invalid" : ""}`} type="text" name="username" placeholder="Username" onChange={(e) => setUsername(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !fullname ? "is-invalid" : ""}`} type="text" name="fullname" placeholder="Full Name" onChange={(e) => setFullname(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !email ? "is-invalid" : ""}`} type="email" name="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !password ? "is-invalid" : ""}`} type="password" name="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /></div>
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