const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

// getting all the followers of the user
router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const followers = await queries.getFollowers(userId);
    res.status(200).send(followers);
  } catch (err) {
    next(err);
  }
});

// accepting a follower
router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const requestId = req.body["requestId"];
    await queries.acceptFollowers(userId, requestId);
    await queries.updateRequestStatus(requestId, true);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// removing a follower
router.delete("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const followerId = req.body["followerId"];
    await queries.removeFollower(userId, followerId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// following a follower back
router.post("/follow", async (req, res, next) => {
  try {
    const userId = req.userId;
    const followerId = req.body["followerId"];
    await queries.followFollower(userId, followerId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
