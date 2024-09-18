import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../App.jsx";
import Loading from "./Loading.jsx";
import SearchUsersStyles from "../css-modules/SearchUsers.module.css";
import { serverUrl } from "../config.js";
import PropTypes from "prop-types";

export default function SearchUsers() {
  const [results, setResults] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();
  const searchBar = useRef(null);

  // adding the event listener to the search bar
  useEffect(() => {
    function keydownEventHandler(e) {
      e.currentTarget.removeEventListener("keyup", keyupEventHandler);
      if (e.key === "Enter") {
        searchBar.current.addEventListener("keyup", keyupEventHandler);
      }
    }

    function keyupEventHandler(e) {
      if (e.key === "Enter") {
        if (searchBar.current.value.trim() !== "") {
          setLoadingStatus(true);
          handleSearch(searchBar.current.value.trim());
        }
      }
    }
    searchBar.current.addEventListener("keydown", keydownEventHandler);
  }, []);

  // handling the search of the users
  async function handleSearch(query) {
    const response = await fetch(
      `${serverUrl}/user/users?searchQuery=${query}`,
      {
        method: "GET",
        headers: {
          auth: token,
        },
      }
    );
    if (response.status === 200) {
      const results = await response.json();
      console.log(results);
      setResults(results);
      setLoadingStatus(false);
    } else {
      navigate("/serverError");
    }
  }

  // handling browse users selection
  function browseUsers() {
    handleSearch("");
    searchBar.current.value = "";
  }

  return (
    <div className={SearchUsersStyles["search-users"]}>
      <button
        className={SearchUsersStyles["browse-people"]}
        onClick={browseUsers}
      >
        <img src="./browse-icon.svg" />
        Browse People
      </button>
      <label className={SearchUsersStyles["search-bar"]}>
        <input ref={searchBar} />
        <img
          src="./search-icon.svg"
          onClick={() => {
            if (searchBar.current.value.trim() !== "") {
              handleSearch(searchBar.current.value.trim());
            }
          }}
        />
      </label>
      {loadingStatus ? (
        <Loading />
      ) : results ? (
        <div className={SearchUsersStyles["results"]}>
          {results.map((user) => {
            return <UserCard user={user} key={user.id} />;
          })}
        </div>
      ) : null}
    </div>
  );
}

// defining the user card
function UserCard(props) {
  const [userStatus, setUserStatus] = useState(
    props.user.followers.length !== 0
      ? "following"
      : props.user.receivedRequests.length !== 0
      ? props.user.receivedRequests[0].requestStatus
      : null
  );
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // handling the follow request
  async function handleFollowRequest(user) {
    setUserStatus("pending");
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "POST",
      body: JSON.stringify({
        friendId: user.id,
      }),
      headers: {
        "Content-Type": "application/json",
        auth: token,
      },
    });
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  // opening a user profile
  function openProfile(userId) {
    navigate("/userProfile", { state: userId });
  }

  return (
    <div className={SearchUsersStyles["user"]}>
      <img
        src={props.user.profile.image}
        onClick={() => {
          openProfile(props.user.id);
        }}
      />
      <p>{props.user.username}</p>
      {userStatus === "following" ? (
        <p>you are following the user</p>
      ) : userStatus === "pending" ? (
        <p>request pending</p>
      ) : userStatus === "rejected" ? (
        <p>
          follow request rejected
          <button onClick={() => handleFollowRequest(props.user)}>
            <img src="./add-user-icon.svg" /> re-send
          </button>
        </p>
      ) : (
        <button
          onClick={() => {
            handleFollowRequest(props.user);
          }}
        >
          <img src="./add-user-icon.svg" /> follow
        </button>
      )}
    </div>
  );
}
// prop checking the user card component
UserCard.propTypes = {
  user: PropTypes.object,
};
