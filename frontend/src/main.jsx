import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import SignUp from "./components/SignUp.jsx";
import Login from "./components/Login.jsx";
import Logout from "./components/Logout.jsx";
import SearchUsers from "./components/SearchUsers.jsx";
import Inbox from "./components/Inbox.jsx";
import Followers from "./components/Followers.jsx";
import Following from "./components/Following.jsx";
import CreatePost from "./components/createPost.jsx";
import Posts from "./components/Posts.jsx";
import UserProfile from "./components/userProfile.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/searchUsers",
        element: <SearchUsers />,
      },
      {
        path: "/inbox",
        element: <Inbox />,
      },
      {
        path: "/followers",
        element: <Followers />,
      },
      {
        path: "/following",
        element: <Following />,
      },
      {
        path: "/createPost",
        element: <CreatePost />,
      },
      {
        path: "/posts",
        element: <Posts />,
      },
      {
        path: "/userProfile",
        element: <UserProfile />,
      },
    ],
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/logout",
    element: <Logout />,
  },
]);

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="278967308270-nk4qq1i5p11lh58u7sgrk5da7q8lmicf.apps.googleusercontent.com">
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  </GoogleOAuthProvider>
);
