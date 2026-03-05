import { useParams } from "react-router-dom";

import Navbar from "./components/Navbar";
import Post from "./components/Post";
import TextEditor from "./components/TextEditor";
import Comment from "./components/Comment";
import { useEffect, useState } from "react";
import axios from "axios";
import http from "../server/utils/axios";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import UserType from "../server/utils/UserType";

const UserPost = () => {
  const { username, postId } = useParams();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);

  const auth = useAuthUser<UserType>()

  useEffect(() => {
    const getPost = async () => {
      try {
        const response = await http.get(`/api/post/${username}/${postId}`);
        const data = response.data[0];
        setComments(data.comments)
        if (auth?.id === data.userID._id) {
          setIsOwner(true)
        } else {
          setIsOwner(false)
        }

      } catch (err) {

      }
    };

    getPost();
  }, []);

  const handleSubmit = async (text: String) => {
    if (text === "") {
      return
    }
    
    try {
      const response = await http.post("/api/comment", {
        postId: postId,
        userId: auth?.id,
        comment: text,
      })
      setComments([...comments, response.data])
      
    } catch (err) {
      console.error(err)
    }
  };

  const checkComments = () => {
    if (comments === undefined || comments.length === 0) {
      return <div style={{ textAlign: "center" }}>Nothing to see here</div>;
    }

    let commentList: React.ReactElement[] = [];
    comments.map((comment) => {
      commentList.push(
        <Comment
          key={comment._id}
          id={comment._id}
          isOwner={comment.commentorID == auth?.id}
          isDeleted={comment.isDeleted}
        />
      );
    });

    return commentList;
  };

  return (
    <div>
      <Navbar />

      <div className="container" style={{ maxWidth: "85%" }}>
        <Post
          key={postId}
          id={postId}
          isViewing={true}
          isOwner={isOwner}
        />
        <TextEditor
          placeholder="Add a comment..."
          handleSubmit={handleSubmit}
        />

        <h5 style={{ marginTop: "10px" }}>Comments</h5>
        <div style={{ margin: "10px 0px", padding: "0px 0px" }}>
          {/* <Comment key={1} id="1" /> */}
          {checkComments()}
        </div>
      </div>
    </div>
  );
};

export default UserPost;
