const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const postId = req.query["postId"];
    const comments = await queries.getComments(postId);
    res.status(200).send(comments);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const postId = req.query["postId"];
    const userId = req.userId;
    const comment = req.body["comment"];
    await queries.createComment(userId, postId, comment);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
