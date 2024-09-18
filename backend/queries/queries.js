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
    const token = jsw.sign({ userId: result.id }, process.env.JWT_SECRET);
    return `Bearer ${token}`;
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
  const token = jsw.sign({ userId: user.id }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
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
  return `Bearer ${token}`;
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
const getUsers = async (userId, searchQuery) => {
  const result = await prisma.user.findMany({
    where: {
      NOT: {
        id: userId,
      },
      username: {
        contains: searchQuery,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
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
  return result;
};

const getUserProfile = async (userId) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          bio: true,
          image: true,
        },
      },
    },
  });
  return result;
};

// requests related queries
const getRequests = async (userId) => {
  const sentRequests = await prisma.request.findMany({
    where: {
      sentUserId: userId,
    },
    select: {
      id: true,
      receivedUser: {
        select: {
          id: true,
          username: true,
          profile: true,
        },
      },
      requestStatus: true,
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
    select: {
      id: true,
      sentUser: {
        select: {
          id: true,
          username: true,
          profile: true,
        },
      },
    },
  });
  return { sentRequests, receivedRequests, clientId: userId };
};

const createRequest = async (userId, friendId) => {
  const result = await prisma.request.findMany({
    where: {
      sentUserId: userId,
      receivedUserId: friendId,
    },
  });
  if (result.length !== 0) {
    await prisma.request.updateMany({
      where: {
        sentUserId: userId,
        receivedUserId: friendId,
      },
      data: {
        requestStatus: "pending",
      },
    });
  } else {
    await prisma.request.create({
      data: {
        sentUserId: userId,
        receivedUserId: friendId,
      },
    });
  }
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
          id: true,
          username: true,
          profile: true,
          followers: {
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
  await prisma.request.updateMany({
    where: {
      sentUserId: followerId,
      receivedUserId: userId,
    },
    data: {
      requestStatus: "rejected",
    },
  });
};

const followFollower = async (userId, followerId) => {
  const result = await prisma.user.update({
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
  if (result) {
    await prisma.request.deleteMany({
      where: {
        sentUserId: userId,
        receivedUserId: followerId,
      },
    });
  }
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
          id: true,
          username: true,
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
  await prisma.request.deleteMany({
    where: {
      sentUserId: userId,
      receivedUserId: followingUserId,
    },
  });
};

// post related queries
const getUserPosts = async (userId) => {
  const result = await prisma.post.findMany({
    where: {
      authorId: userId,
    },
    select: {
      id: true,
      author: {
        select: {
          username: true,
          profile: {
            select: {
              id: true,
              image: true,
            },
          },
        },
      },
      image: true,
      content: true,
      likes: true,
      likedBy: {
        where: {
          id: userId,
        },
      },
      createdAt: true,
      visibleTo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { posts: result, clientId: userId };
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
                  author: {
                    followers: {
                      some: {
                        id: userId,
                      },
                    },
                  },
                },
                {
                  author: {
                    following: {
                      some: {
                        id: userId,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          author: {
            id: userId,
          },
        },
      ],
    },
    select: {
      id: true,
      author: {
        select: {
          id: true,
          username: true,
          profile: true,
          followers: {
            where: {
              id: userId,
            },
            select: {
              id: true,
            },
          },
          following: {
            where: {
              id: userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
      createdAt: true,
      content: true,
      likedBy: {
        where: {
          id: userId,
        },
      },
      image: true,
      likes: true,
      createdAt: true,
      visibleTo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return { posts: result, clientId: userId };
};

const createPost = async (userId, content, image, visibilityStatus) => {
  if (image) {
    await prisma.post.create({
      data: {
        authorId: userId,
        content: content,
        image: image,
        visibleTo: visibilityStatus,
      },
    });
  } else {
    await prisma.post.create({
      data: {
        authorId: userId,
        content: content,
        visibleTo: visibilityStatus,
      },
    });
  }
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
      id: true,
      author: {
        select: {
          id: true,
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
  getUserProfile,
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
  createPost,
  likePost,
  dislikePost,
  getComments,
  createComment,
};
