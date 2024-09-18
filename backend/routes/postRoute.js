const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");
const { createClient } = require("@supabase/supabase-js");
const { decode } = require("base64-arraybuffer");

require("dotenv").config();

//configuring multer
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// getting the posts of the user
router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPosts = await queries.getUserPosts(userId);
    res.status(200).send(userPosts);
  } catch (err) {
    next(err);
  }
});

// getting all posts
router.get("/all", async (req, res, next) => {
  try {
    const userId = req.userId;
    const allPosts = await queries.getAllPosts(userId);
    res.status(200).send(allPosts);
  } catch (err) {
    next(err);
  }
});

//creating a post
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/", upload.single("post-img"), async (req, res, next) => {
  try {
    const userId = req.userId;
    const file = req.file;
    const content = req.body["content"];
    const visibilityStatus = req.body["visibilityStatus"]
      ? "all"
      : "followers-following";
    if (file) {
      const fileBase64 = decode(file.buffer.toString("base64"));
      const { data, error } = await supabase.storage
        .from("Posts-Pics")
        .upload(
          `${req.userId}/${new Date().getTime()}${file.originalname}`,
          fileBase64
        );
      if (error) {
        next(error);
      } else {
        const { data: image } = supabase.storage
          .from("Posts-Pics")
          .getPublicUrl(data.path);
        const imageUrl = image.publicUrl;
        await queries.createPost(userId, content, imageUrl, visibilityStatus);
        res.sendStatus(201);
      }
    } else {
      await queries.createPost(userId, content, null, visibilityStatus);
      res.sendStatus(201);
    }
  } catch (err) {
    next(err);
  }
});

// liking a post
router.put("/like", async (req, res, next) => {
  try {
    const userId = req.userId;
    const postId = req.query["postId"];
    await queries.likePost(userId, postId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

//disliking a post
router.put("/dislike", async (req, res, next) => {
  try {
    const userId = req.userId;
    const postId = req.query.postId;
    await queries.dislikePost(userId, postId);
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
