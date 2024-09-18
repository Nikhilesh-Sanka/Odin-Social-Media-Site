const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");
const jsw = require("jsonwebtoken");

require("dotenv").config();

// handling the login of local users
router.post("/local", async (req, res, next) => {
  try {
    const username = req.body["username"];
    const user = await queries.getLocalUserByName(username);
    if (!user) {
      return res.sendStatus(404);
    } else {
      if (user.password !== req.body["password"]) {
        return res.sendStatus(403);
      } else {
        const token = jsw.sign({ userId: user.id }, process.env.JWT_SECRET);
        return res.status(201).send({ token: `Bearer ${token}` });
      }
    }
  } catch (err) {
    next(err);
  }
});

//handling the login of google users
router.post("/google", async (req, res, next) => {
  try {
    const token = await queries.getUserByGoogleId(req.body["googleId"]);
    if (token) {
      return res.status(201).send({ token });
    } else {
      const token = await queries.createGoogleUser(
        req.body["username"],
        req.body["firstName"],
        req.body["lastName"],
        req.body["googleId"],
        req.body["profileImg"]
      );
      res.status(201).send({ token });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
