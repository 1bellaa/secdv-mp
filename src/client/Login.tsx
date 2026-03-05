import { Link, useNavigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import { useEffect, useState } from "react"
import http from "../server/utils/axios"
import axios from "axios"
import useSignIn from 'react-auth-kit/hooks/useSignIn';

const Login = () => {

  const [username, setUsername] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [errText, setErrText] = useState<string | null>(null)

  const navigate = useNavigate()
  const signIn = useSignIn()

  useEffect(() => {
    if (username && password) {
      setErrText("")
    }

    if (username === "") {
      setErrText("Input username!")
      setUsername(null)
    }

    if (password === "") {
      setErrText("Input password!")
      setPassword(null)
    }

    if (username === null && password === null && errText !== null) {
      setErrText("Input username and password!")
    }
  }, [username, password])

  const handleSubmit = async () => {
    try {
      // dont do anything when there is still an error
      if (errText !== "") {
        return
      }

      const response = await http.post("/api/login", {
        username: username, password: password
      })

      if (signIn({
        auth: {
          token: response.data.token,
          type: "Bearer"
        },
        refresh: response.data.refreshToken,
        userState: response.data.user
      })) {
        //redicrect on sign in
        navigate("/home")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 500) {
          console.error("Database error.")
          setErrText("An error has occured.")
        }
        if (err.response?.status === 404) {
          console.error("User is not found.")
          setErrText("User does not exist.")
        }
        if (err.response?.status === 401) {
          console.error("Wrong password.")
          setErrText("Wrong password.")
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
            <form className="text-center" method="POST" style={{ width: "90%" }} >
              <h1 className="text-start" style={{ marginBottom: "40px" }}><strong>Log in</strong></h1>
              <div className="mb-3"><input className={`form-control ${(errText) && !username ? "is-invalid" : ""}`} type="text" name="username" placeholder="Username" onChange={(e) => setUsername(e.target.value)} /></div>
              <div className="mb-3"><input className={`form-control ${(errText) && !password ? "is-invalid" : ""}`} type="password" name="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="mb-3"><button className="btn btn-primary d-block w-100" type="button" onClick={handleSubmit}>Login</button></div>
              <p className="text-danger">{errText}</p>
              <p className="text-muted">Forgot your password?</p>
              <p className="text-muted">Dont have an account? <Link to="/signup">Signup.</Link></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login