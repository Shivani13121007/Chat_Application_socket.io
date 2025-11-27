const socket = io("http://localhost:3000");

const username = prompt("Enter your name:");
socket.emit("setUsername", username);
document.getElementById("usernameDisplay").textContent = username;

const messagesEl = document.getElementById("messages");
const form = document.getElementById("messageForm");
const input = document.getElementById("messageInput");

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
});
