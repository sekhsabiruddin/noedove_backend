const express = require("express");
const router = express.Router();
const User = require("../model/user");
const path = require("path");
const jwt = require("jsonwebtoken");
const isAuthenticatedUser = require("../middleware/auth");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Message = require("../model/message");

//=======================Create User Start============================
router.post(
  "/create-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { username, password, email } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const newUser = new User({
        username,
        password,
        email,
      });
      await newUser.save();
      res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    } catch (error) {
      next(new ErrorHander(error.message, 500));
    }
  })
);
//=======================Create User End===============================
//=======================LogIn User Start==============================
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
      }

      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
      }

      let token;
      if (user.role !== "admin") {
        // Generate JWT token for regular user
        token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1d",
          }
        );

        res.cookie("token", token, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
      } else {
        // Generate JWT token for admin
        token = jwt.sign(
          {
            userId: user._id,
            email: user.email,
          },
          process.env.ADMIN_JWT_SECRET, // Ensure you have ADMIN_JWT_SECRET in your environment variables
          {
            expiresIn: "1d",
          }
        );

        res.cookie("AdminToken", token, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
      }

      res.status(200).json({ success: true, token, role: user.role });
    } catch (error) {
      next(new ErrorHander(error.message, 500));
    }
  })
);

//=======================LogIn User End==============================
//=======================Get User Start===============================
router.get(
  "/getuser",
  isAuthenticatedUser,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(400).json({ message: "User doesn't exist" });
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(new ErrorHander(error.message, 500));
    }
  })
);

//=========================Get previous message =================
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return formattedTime;
};

// =====================get previous messages================
router.get("/prev-messages", async (req, res, next) => {
  try {
    const messages = await Message.find(
      {},
      {
        userId: 1,
        username: 1,
        content: 1,
        timestamp: 1,
      }
    ).sort({ timestamp: 1 });

    // Format timestamp and add formatted time to each message
    const formattedMessages = messages.map((message) => ({
      ...message._doc,
      time: formatTimestamp(message.timestamp),
    }));

    res.status(200).json({
      messages: formattedMessages,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
