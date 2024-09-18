const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");

// getting all the requests of the user
router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const requests = await queries.getRequests(userId);
    res.status(200).send(requests);
  } catch (err) {
    next(err);
  }
});

// creating a request
router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const friendId = req.body["friendId"];
    await queries.createRequest(userId, friendId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// changing the status of a request
router.put("/", async (req, res, next) => {
  try {
    const requestId = req.body["requestId"];
    const newStatus = req.body["requestStatus"];
    await queries.updateRequestStatus(requestId, newStatus);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// deleting the request
router.delete("/", async (req, res, next) => {
  try {
    const requestId = req.body["requestId"];
    const userId = req.userId;
    await queries.deleteRequest(requestId, userId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// deleting request of a particular category
router.delete("/:category", async (req, res, next) => {
  try {
    const category = req.params["category"];
    const userId = req.userId;
    await queries.deleteRequestOfCategory(category, userId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
