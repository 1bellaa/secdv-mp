import Navbar from "./components/Navbar";
import Post from "./components/Post";

// hooks
import { useEffect, useState } from "react";

// utils
import http from "../server/utils/axios";
import axios from "axios";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import UserType from "../server/utils/UserType";

const Home = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const auth = useAuthUser<UserType>();

  useEffect(() => {
    const getPosts = async () => {
      try {
        const response = await http.get("/api/posts");
        setPosts(response.data);
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

    getPosts();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      getSearch()
    }, 1500);

    return () => clearTimeout(delay)
  }, [searchText])

  const getSearch = async () => {
    try {
      const response = await http.get(`/api/posts/${searchText}`)
      setPosts(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const checkPosts = () => {
    if (posts === undefined || posts.length === 0) {
      return <div style={{ textAlign: "center" }}>Nothing to see here</div>;
    }

    let postList: React.ReactElement[] = [];
    posts.map((post) => {
      postList.push(
        <Post
          key={post._id}
          id={post._id}
          isViewing={false}
          isOwner={post.userID._id == auth?.id}
        />
      );
    });

    return postList;
  };

  return (
    <div>
      <Navbar setSearchText={setSearchText} search={getSearch} />
      {/* Posts list container */}
      <div className="container" style={{ maxWidth: "85%" }}>
        {checkPosts()}
      </div>
    </div>
  );
};

export default Home;
