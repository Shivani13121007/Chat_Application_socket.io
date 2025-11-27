const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve client
app.use(express.static(path.join(__dirname, "../client")));

// keep track of online users: socket.id -> username
const users = new Map();

function broadcastUserList() {
  const userList = Array.from(users.entries()).map(([id, username]) => ({
    id,
    username,
  }));
  io.emit("userList", userList);
}

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // store username after user sends it
  socket.on("setUsername", (username) => {
    socket.username = username;
    users.set(socket.id, username);
    console.log(`🟢 ${username} joined`);

    // notify others (not this user)
    socket.broadcast.emit("notification", `${username} joined the chat`);

    // send updated online users list to everyone
    broadcastUserList();
  });

  // chat message
  socket.on("chatMessage", (text) => {
    if (!socket.username) return; // safety

    io.emit("chatMessage", {
      text,
      username: socket.username,
      time: new Date().toISOString(),
    });
  });

  // 📝 typing indicator
  socket.on("typing", () => {
    if (!socket.username) return;
    // tell everyone except the typer
    socket.broadcast.emit("typing", {
      username: socket.username,
    });
  });

  socket.on("stopTyping", () => {
    if (!socket.username) return;
    socket.broadcast.emit("stopTyping", {
      username: socket.username,
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      console.log(`🔴 ${socket.username} left`);
      users.delete(socket.id);

      // notify others
      socket.broadcast.emit("notification", `${socket.username} left the chat`);
      // update user list
      broadcastUserList();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
