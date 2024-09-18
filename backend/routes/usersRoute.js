const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const searchQuery = req.query["searchQuery"];
    const users = await queries.getUsers(userId, searchQuery);
    res.status(200).send(users);
  } catch (err) {
    next(err);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const userId = req.query["userId"];
    const profile = await queries.getUserProfile(userId);
    if (profile) {
      res.status(200).send(profile);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
