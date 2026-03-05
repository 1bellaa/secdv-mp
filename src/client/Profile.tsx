// icons/designs
import { BiUpvote, BiDownvote } from "react-icons/bi";
import { IconContext } from "react-icons";

// components
import userPfp from "./assets/user-pfp.png";
import Navbar from "./components/Navbar";
import Post from "./components/Post";

// hooks
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import useSignOut from "react-auth-kit/hooks/useSignOut";

// utils
import http from "../server/utils/axios";
import UserType from "../server/utils/UserType";
import axios from "axios";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const auth = useAuthUser<UserType>();
  const signout = useSignOut();

  const [fullname, setFullname] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await http.get(`/api/user/${username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const user = response.data.user;
        setFullname(user.displayName);
        setPosts(response.data.posts);

        if (auth?.id === user._id) {
          setIsOwner(true);
        }

        getVotes(user._id);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            console.error("User is not found.");
            // redirect to error page
            // maybe create an error component to show
          }
        } else {
          console.error(err);
        }
      }
    };

    const getVotes = async (id: String) => {
      try {
        const response = await http.get(`/api/user/${id}/getvotes`);
        if (response.data.length === 0) {
          return;
        }
        const data = response.data[0];
        setTotalVotes(data.totalUpvotes - data.totalDownvotes);
      } catch (err) {
        console.error(err)
      }
    };

    getUser();
  }, []);

  const handleLogout = () => {
    signout();
    navigate("/login");
  };

  const checkLogout = () => {
    if (!isOwner) return null;

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
      }}>
        <button
          type="button"
          className="btn btn-danger align-self-start"
          onClick={handleLogout}
          style={{ marginTop: "15px" }}
          >
          Logout
        </button>

        {auth?.role === "admin" && <Link to="/admin">Admin Dashboard</Link>}
      </div>
    );
  };

  const checkPosts = () => {
    if (posts == undefined || posts.length == 0) {
      return <div style={{ textAlign: "center" }}>Nothing to see here</div>;
    }

    let postList: React.ReactElement[] = [];
    posts.map((post: any) => {
      postList.push(
        <Post
          key={post._id}
          id={post._id}
          isViewing={false}
          isOwner={isOwner}
        />
      );
    });

    return postList;
  };

  return (
    <div>
      <Navbar />

      <div className="container">
        <div className="row">
          <div className="col-md-4 col-lg-3">
            <div className="card position-fixed" style={{ width: "260px" }}>
              <div className="card-body">
                <img src={userPfp} width="100px" />
                <h6
                  className="text-muted card-subtitle"
                  style={{ marginTop: "8px", marginBottom: "0px !important" }}
                >
                  {username}
                </h6>
                <h4 className="card-title" style={{ marginBottom: "16px" }}>
                  <strong>{fullname}</strong>
                </h4>
                <IconContext.Provider value={{ size: "1.8em" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BiUpvote />
                    <div style={{ marginLeft: "4px" }}>
                      <h5 style={{ marginBottom: "0px" }}>
                        <strong>Votes</strong>
                      </h5>
                      <span>{totalVotes}</span>
                    </div>
                  </div>
                </IconContext.Provider>
                {checkLogout()}
              </div>
            </div>
          </div>
          <div className="col">{checkPosts()}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
