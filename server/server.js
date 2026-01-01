require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const connectDatabase = require("./configs/database");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(
  cors({
    origin: "https://chatsup12.netlify.app/",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false },
  })
);

app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/match", require("./routes/match.routes"));

const io = new Server(server, {
  cors: {
    origin: "https://chatsup12.netlify.app/",
    credentials: true,
  },
});

// Matchmaking pool (leave your existing findMatch code)
let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("joinPool", (userData) => {
    console.log("🎯 joinPool:", userData);

    // Remove if already in waiting list (avoid duplicates)
    waitingUsers = waitingUsers.filter(u => u.id !== userData.id && u.socketId !== socket.id);

    const match = findMatch(userData);

    if (match) {
      const roomId = `room_${userData.id}_${match.id}`;
      const matchSocket = io.sockets.sockets.get(match.socketId);

      if (!matchSocket) {
        // Cleanup if match socket is gone
        waitingUsers = waitingUsers.filter(u => u.id !== match.id);
        waitingUsers.push({ ...userData, socketId: socket.id });
        return;
      }

      socket.join(roomId);
      matchSocket.join(roomId);

      console.log(`✅ Both joined room: ${roomId}`);

      io.to(roomId).emit("matched", { roomId, users: [userData, match] });

      waitingUsers = waitingUsers.filter(
        (u) => u.id !== userData.id && u.id !== match.id
      );
    } else {
      waitingUsers.push({ ...userData, socketId: socket.id });
      console.log("🕓 Added to waiting pool:", userData.id);
    }
  });

  socket.on("sendMessage", ({ roomId, message }) => {
    console.log(`💬 [${roomId}]`, `${socket.id}`, message);
    socket.to(roomId).emit("receiveMessage", {
      ...message,
      senderId: socket.id,
    });
  });

  socket.on("leaveRoom", ({ roomId }) => {
    console.log(`👋 ${socket.id} left room ${roomId}`);
    socket.to(roomId).emit("partnerLeft");
    socket.leave(roomId);
  });

  socket.on("typing", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("typing", isTyping);
  });

  // 📹 Video Call Signaling
  socket.on("callUser", ({ userToCall, signalData, fromId, roomId }) => {
    // Broadcast to the room (since it is 1-on-1, this reaches the partner)
    socket.to(roomId).emit("callUser", { signal: signalData, from: fromId });
  });

  socket.on("answerCall", (data) => {
    // data: { signal: signalData, to: callerId, roomId }
    socket.to(data.roomId).emit("callAccepted", data.signal);
  });

  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter((u) => u.socketId !== socket.id);
    console.log("❌ Disconnected:", socket.id);
  });
});

function findMatch(newUser) {
  // 1. Try to find a user who matches preferences
  //    - Target must NOT be the same user
  //    - Target's gender should match newUser's preferredGender (if specific)
  //    - newUser's gender should match Target's preferredGender (if specific) (Optional strictness)
  //    - Shared interests (bonus)

  // Score-based matching
  // 1. Tag Overlap (High Priority) -> +50 per tag
  // 2. Gender Match (Medium Priority) -> +100 if mutual requirements met
  // 3. Random Noise -> +1-10 to separate ties

  let bestMatch = null;
  let highestScore = -1;

  waitingUsers.forEach((user) => {
    if (user.id === newUser.id) return;

    let score = 0;

    // Gender Logic
    // Does 'user' meet 'newUser' preference?
    const userFitsNewUser = newUser.preferredGender === 'Any' || newUser.preferredGender === user.gender;
    // Does 'newUser' meet 'user' preference?
    const newUserFitsUser = user.preferredGender === 'Any' || user.preferredGender === newUser.gender;

    if (userFitsNewUser && newUserFitsUser) {
      score += 100;
    } else {
      // If gender mismatch, we can still match if tags are STRONG, but usually we filter out?
      // User said "users with similar interest is at the pool..but not matching and let them chat"
      // This implies INTERESTS should override gender restrictions or be sufficient.
      // So we don't disqualify, just don't give the 100 pts.
    }

    // Tag Logic
    const commonTags = user.tags.filter(tag => newUser.tags.includes(tag));
    if (commonTags.length > 0) {
      score += (commonTags.length * 50);
    }

    // If no score, they have nothing in common (no tags, no gender match) -> Score 0.

    // Select best
    if (score > highestScore && score > 0) {
      highestScore = score;
      bestMatch = user;
    }
  });

  return bestMatch;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDatabase();
});
