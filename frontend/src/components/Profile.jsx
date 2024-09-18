import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../App.jsx";
import ProfileStyles from "../css-modules/Profile.module.css";
import { serverUrl } from "../config.js";
import Loading from "./Loading.jsx";
import PropTypes from "prop-types";

export default function Profile(props) {
  const [profile, setProfile] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [fieldValues, setFieldValues] = useState(null);
  const navigate = useNavigate();
  const { token } = useContext(TokenContext);

  // refs for the form elements
  const firstName = useRef(null);

  // fetching the profile of the user
  useEffect(() => {
    if (!profile) {
      fetch(`${serverUrl}/user/profile`, {
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
        .then((profile) => {
          setProfile(profile);
          setFieldValues(profile);
          setLoadingStatus(false);
        })
        .catch((err) => {
          throw new Error(err);
        });
    }
  }, [profile]);

  // handling the editing of profile in form
  async function handleEditProfile(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (firstName.current.value.trim() === "") {
      firstName.setCustomValidity("first name cannot be empty");
      firstName.reportValidity();
      return;
    }
    const formData = new FormData(form);
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/profile`, {
      method: "POST",
      body: formData,
      headers: {
        auth: token,
      },
    });
    if (response.status === 201) {
      setProfile(null);
      setFieldValues(null);
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div
      className={`profile ${ProfileStyles["profile"]} ${
        props.profileOpen ? ProfileStyles["open"] : ProfileStyles["close"]
      }`}
    >
      {!loadingStatus ? (
        props.profileOpen ? (
          <>
            <div className={ProfileStyles["minimize"]}>
              <img
                src="./minimize-icon.svg"
                onClick={() => {
                  props.setProfileOpen(false);
                }}
              />
            </div>
            <div className={ProfileStyles["navigation"]}>
              <div
                className={`${ProfileStyles["icon"]} ${ProfileStyles["edit-icon"]}`}
              >
                <img
                  src="./edit-icon.svg"
                  alt="edit profile"
                  onClick={() => {
                    setEditProfile(true);
                  }}
                  title="edit profile"
                />
              </div>
              <div
                className={`${ProfileStyles["icon"]} ${ProfileStyles["logout-icon"]}`}
              >
                <img
                  src="./logout-icon.svg"
                  alt="logout"
                  onClick={() => {
                    navigate("/logout");
                  }}
                  title="logout"
                />
              </div>
            </div>
            {editProfile ? (
              <div className={ProfileStyles["edit-profile-close"]}>
                <img
                  src="./close-icon.svg"
                  onClick={() => {
                    setEditProfile(false);
                    setFieldValues(profile);
                  }}
                />
              </div>
            ) : null}
            <img
              src={fieldValues.image}
              className={ProfileStyles["profile-img"]}
            />
            {!editProfile ? (
              <>
                <p className={ProfileStyles["username"]}>{profile.username}</p>
                <p className={ProfileStyles["bio"]}>
                  <span>Bio:</span> {profile.bio}
                </p>
              </>
            ) : (
              <>
                <form onSubmit={handleEditProfile}>
                  <label>
                    <img src="./plus-icon.svg" />
                    update profile image
                    <br />
                    <input type="file" accept="image/*" name="profile-img" />
                  </label>
                  <label>
                    First Name:
                    <br />{" "}
                    <input
                      value={fieldValues["firstName"]}
                      onChange={(e) => {
                        setFieldValues((fieldValues) => {
                          return { ...fieldValues, firstName: e.target.value };
                        });
                      }}
                      name="firstName"
                      ref={firstName}
                    />
                  </label>
                  <label>
                    Last Name:
                    <br />{" "}
                    <input
                      value={fieldValues["lastName"]}
                      onChange={(e) => {
                        setFieldValues((fieldValues) => {
                          return { ...fieldValues, lastName: e.target.value };
                        });
                      }}
                      name="lastName"
                    />
                  </label>
                  <label>
                    Bio:
                    <br />
                    <textarea
                      value={fieldValues["bio"]}
                      onChange={(e) => {
                        setFieldValues((fieldValues) => {
                          return { ...fieldValues, bio: e.target.value };
                        });
                      }}
                      name="bio"
                    ></textarea>
                  </label>
                  <button>Edit Profile</button>
                </form>
              </>
            )}
          </>
        ) : (
          <img
            src={profile.image}
            onClick={() => {
              props.setProfileOpen(true);
            }}
          />
        )
      ) : (
        <Loading />
      )}
    </div>
  );
}

// setting the prop-types of the profile component
Profile.propTypes = {
  profileOpen: PropTypes.bool,
  setProfileOpen: PropTypes.func,
};
