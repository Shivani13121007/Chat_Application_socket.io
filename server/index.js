const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve client
app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // store username after user sends it
  socket.on("setUsername", (username) => {
    socket.username = username;
    console.log(`🟢 ${username} joined`);
    // io.emit("notification", `${username} joined the chat`); // Everyone (including sender)
    socket.broadcast.emit("notification", `${username} joined the chat`); //Everyone except sender
  });

  // chat message
  socket.on("chatMessage", (text) => {
    io.emit("chatMessage", {
      text,
      username: socket.username,
      time: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("notification", `${socket.username} left the chat`);
    }
  });
});

server.listen(3000, () => console.log("🚀 Server running on port 3000"));
