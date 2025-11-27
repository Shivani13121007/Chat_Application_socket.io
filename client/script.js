const socket = io(
  "https://chat-application-socket-io-p3lh.onrender.com",
  {
    transports: ["websocket"],
  }
);

const username = prompt("Enter your name:") || "Anonymous";
socket.emit("setUsername", username);

const usernameDisplay = document.getElementById("usernameDisplay");
const onlineInfo = document.getElementById("onlineInfo");
const messagesEl = document.getElementById("messages");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");
const typingIndicator = document.getElementById("typingIndicator");

usernameDisplay.textContent = username;

// ---------- CHAT MESSAGES ----------

// Receive chat messages
socket.on("chatMessage", (msg) => {
  const li = document.createElement("li");
  li.classList.add("message");
  const self = msg.username === username;
  if (self) li.classList.add("self");

  li.innerHTML = `
    <div class="meta">
      <span>${self ? "You" : msg.username}</span>
      <span>${new Date(msg.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}</span>
    </div>
    <div class="text">${msg.text}</div>
  `;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// Receive join/leave notifications
socket.on("notification", (text) => {
  const li = document.createElement("li");
  li.classList.add("notification");
  li.textContent = text;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.emit("chatMessage", text);
  input.value = "";
  input.focus();

  // stop typing when message sent
  if (isTyping) {
    socket.emit("stopTyping");
    isTyping = false;
    clearTimeout(typingTimeout);
  }
});

// ---------- ONLINE USERS LIST ----------

socket.on("userList", (userList) => {
  const count = userList.length;
  const names = userList.map((u) => u.username);

  onlineInfo.textContent =
    count === 0
      ? "No one online"
      : `${count} online: ${names.join(", ")}`;
});

// ---------- TYPING INDICATOR ----------

let isTyping = false;
let typingTimeout = null;

// other users typing
const currentlyTyping = new Set();

function updateTypingIndicator() {
  if (currentlyTyping.size === 0) {
    typingIndicator.textContent = "";
    return;
  }

  const names = Array.from(currentlyTyping);
  if (names.length === 1) {
    typingIndicator.textContent = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    typingIndicator.textContent = `${names[0]} and ${names[1]} are typing...`;
  } else {
    typingIndicator.textContent = `${names[0]} and ${
      names.length - 1
    } others are typing...`;
  }
}

// when I type
input.addEventListener("input", () => {
  const text = input.value.trim();

  if (text && !isTyping) {
    isTyping = true;
    socket.emit("typing");
  }

  if (!text && isTyping) {
    isTyping = false;
    socket.emit("stopTyping");
    clearTimeout(typingTimeout);
  }

  // if user stops typing for 1.5s, send stopTyping
  clearTimeout(typingTimeout);
  if (text) {
    typingTimeout = setTimeout(() => {
      if (isTyping) {
        isTyping = false;
        socket.emit("stopTyping");
      }
    }, 1500);
  }
});

// when others type
socket.on("typing", ({ username: user }) => {
  if (user === username) return;
  currentlyTyping.add(user);
  updateTypingIndicator();
});

socket.on("stopTyping", ({ username: user }) => {
  if (currentlyTyping.has(user)) {
    currentlyTyping.delete(user);
    updateTypingIndicator();
  }
});
