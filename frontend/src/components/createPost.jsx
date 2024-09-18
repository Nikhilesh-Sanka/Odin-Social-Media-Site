import { useState, useRef, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../config.js";
import { TokenContext } from "../App.jsx";
import Post from "./Post.jsx";
import Loading from "./Loading.jsx";
import CreatePostStyles from "../css-modules/createPost.module.css";

export default function CreatePost() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [previousPosts, setPreviousPosts] = useState(null);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // fetching the previous posts
  useEffect(() => {
    if (!previousPosts) {
      fetch(`${serverUrl}/user/posts`, {
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
          setPreviousPosts(result.posts);
          setLoadingStatus(false);
        });
    }
  }, [previousPosts]);

  // refs for the dom elements
  const visibilityStatus = useRef(null);
  const content = useRef(null);

  // handling post creation
  async function createPost(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (content.current.value.trim() === "") {
      content.current.setCustomValidity("content cannot be empty");
      content.current.reportValidity();
      return;
    }
    const formData = new FormData(form);
    if (!visibilityStatus.current.checked) {
      formData.append("visibilityStatus", "all");
    }
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/posts`, {
      method: "POST",
      body: formData,
      headers: {
        auth: token,
      },
    });
    if (response.status === 201) {
      setPreviousPosts(null);
      return;
    } else {
      navigate("/serverError");
    }
  }
  return (
    <div className={CreatePostStyles["create-post"]}>
      {loadingStatus ? (
        <Loading />
      ) : (
        <>
          <h2>Create Post</h2>
          <form onSubmit={createPost}>
            <label>
              Content:
              <br />
              <textarea
                name="content"
                ref={content}
                onChange={(e) => {
                  e.target.setCustomValidity("");
                }}
              ></textarea>
            </label>
            <label>
              <img src="./plus-icon.svg" />
              attach image
              <input name="post-img" type="file" accept="image/*" />
            </label>
            <label>
              <input
                type="checkbox"
                name="visibility-status"
                ref={visibilityStatus}
              />
              private
            </label>
            <button>Post</button>
          </form>
          <h2>Your Posts</h2>
          {previousPosts.map((post) => {
            return <Post post={post} key={post.id} />;
          })}
        </>
      )}
    </div>
  );
}
