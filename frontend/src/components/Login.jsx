import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import Loading from "./Loading.jsx";
import { serverUrl } from "../config.js";
import PropTypes from "prop-types";
import LoginStyles from "../css-modules/Login.module.css";

export default function Login() {
  const [googleUser, setGoogleUser] = useState(null);
  const [googleUserProfile, setGoogleUserProfile] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const username = useRef(null);
  const password = useRef(null);

  // fetching the google user
  useEffect(() => {
    if (googleUser) {
      setLoadingStatus(true);
      fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${googleUser.access_token}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${googleUser.access_token}`,
            Accept: "application/json",
          },
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((profile) => {
          setGoogleUserProfile(profile);
        })
        .catch((err) => {
          throw new Error(err);
        });
    }
  }, [googleUser]);

  // logging the user in using the provided google profile
  useEffect(() => {
    if (googleUserProfile) {
      fetch(`${serverUrl}/login/google`, {
        method: "POST",
        body: JSON.stringify({
          username: googleUserProfile.name,
          firstName: googleUserProfile.given_name,
          lastName: googleUserProfile.family_name,
          profileImg: googleUserProfile.picture,
          googleId: googleUserProfile.id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.status === 201) {
            return response.json();
          } else {
            navigate("/serverError");
          }
        })
        .then(({ token }) => {
          localStorage.setItem("token", token);
          navigate("/");
        });
    }
  }, [googleUserProfile]);

  // google login function
  const googleLogin = useGoogleLogin({
    onSuccess: (user) => {
      setGoogleUser(user);
    },
    onFailure: (error) => {
      throw new Error(error);
    },
  });

  // handling local login
  async function handleLogin(e) {
    e.preventDefault();
    const newErrors = {};
    let numOfErrors = 0;
    if (username.current.value.trim() === "") {
      newErrors.username = "username cannot be empty";
      numOfErrors++;
    }
    if (password.current.value.trim() === "") {
      newErrors.password = "password cannot be empty";
      numOfErrors++;
    }
    if (numOfErrors === 0) {
      setLoadingStatus(true);
      const response = await fetch(`${serverUrl}/login/local`, {
        method: "POST",
        body: JSON.stringify({
          username: username.current.value.trim(),
          password: password.current.value.trim(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 201) {
        const { token } = await response.json();
        localStorage.setItem("token", token);
        navigate("/");
      } else if (response.status === 404) {
        setErrors({ username: "username not found" });
      } else if (response.status === 403) {
        setErrors({ password: "incorrect password" });
      } else {
        navigate("/serverError");
      }
      setLoadingStatus(false);
    } else {
      setErrors(newErrors);
      return;
    }
  }

  return (
    <>
      <h1 className={LoginStyles["heading"]}>
        Welcome Back! Please Login to continue
      </h1>
      <div className={LoginStyles["container"]}>
        <img src="./logo.jpg" />
        <main>
          <div
            onClick={() => {
              googleLogin();
            }}
            className={LoginStyles["google-login"]}
          >
            <img src="./google-icon.jpg" />
            Login with google
          </div>
          <form>
            <label>
              Username: <br />
              {errors.username ? <Error error={errors.username} /> : null}
              <input ref={username} />
            </label>
            <label>
              Password: <br />
              {errors.password ? <Error error={errors.password} /> : null}
              <input ref={password} type="password" />
            </label>
            {loadingStatus ? (
              <Loading />
            ) : (
              <button onClick={handleLogin}>login</button>
            )}
          </form>
          <p>
            dont&rsquo;t have a account?<Link to="/sign-up">sign up</Link>
          </p>
        </main>
      </div>
    </>
  );
}

// Error element for the inputs
function Error(props) {
  return <p className={LoginStyles["error"]}>{props.error}</p>;
}

Error.propTypes = {
  error: PropTypes.string,
};
