import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Loading from "./Loading.jsx";
import PropTypes from "prop-types";
import SignUpStyles from "../css-modules/SignUp.module.css";
` `;
import { serverUrl } from "../config.js";

export default function SignUp() {
  const [errors, setErrors] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const firstName = useRef(null);
  const lastName = useRef(null);
  const username = useRef(null);
  const password = useRef(null);
  const confirmPassword = useRef(null);
  const navigate = useNavigate();

  async function handleSignUp(e) {
    e.preventDefault();
    const newErrors = {};
    let numOfErrors = 0;
    if (firstName.current.value.trim() === "") {
      newErrors.firstName = "First Name cannot be empty";
      numOfErrors++;
    }
    if (username.current.value.trim() === "") {
      newErrors.username = "username cannot be empty";
      numOfErrors++;
    }
    if (password.current.value.trim() === "") {
      newErrors.password = "password cannot be empty";
      numOfErrors++;
    }
    if (
      confirmPassword.current.value.trim() !== password.current.value.trim()
    ) {
      newErrors.confirmPassword =
        "confirm password and password are not matching";
      numOfErrors++;
    }
    if (numOfErrors !== 0) {
      setErrors(newErrors);
    } else {
      setLoadingStatus(true);
      const response = await fetch(`${serverUrl}/sign-up`, {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.current.value.trim(),
          lastName: lastName.current.value.trim(),
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
      } else if (response.status === 409) {
        setErrors({ username: "username already exists" });
        setLoadingStatus(false);
      } else {
        navigate("/serverError");
      }
    }
  }

  return (
    <>
      <h1 className={SignUpStyles["heading"]}>
        Welcome to Odin Book Social Media Site
      </h1>
      <div className={SignUpStyles["container"]}>
        <img src="./logo.jpg" alt="logo" />
        <main>
          <form>
            <label>
              First Name: <br />
              {errors.firstName ? <Error error={errors.firstName} /> : null}
              <input
                onChange={() => {
                  setErrors((errors) => {
                    return { ...errors, firstName: undefined };
                  });
                }}
                ref={firstName}
              />
            </label>
            <label>
              Last Name: <br />
              <input ref={lastName} />
            </label>
            <label className={SignUpStyles["username"]}>
              Username: <br />
              {errors.username ? <Error error={errors.username} /> : null}
              <input
                onChange={() => {
                  setErrors((errors) => {
                    return { ...errors, username: undefined };
                  });
                }}
                ref={username}
              />
            </label>
            <label>
              Password: <br />
              {errors.password ? <Error error={errors.password} /> : null}
              <input
                onChange={() => {
                  setErrors((errors) => {
                    return { ...errors, password: undefined };
                  });
                }}
                ref={password}
                type={password}
              />
            </label>
            <label>
              Confirm Password: <br />
              {errors.confirmPassword ? (
                <Error error={errors.confirmPassword} />
              ) : null}
              <input
                onChange={() => {
                  setErrors((errors) => {
                    return { ...errors, confirmPassword: undefined };
                  });
                }}
                ref={confirmPassword}
                type="password"
              />
            </label>
            {loadingStatus ? (
              <Loading />
            ) : (
              <button onClick={handleSignUp}>sign up</button>
            )}
          </form>
          <p>
            Already have a account? <Link to="/login">login</Link>
          </p>
        </main>
      </div>
    </>
  );
}

// error box of the sign up form
function Error(props) {
  return <p className={SignUpStyles["error"]}>{props.error}</p>;
}

Error.propTypes = {
  error: PropTypes.string,
};
