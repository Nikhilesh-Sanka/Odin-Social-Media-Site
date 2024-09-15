const { PrismaClient } = require("@prisma/client");
const jsw = require("jsonwebtoken");

require("dotenv").config();

const prisma = new PrismaClient();

// getting user by name
const getLocalUserByName = async (username) => {
  const result = await prisma.user.findFirst({
    where: {
      username: username,
      googleId: null,
    },
  });
  return result;
};

// getting google user by id
const getUserByGoogleId = async (googleId) => {
  const result = await prisma.user.findUnique({
    where: {
      googleId: googleId,
    },
  });
  if (!result) {
    return null;
  } else {
    const token = jsw.sign({ userId: result.id }, process.env.JSW_TOKEN);
    return token;
  }
};

// creating a local user (signed up by username and password)
const createLocalUser = async (username, password, firstName, lastName) => {
  const user = await prisma.user.create({
    data: {
      username: username,
      firstName: firstName,
      lastName: lastName,
      password: password,
      profile: {
        create: {
          bio: "",
        },
      },
    },
  });
  const token = jsw.sign({ userId: user.id }, process.env.JSW_SECRET);
  return token;
};

// create a google user (sign up by google oauth)
const createGoogleUser = async (
  username,
  firstName,
  lastName,
  googleId,
  profileImg
) => {
  const user = await prisma.user.create({
    data: {
      username: username,
      firstName: firstName,
      lastName: lastName,
      googleId: googleId,
      profile: {
        create: {
          bio: "",
          image: profileImg,
        },
      },
    },
  });
  const token = jsw.sign({ userId: user.id }, process.env.JSW_SECRET);
  return token;
};

// profile related queries
const getProfile = async (userId) => {
  const profile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      firstName: true,
      lastName: true,
      profile: true,
    },
  });
  return profile;
};

const editProfile = async (userId, firstName, lastName, bio) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      firstName: firstName,
      lastName: lastName,
      profile: {
        update: {
          where: {
            userId: userId,
          },
          data: {
            bio: bio,
          },
        },
      },
    },
  });
};

const editProfileImage = async (userId, image) => {
  await prisma.profile.update({
    where: {
      userId: userId,
    },
    data: {
      image: image,
    },
  });
};

// users related queries
const getUsers = async (userId) => {
  const result = await prisma.user.findMany({
    where: {
      NOT: {
        id: userId,
      },
    },
    select: {
      username: true,
      profile: true,
      followers: {
        where: {
          id: userId,
        },
      },
      receivedRequests: {
        where: {
          sentUserId: userId,
        },
        select: {
          requestStatus: true,
        },
      },
    },
  });
};

// requests related queries
const getRequests = async (userId) => {
  const sentRequests = await prisma.request.findMany({
    where: {
      sentUserId: userId,
    },
  });
  const receivedRequests = await prisma.request.findMany({
    where: {
      receivedUserId: userId,
      NOT: {
        OR: [
          {
            requestStatus: "rejected",
          },
          {
            requestStatus: "accepted",
          },
        ],
      },
    },
  });
  return { sentRequests, receivedRequests };
};

const createRequest = async (userId, friendId) => {
  await prisma.request.upsert({
    data: {
      sentUserId: userId,
      receivedUserId: friendId,
    },
    update: {
      requestStatus: "pending",
    },
    where: {
      sentUserId: userId,
      receivedUserId: friendId,
    },
  });
};

const updateRequestStatus = async (requestId, newRequestStatus) => {
  const requestStatus = newRequestStatus ? "accepted" : "rejected";
  await prisma.request.update({
    where: {
      id: requestId,
    },
    data: {
      requestStatus: requestStatus,
    },
  });
};

const deleteRequest = async (requestId, userId) => {
  await prisma.request.delete({
    where: {
      id: requestId,
      sentUserId: userId,
    },
  });
};

const deleteRequestOfCategory = async (category, userId) => {
  await prisma.request.deleteMany({
    where: {
      requestStatus: category,
      sentUserId: userId,
    },
  });
};

// followers related queries
const getFollowers = async (userId) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      followers: {
        select: {
          username: true,
          profile: true,
          following: {
            where: {
              id: userId,
            },
          },
        },
      },
    },
  });
  return result;
};

const acceptFollowers = async (userId, requestId) => {
  const request = await prisma.request.findUnique({
    where: {
      id: requestId,
    },
  });
  await prisma.user.update({
    where: {
      id: userId,
      NOT: {
        followers: {
          some: {
            id: request.sentUserId,
          },
        },
      },
    },
    data: {
      followers: {
        connect: {
          id: request.sentUserId,
        },
      },
    },
  });
};

const removeFollower = async (userId, followerId) => {
  await prisma.user.update({
    where: {
      id: userId,
      followers: {
        some: {
          id: followerId,
        },
      },
    },
    data: {
      followers: {
        disconnect: { id: followerId },
      },
    },
  });
};

const followFollower = async (userId, followerId) => {
  await prisma.user.update({
    where: {
      id: userId,
      followers: {
        some: {
          id: followerId,
        },
      },
      NOT: {
        following: {
          some: {
            id: followerId,
          },
        },
      },
    },
    data: {
      following: {
        connect: {
          id: followerId,
        },
      },
    },
  });
};

// following related queries
const getFollowing = async (userId) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      following: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          profile: true,
        },
      },
    },
  });
  return result;
};

const removeFollowing = async (userId, followingUserId) => {
  await prisma.user.update({
    where: {
      id: userId,
      following: {
        some: {
          id: followingUserId,
        },
      },
    },
    data: {
      following: {
        disconnect: {
          id: followingUserId,
        },
      },
    },
  });
};

// post related queries
const getUserPosts = async (userId) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      posts: {
        orderBy: {
          createdAt: "desc",
        },
      },
      profile: true,
    },
  });
  return result;
};

const getAllPosts = async (userId) => {
  const result = await prisma.post.findMany({
    where: {
      OR: [
        {
          visibleTo: "all",
        },
        {
          AND: [
            {
              visibleTo: "followers-following",
            },
            {
              OR: [
                {
                  followers: {
                    some: {
                      id: userId,
                    },
                  },
                },
                {
                  following: {
                    some: {
                      is: userId,
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          id: userId,
        },
      ],
    },
    select: {
      author: {
        select: {
          username: true,
          profile: true,
        },
      },
      createdAt: true,
      content: true,
      likedBy: {
        where: {
          id: userId,
        },
      },
      likes: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

const getLikedPosts = async (userId) => {
  const result = await prisma.post.findMany({
    where: {
      likedBy: {
        some: {
          id: userId,
        },
      },
    },
    select: {
      author: {
        select: {
          username: true,
          profile: true,
        },
      },
      createdAt: true,
      content: true,
      likedBy: {
        where: {
          id: userId,
        },
      },
      likes: true,
    },
  });
  return result;
};

const getFollowersPosts = async (userId) => {
  const result = await prisma.post.findMany({
    where: {
      author: {
        following: {
          some: {
            id: userId,
          },
        },
      },
    },
    select: {
      author: {
        select: {
          username: true,
          profile: true,
        },
      },
      createdAt: true,
      content: true,
      likedBy: {
        where: {
          id: userId,
        },
      },
      likes: true,
    },
  });
  return result;
};

const getFollowingPosts = async (userId) => {
  const result = await prisma.post.findMany({
    where: {
      author: {
        followers: {
          some: {
            id: userId,
          },
        },
      },
    },
    select: {
      author: {
        select: {
          username: true,
          profile: true,
        },
      },
      createdAt: true,
      content: true,
      likedBy: {
        where: {
          id: userId,
        },
      },
      likes: true,
    },
  });
  return result;
};

const createPost = async (userId, content, image, visibilityStatus) => {
  await prisma.post.create({
    data: {
      authorId: userId,
      content: content,
      image: image,
      visibleTo: visibilityStatus,
    },
  });
};

const likePost = async (userId, postId) => {
  await prisma.post.update({
    where: {
      id: postId,
      NOT: {
        likedBy: {
          some: {
            id: userId,
          },
        },
      },
    },
    data: {
      likes: {
        increment: 1,
      },
      likedBy: {
        connect: {
          id: userId,
        },
      },
    },
  });
};

const dislikePost = async (userId, postId) => {
  await prisma.post.update({
    where: {
      id: postId,
      likedBy: {
        some: {
          id: userId,
        },
      },
    },
    data: {
      likes: {
        decrement: 1,
      },
      likedBy: {
        disconnect: {
          id: userId,
        },
      },
    },
  });
};

//comment related queries
const getComments = async (postId) => {
  const result = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
    select: {
      author: {
        select: {
          username: true,
          profile: true,
        },
      },
      createdAt: true,
      comment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

const createComment = async (userId, postId, comment) => {
  await prisma.comment.create({
    data: {
      authorId: userId,
      postId: postId,
      comment: comment,
    },
  });
};

module.exports = {
  getLocalUserByName,
  getUserByGoogleId,
  createLocalUser,
  createGoogleUser,
  getProfile,
  editProfile,
  getUsers,
  editProfileImage,
  getRequests,
  createRequest,
  updateRequestStatus,
  deleteRequest,
  deleteRequestOfCategory,
  getFollowers,
  acceptFollowers,
  removeFollower,
  followFollower,
  getFollowing,
  removeFollowing,
  getUserPosts,
  getAllPosts,
  getLikedPosts,
  getFollowersPosts,
  getFollowingPosts,
  createPost,
  likePost,
  dislikePost,
  getComments,
  createComment,
};
