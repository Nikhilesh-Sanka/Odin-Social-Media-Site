import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading.jsx";
import Post from "./Post.jsx";
import { TokenContext } from "../App.jsx";
import PostSectionStyles from "../css-modules/Posts.module.css";
import { serverUrl } from "../config.js";

export default function Posts() {
  const [result, setResult] = useState(null);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // fetching the posts
  useEffect(() => {
    fetch(`${serverUrl}/user/posts/all`, {
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
        setResult(result);
      })
      .catch((err) => {
        throw new Error(err);
      });
  }, []);

  return (
    <div className={PostSectionStyles["posts"]}>
      {result ? (
        <>
          <div className={PostSectionStyles["posts-display"]}>
            {result.posts.map((post) => {
              return (
                <Post post={post} clientId={result.clientId} key={post.id} />
              );
            })}
          </div>
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}
