import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../App.jsx";
import { serverUrl } from "../config.js";
import Loading from "./Loading.jsx";
import PropTypes from "prop-types";
import PostStyles from "../css-modules/Post.module.css";

export default function Post(props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentBeingAdded, setCommentBeingAdded] = useState(false);
  const [liked, setLiked] = useState(props.post.likedBy.length !== 0);
  const { token, userProfile } = useContext(TokenContext);
  const navigate = useNavigate();
  const commentSection = useRef(null);
  const commentField = useRef(null);
  const post = props.post;

  // liking a post
  async function likePost(e) {
    e.currentTarget.parentNode.childNodes[1].innerText = `${
      parseInt(e.currentTarget.parentNode.childNodes[1].innerText) + 1
    }`;
    setLiked(true);
    const response = await fetch(
      `${serverUrl}/user/posts/like?postId=${post.id}`,
      {
        method: "PUT",
        headers: {
          auth: token,
        },
      }
    );
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  //disliking a post
  async function dislikePost(e) {
    e.currentTarget.parentNode.childNodes[1].innerText = `${
      parseInt(e.currentTarget.parentNode.childNodes[1].innerText) - 1
    }`;
    setLiked(false);
    const response = await fetch(
      `${serverUrl}/user/posts/dislike?postId=${post.id}`,
      {
        method: "PUT",
        headers: {
          auth: token,
        },
      }
    );
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  // handling the opening and closing of comments
  async function handleCommentsClick() {
    if (!commentsOpen) {
      setCommentsOpen(true);
      const response = await fetch(
        `${serverUrl}/user/comment?postId=${post.id}`,
        {
          method: "GET",
          headers: {
            auth: token,
          },
        }
      );
      if (response.status === 200) {
        const comments = await response.json();
        console.log(comments);
        setComments(comments);
      } else {
        navigate("/serverError");
      }
    } else {
      setComments(null);
      setCommentsOpen(false);
    }
  }

  // send comment
  async function handleAddComment(e) {
    e.preventDefault();
    if (commentField.current.value.trim() === "") {
      return;
    }
    const comment = commentField.current.value;
    const div = document.createElement("div");
    const date = new Date();
    function getFormattedNumber(string) {
      const number = parseInt(string);
      if (number < 10) {
        return `0${number}`;
      } else {
        return `${number}`;
      }
    }
    div.innerHTML = `<div class=${PostStyles["comment"]}>
                        <img src=${userProfile.image} />
                        <p>you</p>
                        <p>${getFormattedNumber(
                          date.getHours()
                        )}:${getFormattedNumber(
      date.getMinutes()
    )} ${date.getFullYear()}-${
      date.getMonth() < 9 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`
    }-${getFormattedNumber(date.getDate())}</p>
                        <p>${comment}</p>
                    </div>`;
    commentSection.current.prepend(div);
    setCommentBeingAdded(false);
    const response = await fetch(
      `${serverUrl}/user/comment?postId=${post.id}`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: comment,
        }),
        headers: {
          auth: token,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status == 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div className={PostStyles["post"]}>
      <div className={PostStyles["header"]}>
        <img src={post.author.profile.image} />
        <p>{`${post.createdAt.slice(11, 16)} ${post.createdAt.slice(
          0,
          10
        )}`}</p>
        <p>
          {props.clientId !== post.author.id ? post.author.username : "you"}
        </p>
        <p>{post.visibleTo === "all" ? "public" : "private"}</p>
      </div>
      <div className={PostStyles["main-content"]}>
        <p>{post.content}</p>
        {post.image ? <img src={post.image} /> : null}
      </div>
      <div className={PostStyles["likes-and-comment"]}>
        <p>
          {!liked ? (
            <img src="./not-liked-icon.svg" onClick={likePost} />
          ) : (
            <img src="./liked-icon.svg" onClick={dislikePost} />
          )}
          <span>{post.likes}</span>
        </p>
        <img src="./comments-icon.svg" onClick={handleCommentsClick} />
      </div>
      {commentsOpen ? (
        <div className={PostStyles["comments"]}>
          <img
            src="./close-icon.svg"
            onClick={() => {
              setComments(null);
              setCommentsOpen(false);
            }}
            className={PostStyles["close-comment"]}
          />
          {commentBeingAdded ? (
            <form className={PostStyles["add-comment"]}>
              <label>
                comment: <br />
                <textarea ref={commentField}></textarea>
              </label>
              <div className={PostStyles["buttons"]}>
                <button onClick={handleAddComment} type="submit">
                  post comment
                </button>
                <button
                  onClick={() => setCommentBeingAdded(false)}
                  type="button"
                >
                  cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setCommentBeingAdded(true);
              }}
              className={PostStyles["add-comment-btn"]}
            >
              <img src="./plus-icon.svg" />
              add comment
            </button>
          )}
          {comments ? (
            <>
              <h3>Comments</h3>
              <div ref={commentSection}>
                {comments.map((comment) => {
                  return (
                    <Comment
                      comment={comment}
                      key={comment.id}
                      clientId={props.clientId}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <Loading />
          )}
        </div>
      ) : null}
    </div>
  );
}

// setting the prop-type for the post component
Post.propTypes = {
  post: PropTypes.object,
  clientId: PropTypes.string,
};

// comments component
function Comment(props) {
  return (
    <div className={PostStyles["comment"]}>
      <img src={props.comment.author.profile.image} />
      <p>
        {props.clientId !== props.comment.author.id
          ? props.comment.author.username
          : "you"}
      </p>
      <p>{`${props.comment.createdAt.slice(
        11,
        16
      )} ${props.comment.createdAt.slice(0, 10)}`}</p>
      <p>{props.comment.comment}</p>
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.object,
  clientId: PropTypes.string,
};
