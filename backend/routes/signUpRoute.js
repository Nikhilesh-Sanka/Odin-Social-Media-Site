const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");
const { body, validationResult } = require("express-validator");

const validateInputs = [
  body("username").custom(async (value) => {
    const user = await queries.getLocalUserByName(value);
    if (!user) {
      return true;
    }
    throw new Error("username already exists");
  }),
];

router.post("/", validateInputs, async (req, res, next) => {
  try {
    const errors = validationResult(req).errors;
    if (errors.length === 0) {
      const token = await queries.createLocalUser(
        req.body["username"],
        req.body["password"],
        req.body["firstName"],
        req.body["lastName"]
      );
      res.status(201).send({ token });
    } else {
      res.sendStatus(409);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
