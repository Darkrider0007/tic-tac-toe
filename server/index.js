const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "..", "public")));

// Handle client connections
const players = {};
let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  if (waitingPlayer) {
    // Pair the players
    const room = socket.id + "#" + waitingPlayer.id;
    socket.join(room);
    waitingPlayer.join(room);

    players[socket.id] = { symbol: "O", room };
    players[waitingPlayer.id] = { symbol: "X", room };

    io.to(room).emit("startGame", {
      symbolX: waitingPlayer.id,
      symbolO: socket.id,
    });

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit("waiting", "Waiting for an opponent...");
  }

  socket.on("makeMove", ({ index }) => {
    const player = players[socket.id];
    if (player) {
      io.to(player.room).emit("moveMade", {
        index,
        symbol: player.symbol,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const player = players[socket.id];
    if (player) {
      io.to(player.room).emit("opponentLeft");
    }
    delete players[socket.id];
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
