import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import http from "../server/utils/axios";
import Post from "./components/Post";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import UserType from "../server/utils/UserType";

const Admin = () => {
	const [posts, setPosts] = useState<any[]>([]);
	const [postReportsCount, setPostReportsCount] = useState<any[]>([])
	const auth = useAuthUser<UserType>();

	useEffect(() => {
		const getReportedPosts = async () => {
			try {
				const response = await http.get("/api/reported");
				setPosts(response.data.reportedPosts)
				setPostReportsCount(response.data.reportCounts)
			} catch (err) {
				console.error(err)
			}
		};
	
		getReportedPosts()
	}, []);

	const checkPosts = () => {
    if (posts === undefined || posts.length === 0) {
      return <div style={{ textAlign: "center" }}>Nothing to see here</div>;
    }

    let postList: React.ReactElement[] = [];
    posts.map((post, index) => {
      postList.push(
				<div key={post._id}>
					<span>{postReportsCount[index].reportsCount} Report{postReportsCount[index].reportsCount > 1 ? "s" : null}:</span>
					<Post
						id={post._id}
						isViewing={false}
						isOwner={post.userID._id == auth?.id}
						isAdmin={true}
					/>
				</div>
      );
    });

    return postList;
  };

	return (
    <div>
      <Navbar />

      <div className="container" style={{ maxWidth: "85%" }}>
        <h2>Reported Posts</h2>

				{checkPosts()}
      </div>
    </div>
  );
};

export default Admin;
