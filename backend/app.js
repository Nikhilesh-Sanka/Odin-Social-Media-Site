const express = require("express");
const app = express();
const cors = require("cors");
const jsw = require("jsonwebtoken");

require("dotenv").config();

// applying the necessary middlewares to the requests
app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// testing the database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.findMany({});
  console.log(result);
}
// main();

// importing the routers
const signUpRouter = require("./routes/signUpRoute.js");
const loginRouter = require("./routes/loginRoute.js");
const profileRouter = require("./routes/profileRoute.js");
const requestRouter = require("./routes/requestRoute.js");
const followersRouter = require("./routes/followersRoute.js");
const followingRouter = require("./routes/followingRoute.js");
const usersRouter = require("./routes/usersRoute.js");
const postRouter = require("./routes/postRoute.js");
const commentRouter = require("./routes/commentRoute.js");

// login and sign up routes
app.use("/sign-up", signUpRouter);
app.use("/login", loginRouter);

// authenticating user routes
app.use("/user", (req, res, next) => {
  const headerBearer = req.headers["auth"];
  if (headerBearer) {
    const token = headerBearer.split(" ")[1];
    jsw.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        return res.sendStatus(403);
      } else {
        req.userId = payload.userId;
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
});

// user api routes
app.use("/user/profile", profileRouter);
app.use("/user/request", requestRouter);
app.use("/user/followers", followersRouter);
app.use("/user/following", followingRouter);
app.use("/user/users", usersRouter);
app.use("/user/posts", postRouter);
app.use("/user/comment", commentRouter);

// error handling controller
app.use((err, req, res, next) => {
  console.log(err);
  res.sendStatus(500);
});

app.listen(process.env.PORT, () => {
  console.log("server started in port ", process.env.PORT);
});
