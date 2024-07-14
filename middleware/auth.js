const jwt = require("jsonwebtoken");
const User = require("../model/user");

const isAuthenticatedUser = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Please Login to access this resource" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.userId);

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = isAuthenticatedUser;
