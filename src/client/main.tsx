import React from "react";
import ReactDOM from "react-dom/client";
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { Navigate, Outlet } from 'react-router-dom';

import Home from "./Home";
import UserPost from "./UserPost";
import Profile from "./Profile";
import Login from "./Login";
import Signup from "./Signup";
import CreatePost from "./CreatePost";
import EditPost from "./EditPost";
import ChangePassword from "./ChangePassword";
import ResetPassword from "./ResetPassword";
import RequestReset from "./RequestReset";

import "bootstrap/dist/css/bootstrap.css";
import "./scss/main.scss";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "react-auth-kit/AuthProvider";
import store from "../server/utils/authStore";
import AuthOutlet from "@auth-kit/react-router/AuthOutlet";
import Admin from "./Admin";
import About from "./about";

interface IUserData {
  role: string;
  username: string;
}

const AdminOutlet = () => {
  const auth = useAuthUser<IUserData>();

  // Requirement 2.2.2: Fail Securely
  // Allow both 'admin' AND 'manager' to pass through to the dashboard
  const isPrivileged = auth?.role === 'admin' || auth?.role === 'manager';

  return isPrivileged ? <Outlet /> : <Navigate to="/home" replace />;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider store={store}>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />

          <Route path="/forgot-password" element={<RequestReset />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          {/* Protected routes */}
          <Route element={<AuthOutlet fallbackPath="/login" />}>
            <Route path="/home" element={<Home />} />
            <Route path="/create" element={<CreatePost />} />

            <Route path="/change-password" element={<ChangePassword />} />
            <Route
              path="/edit/:id"
              element={<EditPost />}
            />

            {/* Show a user */}
            <Route
              path="/user/:username"
              element={<Profile />}
            />

            {/* Show a post */}
            <Route
              path="/post/:username/:postId"
              element={<UserPost />}
            />

            {/* Requirement 2.2.3: Enforce Logic Flow */}
            <Route element={<AdminOutlet />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            {/* <Route 
              path="/admin"
              element={<Admin />}
            /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
