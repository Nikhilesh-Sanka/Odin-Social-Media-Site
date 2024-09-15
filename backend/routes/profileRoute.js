const { Router } = require("express");
const router = Router();
const queries = require("../queries/queries.js");
const { createClient } = require("@supabase/supabase-js");
const { decode } = require("base64-arraybuffer");

// configuring the multer middleware
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

require("dotenv").config();

// getting the profile details
router.get("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const profile = await queries.getProfile(userId);
    res.status(200).send({
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      ...profile.profile,
    });
  } catch (err) {
    next(err);
  }
});

// taking care of editing the string fields of the profile except username
router.put("/", async (req, res, next) => {
  try {
    await queries.editProfile(
      req.userId,
      req.body["firstName"],
      req.body["lastName"],
      req.body["bio"]
    );
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// updating profile images
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post("/image", upload.single("profile-img"), async (req, res, next) => {
  try {
    const file = req.file;
    const fileBase64 = decode(file.buffer.toString("base64"));
    const { data, error } = await supabase.storage
      .from("Profile-Pics")
      .upload(`${req.userId}/${file.originalname}`, fileBase64);
    if (error) {
      throw new Error("file upload error");
    } else {
      const { data: image } = supabase.storage
        .from("Profile-Pics")
        .getPublicUrl(data.path);
      const imageUrl = image.publicUrl;
      await queries.editProfileImage(req.userId, imageUrl);
      res.sendStatus(201);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
