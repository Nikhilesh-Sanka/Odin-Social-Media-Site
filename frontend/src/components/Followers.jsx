import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../App.jsx";
import { serverUrl } from "../config.js";
import Loading from "./Loading.jsx";
import FollowersStyles from "../css-modules/Followers.module.css";
import PropTypes from "prop-types";

export default function Followers() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [followers, setFollowers] = useState(null);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!followers) {
      fetch(`${serverUrl}/user/followers`, {
        method: "GET",
        headers: {
          auth: token,
        },
      })
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            navigate("/");
          }
        })
        .then((result) => {
          setFollowers(result.followers);
          setLoadingStatus(false);
        })
        .catch((err) => {
          throw new Error(err);
        });
    }
  }, [followers]);

  return (
    <div className={FollowersStyles["followers"]}>
      {!loadingStatus ? (
        <>
          <h2>Followers</h2>
          <div>
            {followers.map((follower) => {
              return <FollowerCard follower={follower} key={follower.id} />;
            })}
          </div>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}

// defining the follower card for better user experience
function FollowerCard(props) {
  const [followerStatus, setFollowerStatus] = useState(
    props.follower.followers.length !== 0 ? "following" : "not-following"
  );
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // handling of remove followers
  async function removeFollower(followerId) {
    setFollowerStatus(null);
    const response = await fetch(`${serverUrl}/user/followers`, {
      method: "DELETE",
      body: JSON.stringify({
        followerId: followerId,
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

  //handling follow back
  async function followBack(followerId) {
    setFollowerStatus("following");
    const response = await fetch(`${serverUrl}/user/followers/follow`, {
      method: "POST",
      body: JSON.stringify({
        followerId: followerId,
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

  //opening a user profile
  function openProfile(userId) {
    navigate("/userProfile", { state: userId });
  }

  return (
    <>
      {followerStatus ? (
        <div className={FollowersStyles["follower"]}>
          <img
            src={props.follower.profile.image}
            onClick={() => {
              openProfile(props.follower.id);
            }}
          />
          <p>{props.follower.username}</p>
          <button
            onClick={() => {
              removeFollower(props.follower.id);
            }}
            className={FollowersStyles["remove-follower"]}
          >
            remove follower
            <img src="./cancel-icon.svg" />
          </button>
          {followerStatus === "following" ? null : (
            <button
              onClick={() => {
                followBack(props.follower.id);
              }}
              className={FollowersStyles["follow-back"]}
            >
              <img src="./add-user-icon.svg" />
              follow back
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}

FollowerCard.propTypes = {
  follower: PropTypes.object,
};
