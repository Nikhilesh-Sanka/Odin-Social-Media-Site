const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const users = await queries.getUsers(userId);
    res.status(200).send(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
