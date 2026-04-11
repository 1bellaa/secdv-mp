import Navbar from "./components/Navbar";
import Post from "./components/Post";
import NoticeBar from "./NoticeBar";

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
  const [loading, setLoading] = useState(true); // Added loading state
  const auth = useAuthUser<UserType>();

  // Combined fetch logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // If searchText is empty, get all, else search
        const url = searchText.trim() === "" ? "/api/posts" : `/api/posts/${searchText}`;
        const response = await http.get(url);
        setPosts(Array.isArray(response.data) ? response.data : []); 
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(() => {
      fetchData();
    }, searchText ? 500 : 0); // Only delay if user is typing

    return () => clearTimeout(delay);
  }, [searchText]);

  const renderPosts = () => {
    if (loading) return <div className="text-center mt-5">Loading posts...</div>;
    
    if (!posts || posts.length === 0) {
      return <div className="text-center mt-5">Nothing to see here</div>;
    }

    return posts.map((post) => {
      // Defensive check: handle both populated object or raw ID string
      const postOwnerId = typeof post.userID === 'object' ? post.userID._id : post.userID;
      
      return (
        <Post
          key={post._id}
          id={post._id}
          isViewing={false}
          isOwner={postOwnerId === auth?.id}
        />
      );
    });
  };

  return (
    <div>
      <NoticeBar /> 
      
      <Navbar setSearchText={setSearchText} />
      
      <div className="container" style={{ maxWidth: "85%", marginTop: "20px" }}>
        {renderPosts()}
      </div>
    </div>
  );
};

export default Home;
