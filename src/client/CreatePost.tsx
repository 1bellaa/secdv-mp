import { useEffect, useState } from "react"
import Navbar from "./components/Navbar"
import TextEditor from "./components/TextEditor"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import http from "../server/utils/axios"
import useAuthUser from "react-auth-kit/hooks/useAuthUser"
import UserType from "../server/utils/UserType"

const CreatePost = () => {
  const [titleText, setTitleText] = useState<String | null>(null)
  const [errText, setErrText] = useState("");

  const navigate = useNavigate();
  const auth = useAuthUser<UserType>();

  useEffect(() => {
    if (titleText) {
      setErrText("")
    }

    if (titleText === "") {
      setErrText("Input a title!")
      setTitleText(null)
    }
  }, [titleText])

  const handleSubmit = async (text: String) => {
    if (!titleText) {
      setErrText("Input a title!")
      return;
    }

    try {
      const response = await http.post("/api/create", {
        title: titleText,
        body: text,
        id: auth?.id
      })

      if (response.status === 200) {
        navigate("/home");
      }

    } catch (err) {
      
    }
  }

  return(
    <div>
      <Navbar />
      
      <div className="container" style={{ maxWidth: "85%" }}>
        <h2 style={{fontWeight: "bold"}}>Create Post</h2>
        <p className="text-danger">{errText}</p>
        <div>
          <input type="text" className="form-control" placeholder="Title"
            style={{
              "padding": "10px",
              marginBottom: "10px"
            }}
            onChange={(e) => setTitleText(e.target.value)}
          />
          <TextEditor handleSubmit={handleSubmit} placeholder="Say something..." />
        </div>
      </div>
    </div>
  )
}

export default CreatePost