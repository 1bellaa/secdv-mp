import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import http from "../server/utils/axios";
import Post from "./components/Post";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import UserType from "../server/utils/UserType";

const Admin = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [postReportsCount, setPostReportsCount] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "logs">("posts");
  const [logFilter, setLogFilter] = useState("");
  const auth = useAuthUser<UserType>();

  useEffect(() => {
    const getReportedPosts = async () => {
      try {
        const response = await http.get("/api/reported");
        setPosts(response.data.reportedPosts);
        setPostReportsCount(response.data.reportCounts);
      } catch (err) {
        console.error(err);
      }
    };

    const getLogs = async () => {
      try {
        const response = await http.get("/api/admin/logs");
        setLogs(response.data.reverse()); // newest first
      } catch (err) {
        console.error(err);
      }
    };

    // 1. Always fetch reported posts (for both Admin and Manager)
    getReportedPosts();

    // 2. Wrap getLogs in a role check
    if (auth?.role === "admin") {
      getLogs();
    }

  }, [auth?.role]); // Added auth?.role as a dependency

  const filteredLogs = logs.filter((log) => {
    if (!logFilter) return true;
    return log.type === logFilter;
  });

  const checkPosts = () => {
    if (posts === undefined || posts.length === 0) {
      return <div style={{ textAlign: "center" }}>Nothing to see here</div>;
    }

    return posts.map((post, index) => (
      <div key={post._id}>
        <span>
          {postReportsCount[index].reportsCount} Report
          {postReportsCount[index].reportsCount > 1 ? "s" : null}:
        </span>
        <Post
          id={post._id}
          isViewing={false}
          isOwner={post.userID._id == auth?.id}
          isAdmin={auth?.role === "admin"}
          canModerate={auth?.role === "admin" || auth?.role === "manager"}
        />
      </div>
    ));
  };

  const getBadgeClass = (status: string) => {
    return status === "SUCCESS" ? "bg-success" : "bg-danger";
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "AUTH": return "bg-primary";
      case "ACCESS_CONTROL": return "bg-warning text-dark";
      case "VALIDATION": return "bg-secondary";
      default: return "bg-info text-dark";
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ maxWidth: "85%" }}>
        <h2 className="my-3">
          {auth?.role === "admin" ? "Admin Dashboard" : "Management Dashboard"}
        </h2>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              Reported Posts
            </button>
          </li>
          
          {/* ONLY show this tab to Admins */}
          {auth?.role === "admin" && (
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "logs" ? "active" : ""}`}
                onClick={() => setActiveTab("logs")}
              >
                Security Logs
                {logs.length > 0 && (
                  <span className="badge bg-secondary ms-2">{logs.length}</span>
                )}
              </button>
            </li>
          )}
        </ul>

        {/* Reported Posts Tab */}
        {activeTab === "posts" && checkPosts()}

        {/* Security Logs Tab */}
        {activeTab === "logs" && (
          auth?.role === "admin" ? (
            <div>
              {/* Filter Bar */}
              <div className="d-flex gap-2 mb-3">
                {["", "AUTH", "ACCESS_CONTROL", "VALIDATION"].map((type) => (
                  <button
                    key={type}
                    className={`btn btn-sm ${logFilter === type ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setLogFilter(type)}
                  >
                    {type === "" ? "All" : type}
                  </button>
                ))}
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted">No logs found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover table-bordered align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Timestamp</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, i) => {
                        const { timestamp, type, status, ...details } = log;
                        return (
                          <tr key={i}>
                            <td className="text-nowrap small">
                              {new Date(timestamp).toLocaleString()}
                            </td>
                            <td>
                              <span className={`badge ${getTypeBadgeClass(type)}`}>
                                {type}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getBadgeClass(status)}`}>
                                {status}
                              </span>
                            </td>
                            <td className="small">
                              {Object.entries(details).map(([k, v]) => (
                                <span key={k} className="me-3">
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* This part is what the "manager" role sees instead of the table */
            <div className="alert alert-warning mt-3">
              <strong>Access Denied:</strong> You do not have permission to view security logs. 
              Please contact a System Administrator if you require access to this data.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Admin;