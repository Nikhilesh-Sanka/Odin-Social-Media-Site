import { createContext, useState, useEffect, useRef } from "react";
import {
  Navigate,
  useNavigate,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import Profile from "./components/Profile.jsx";
import { serverUrl } from "./config.js";

export const TokenContext = createContext(null);

function App() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { pathname: route } = useLocation();
  const navList = useRef(null);
  let sectionBeingViewed = null;

  if (route.split("/")[1]) {
    sectionBeingViewed = route.split("/")[1];
  }

  useEffect(() => {
    if (token) {
      fetch(`${serverUrl}/user/profile`, {
        headers: {
          auth: token,
        },
      })
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            navigate("/serverError");
          }
        })
        .then((userProfile) => {
          setUserProfile(userProfile);
        });
    }
    document.querySelector("body").addEventListener("click", () => {
      navList.current.classList.remove("visible");
    });
  }, []);

  // opening and closing of nav list
  function openCloseNavList(e) {
    e.stopPropagation();
    navList.current.classList.toggle("visible");
  }

  return (
    <>
      {token ? (
        <TokenContext.Provider value={{ token, userProfile }}>
          <>
            <header>
              <img src="./logo.jpg" onClick={() => navigate("/")} />
              <h1>Odin Book</h1>
            </header>
            <nav>
              <ul ref={navList}>
                <li
                  className={
                    sectionBeingViewed === "posts" ? "being-viewed" : ""
                  }
                >
                  <Link to="/posts">posts</Link>
                </li>
                <li
                  className={
                    sectionBeingViewed === "searchUsers" ? "being-viewed" : ""
                  }
                >
                  <Link to="/searchUsers">search users</Link>
                </li>
                <li
                  className={
                    sectionBeingViewed === "inbox" ? "being-viewed" : ""
                  }
                >
                  <Link to="/inbox">inbox</Link>
                </li>
                <li
                  className={
                    sectionBeingViewed === "createPost" ? "being-viewed" : ""
                  }
                >
                  <Link to="/createPost">create post</Link>
                </li>
                <li
                  className={
                    sectionBeingViewed === "followers" ? "being-viewed" : ""
                  }
                >
                  <Link to="/followers">followers</Link>
                </li>
                <li
                  className={
                    sectionBeingViewed === "following" ? "being-viewed" : ""
                  }
                >
                  <Link to="/following">following</Link>
                </li>
              </ul>
              <img src="./more-icon.svg" onClick={openCloseNavList} />
            </nav>
            <Profile
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
            />
            <main className={`${profileOpen ? "" : "full"} main`}>
              <Outlet />
            </main>
          </>
        </TokenContext.Provider>
      ) : (
        <Navigate to="/login" />
      )}
    </>
  );
}

export default App;
