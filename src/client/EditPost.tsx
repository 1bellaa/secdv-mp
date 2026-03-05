import { useEffect, useState } from "react"
import Navbar from "./components/Navbar"
import TextEditor from "./components/TextEditor"
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"
import http from "../server/utils/axios"

const EditPost = () => {
  const {id} = useParams()
  const [titleText, setTitleText] = useState("")
  const [editorText, setEditorText] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const getPost = async () => {
      const response = await http.get(`/api/post/${id}`)
      const data = response.data
      setTitleText(data.title)
      setEditorText(data.body)
    }

    getPost();
  }, [])

  const handleSubmit = async (bodyText: String) => {
    try {
      const response = await http.patch(`/api/post/${id}`, {          
        title: titleText,
        body: bodyText,
      })
      if (response.status === 200) {
        navigate(-1)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return(
    <div>
      <Navbar />
      
      <div className="container" style={{ maxWidth: "85%" }}>
        <h2 style={{fontWeight: "bold"}}>Edit Post</h2>
        <div>
          <input type="text" className="form-control" placeholder="Title"
            style={{
              "padding": "10px",
              marginBottom: "10px"
            }}
            onChange={(e) => setTitleText(e.target.value)}
            value={titleText}
          />
          <TextEditor handleSubmit={handleSubmit} editorText={editorText} />
        </div>
      </div>
    </div>
  )
}

export default EditPost