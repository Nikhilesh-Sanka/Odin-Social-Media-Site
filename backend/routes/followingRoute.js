const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

// get all the following users
router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const following = await queries.getFollowing(userId);
    res.status(200).send(following);
  } catch (err) {
    next(err);
  }
});

// un-following a user
router.delete("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const followingUserId = req.body["followingUserId"];
    await queries.removeFollowing(userId, followingUserId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
