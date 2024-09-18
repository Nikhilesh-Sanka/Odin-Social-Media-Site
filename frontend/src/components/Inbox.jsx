import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../App.jsx";
import Loading from "./Loading.jsx";
import InboxStyles from "../css-modules/Inbox.module.css";
import { serverUrl } from "../config.js";
import PropTypes from "prop-types";

export default function Inbox() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [requests, setRequests] = useState(null);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!requests) {
      fetch(`${serverUrl}/user/request`, {
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
        .then((requests) => {
          setRequests(requests);
          setLoadingStatus(false);
        })
        .catch((error) => {
          throw new Error(error);
        });
    }
  }, [requests]);

  // delete requests of category
  async function deleteRequestOfCategory(category) {
    setLoadingStatus(true);
    const response = await fetch(`${serverUrl}/user/request/${category}`, {
      method: "DELETE",
      headers: {
        auth: token,
      },
    });
    if (response.status === 204) {
      setRequests(null);
    } else {
      navigate("/serverError");
    }
  }

  return (
    <div className={InboxStyles["inbox"]}>
      {!loadingStatus ? (
        <>
          <h2>Inbox</h2>
          <div className={InboxStyles["category-delete-buttons"]}>
            <button onClick={() => deleteRequestOfCategory("rejected")}>
              <img src="./delete-icon.svg" />
              delete rejected requests
            </button>
            <button onClick={() => deleteRequestOfCategory("accepted")}>
              <img src="./delete-icon.svg" />
              clear accepted requests
            </button>
            <button onClick={() => deleteRequestOfCategory("pending")}>
              <img src="./delete-icon.svg" />
              delete pending requests
            </button>
          </div>
          <div className={InboxStyles["sent-requests"]}>
            <h3>Sent Requests</h3>
            {requests.sentRequests.map((request) => {
              return <SentRequestCard request={request} key={request.id} />;
            })}
          </div>
          <hr />
          <div className={InboxStyles["received-requests"]}>
            <h3>Received Requests</h3>
            {requests.receivedRequests.map((request) => {
              return <ReceivedRequestCard request={request} key={request.id} />;
            })}
          </div>
          <hr />
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}

// defining the sent request card separately for better user experience
function SentRequestCard(props) {
  const [requestStatus, setRequestStatus] = useState(
    props.request.requestStatus
  );
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // taking care of cancel requests
  async function cancelRequest(requestId) {
    setRequestStatus(null);
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "DELETE",
      body: JSON.stringify({
        requestId: requestId,
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

  // taking care of resending of requests
  async function resendRequest(request) {
    setRequestStatus("pending");
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "POST",
      body: JSON.stringify({
        friendId: request.receivedUser.id,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
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
    <>
      {requestStatus ? (
        <div className={InboxStyles["sent-request"]}>
          <img
            src={props.request.receivedUser.profile.image}
            onClick={() => {
              openProfile(props.request.receivedUser.id);
            }}
          />
          <p>{props.request.receivedUser.username}</p>
          {requestStatus === "accepted" ? (
            <p>Request Accepted</p>
          ) : (
            <button
              onClick={() => {
                cancelRequest(props.request.id);
              }}
              className={InboxStyles["cancel-request"]}
            >
              Cancel Request <img src="./cancel-icon.svg" />
            </button>
          )}
          {requestStatus === "pending" ? (
            <p className={InboxStyles["pending-caption"]}>request is pending</p>
          ) : requestStatus === "rejected" ? (
            <p className={InboxStyles["rejected-caption"]}>
              request is rejected{" "}
              <button
                onClick={() => {
                  resendRequest(props.request);
                }}
              >
                <img src="./add-user-icon.svg" /> resend
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

SentRequestCard.propTypes = {
  request: PropTypes.object,
};

// defining the received request card for better user experience
function ReceivedRequestCard(props) {
  const [requestStatus, setRequestStatus] = useState(true);
  const { token } = useContext(TokenContext);
  const navigate = useNavigate();

  // accepting a request
  async function acceptRequest(requestId) {
    setRequestStatus(false);
    const response = await fetch(`${serverUrl}/user/followers`, {
      method: "POST",
      body: JSON.stringify({
        requestId: requestId,
      }),
      headers: {
        auth: token,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 201) {
      return;
    } else {
      navigate("/serverError");
    }
  }

  // rejecting a request
  async function rejectRequest(requestId) {
    setRequestStatus(false);
    const response = await fetch(`${serverUrl}/user/request`, {
      method: "PUT",
      body: JSON.stringify({
        requestId: requestId,
        requestStatus: false,
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
    <>
      {requestStatus ? (
        <div className={InboxStyles["received-request"]}>
          <img
            src={props.request.sentUser.profile.image}
            onClick={() => {
              openProfile(props.request.sentUser.id);
            }}
          />
          <p>{props.request.sentUser.username}</p>
          <div>
            <button>
              <img
                src="./tick-icon.svg"
                alt="accept request"
                onClick={() => {
                  acceptRequest(props.request.id);
                }}
              />
            </button>
            <button
              onClick={() => {
                rejectRequest(props.request.id);
              }}
            >
              <img src="./cancel-icon.svg" alt="reject request" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

ReceivedRequestCard.propTypes = {
  request: PropTypes.object,
};
