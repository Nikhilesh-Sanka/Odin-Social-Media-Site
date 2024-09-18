import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../App.jsx";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import PropTypes from "prop-types";
import FollowingStyles from "../css-modules/Following.module.css";

export default function Following() {
  const [following, setFollowing] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // fetching the following users
  useEffect(() => {
    if (!following) {
      fetch(`${serverUrl}/user/following`, {
        method: "GET",
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
        .then((result) => {
          setFollowing(result.following);
          setLoadingStatus(false);
        });
    }
  }, []);

  return (
    <div className={FollowingStyles["following"]}>
      {!loadingStatus ? (
        <>
          <h2>Following</h2>
          <div>
            {following.map((user) => {
              return <FollowingUserCard user={user} key={user.id} />;
            })}
          </div>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}

// defining a following user card for better user experience
function FollowingUserCard(props) {
  const [userStatus, setUserStatus] = useState(true);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // handling un-follow
  async function unFollow(followingUserId) {
    setUserStatus(false);
    const response = await fetch(`${serverUrl}/user/following`, {
      method: "DELETE",
      body: JSON.stringify({
        followingUserId: followingUserId,
      }),
      headers: {
        "Content-Type": "application/json",
        auth: token,
      },
    });
    if (response.status === 204) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  //viewing the profile of a user
  function openProfile(userId) {
    navigate("/userProfile", { state: userId });
  }

  return (
    <>
      {userStatus ? (
        <div className={FollowingStyles["user"]}>
          <img
            src={props.user.profile.image}
            onClick={() => {
              openProfile(props.user.id);
            }}
          />
          <p>{props.user.username}</p>
          <button
            onClick={() => {
              unFollow(props.user.id);
            }}
          >
            unfollow <img src="cancel-icon.svg" />
          </button>
        </div>
      ) : null}
    </>
  );
}

FollowingUserCard.propTypes = {
  user: PropTypes.object,
};
