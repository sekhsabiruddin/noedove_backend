// ./server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const dbConnect = require("./db/db");
const Message = require("./model/message");
const User = require("./controller/userController");
dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "https://neodove-frontend.vercel.app",
    credentials: true,
  })
);
// ======Database connection=====
dbConnect();

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

//========================== WebSocket server======================
wss.on("connection", async function connection(ws) {
  ws.on("message", async function incoming(data) {
    const messageData = JSON.parse(data);
    try {
      const currentTime = getCurrentTime();
      //========================It will save in DB=============================
      const newMessage = new Message({
        content: messageData.content,
        userId: messageData.userId,
        username: messageData.username,
        time: currentTime,
      });

      await newMessage.save();

      // ======================Prepare message with current time and username==================
      const broadcastData = JSON.stringify({
        content: messageData.content,
        username: messageData.username,
        userId: messageData.userId,
        time: currentTime,
      });

      // =======================Broadcast message to all clients==========================
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastData);
        }
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });
});

app.use("/api/user", User);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
