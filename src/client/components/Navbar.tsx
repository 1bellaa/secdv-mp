// icons
import { IconContext } from "react-icons";
import mainLogo from "../assets/LOGO1.png";
import { MdAccountCircle } from "react-icons/md";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

// hooks
import { useEffect, useState } from "react";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";

//utils
import http from "../../server/utils/axios";
import UserType from "../../server/utils/UserType";

const Navbar = (props: {
  setSearchText?: React.Dispatch<React.SetStateAction<string>>,
  search?: () => void
}) => {
  // if no login status is given, assume a user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const navigate = useNavigate();
  const auth = useAuthUser<UserType>();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    setUsername(auth?.username || "");
    setIsLoggedIn(isAuthenticated);
  }, []);

  const checkSearch = (text: string) => {
    if (!props.setSearchText) return;

    props.setSearchText(text)
  }

  return (
    <nav className="sticky-top navbar navbar-expand-md bg-body py-2">
      <div className="container">
        {/* Brand Icon and Text */}
        <NavLink
          className="navbar-brand d-flex align-items-center"
          to={isLoggedIn ? "/home" : "/"}
        >
          <span className="bs-icon-sm bs-icon-rounded bs-icon-primary d-flex justify-content-center align-items-center me-2 bs-icon">
            <img src={mainLogo} style={{ width: 100 }} alt="" />
          </span>
          <span>EduReview</span>
        </NavLink>

        <button
          data-bs-toggle="collapse"
          className="navbar-toggler"
          data-bs-target="#navcol-2"
        >
          <span className="visually-hidden">Toggle navigation</span>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navcol-2">
          {isLoggedIn ? (
            <li className="navbar-nav ms-auto">
              {/* search box */}
              {props.setSearchText && <div
                className="align-self-center"
                style={{
                  display: "flex",
                  marginRight: "15px",
                }}
              >
                <input
                  className="form-control"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  onChange={(e) => checkSearch(e.target.value) }
                />
                <button className="btn btn-outline-success" onClick={() => props.search}>
                  Search
                </button>
              </div>}

              {/* Create button */}
              <button
                type="button"
                className="btn btn-primary align-self-center"
                onClick={() => navigate("/create")}
              >
                Create
              </button>

              {/* Profile button */}
              <Link
                reloadDocument
                to={`/user/${username}`}
                className="nav-item nav-link active"
              >
                <IconContext.Provider value={{ size: "2.5em" }}>
                  <MdAccountCircle />
                </IconContext.Provider>
              </Link>
            </li>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
