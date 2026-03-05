//styles
import { IconContext } from "react-icons";
import {
  BiUpvote,
  BiSolidUpvote,
  BiDownvote,
  BiSolidDownvote,
  BiComment,
  BiDotsHorizontalRounded,
  BiXCircle,
} from "react-icons/bi";
import { FaTrash, FaEdit, FaExclamationCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "../css/custom-styles.css";

// hooks
import { useEffect, useRef, useState } from "react";
import moment from "moment";
import axios from "axios";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";

// utils
import http from "../../server/utils/axios";
import UserType from "../../server/utils/UserType";
import Markdown from "react-markdown";

const Post = (props: {
  id?: string;
  isViewing?: boolean;
  isOwner: boolean;
  isAdmin? : boolean;
}) => {
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date>();

  const [isViewing, setIsViewing] = useState(props.isViewing || false);
  const [isOwner, setIsOwner] = useState(props.isOwner || false);
  const [isSetting, setIsSetting] = useState(false);

  const [voteCount, setVoteCount] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState<boolean>(false);
  const [isDownvoted, setIsDownvoted] = useState<boolean>(false);

  const auth = useAuthUser<UserType>();
  const navigate = useNavigate();
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getPost = async () => {
      try {
        const response = await http.get(`/api/post/${props.id}`);
        const data = response.data;

        setTitle(data.title);
        setUsername(data.userID.username);
        setContent(data.body);
        setDate(data.createdAt);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 500) {
            console.error("Database error.");
          }
        } else {
          console.error(err);
        }
      }
    };

    getPost();

    const getVotes = async () => {
      try {
        const response = await http.get(`/api/post/${props.id}/getvotes`);
        setVoteCount(response.data[0].totalVotes);

        if (response.data[0].upvotes.includes(auth?.id)) {
          setIsUpvoted(true);
        }

        if (response.data[0].downvotes.includes(auth?.id)) {
          setIsDownvoted(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getVotes();

    const clickHandler = (e: MouseEvent) => {
      if (!settingsRef?.current?.contains(e.target as Node)) {
        setIsSetting(false);
      }
    }

    document.addEventListener("mousedown", clickHandler)
  });

  const checkIfUpvoted = () => {
    if (isUpvoted) {
      return <BiSolidUpvote onClick={() => handleVote(0)} />;
    }

    return <BiUpvote onClick={() => handleVote(1)} />;
  };

  const checkIfDownvoted = () => {
    if (isDownvoted) {
      return <BiSolidDownvote onClick={() => handleVote(0)} />;
    }

    return <BiDownvote onClick={() => handleVote(-1)} />;
  };

  const handleVote = async (count: number) => {
    try {
      const response = await http.put("/api/posts/updatevote", {
        count: count,
        postID: props.id,
        userID: auth?.id,
      });
      // get upvote count
      if (response.status === 200) {
        switch (count) {
          case 1:
            setIsUpvoted(true);
            setIsDownvoted(false);
            break;
          case 0:
            setIsUpvoted(false);
            setIsDownvoted(false);
            break;
          case -1:
            setIsUpvoted(false);
            setIsDownvoted(true);
            break;
        }
        setVoteCount(response.data.votes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkIfViewing = () => {
    if (!isViewing) {
      return (
        <Link
          to={`/post/${username}/${props.id}`}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            inset: 0,
            zIndex: 0,
          }}
        ></Link>
      );
    }
  };

  const handleSetting = () => {
    setIsSetting(!isSetting);
  };

  const handleEdit = () => {
    navigate(`/edit/${props.id}`);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete your post forever?")) {
      try {
        const response = await http.delete(`/api/post/${props.id}`);
        if (response.status === 200) {
          navigate(0);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReport = async () => {
    try {
      const response = await http.put(`/api/post/${props.id}/report`, {
        userID: auth?.id
      })

      alert("The post has been reported! Thank you for helping us.");
    } catch (err) {

    }
  }

  const getSettings = () => {
    return (
      <div className="postSetting" ref={settingsRef}>
        <IconContext.Provider value={{ size: "0.9em" }}>
          {!isOwner && (
            <div id="report" onClick={() => handleReport()}>
              <FaExclamationCircle />
              <span>Report</span>
            </div>
          )}

          {isOwner && (
            <div id="edit" onClick={() => handleEdit()}>
              <FaEdit />
              <span>Edit</span>
            </div>
          )}

          {isOwner && (
            <div id="delete" onClick={() => handleDelete()}>
              <FaTrash />
              <span>Delete</span>
            </div>
          )}

          {props.isAdmin && (
            <div id="delete" onClick={() => handleDelete()}>
              <BiXCircle />
              <span style={{width: "100px"}}>Admin Delete</span>
            </div>
          )}
        </IconContext.Provider>
      </div>
    );
  };

  return (
    <div className="card" style={{ marginBottom: "10px" }}>
      <div className="card-body">
        {/* metadata */}
        <div
          className="onTop"
          style={{
            width: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Link to={`/user/${username}`} style={{ marginRight: 10 }}>
              {username}
            </Link>
            <span>{moment(date).format("MMMM D, YYYY")}</span>
          </div>
          <div
            className="d-md-flex d-lg-flex justify-content-md-end justify-content-lg-end"
            style={{ width: "100px", display: "flex" }}
          >

            <IconContext.Provider value={{ size: "1em" }}>
              <BiDotsHorizontalRounded
                onClick={() => handleSetting()}
                style={{ cursor: "pointer" }}
              />
            </IconContext.Provider>

            {isSetting && getSettings()}
          </div>
        </div>

        {/* title and content */}
        <h3
          className="card-title"
          style={{ ...{ fontWeight: "bold", marginBottom: "0" } }}
        >
          {title}
        </h3>

        <Markdown className="card-text">{content}</Markdown>

        {/* like and comment */}
        <div
          className="d-md-flex d-lg-flex justify-content-md-end justify-content-lg-start onTop"
          style={{ width: "100%", display: "flex" }}
        >
          {/* Box for Votes */}
          <div
            style={{
              height: "100%",
              minWidth: "50px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconContext.Provider value={{ size: "1.2em" }}>
              <div className="btnContainer">
                {checkIfUpvoted()}
                <span style={{ userSelect: "none" }}>{voteCount}</span>
                {checkIfDownvoted()}
              </div>

              <div className="btnContainer">
                <BiComment />
                <span>Comments</span>
              </div>
            </IconContext.Provider>
          </div>
        </div>

        {checkIfViewing()}
      </div>
    </div>
  );
};

export default Post;
