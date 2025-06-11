const socket = io();

const board = document.getElementById("board");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

let mySymbol = "";
let isMyTurn = false;

// Winning combinations
const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // columns
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

// Create 9 cells on the board
for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  board.appendChild(cell);

  cell.addEventListener("click", () => {
    if (isMyTurn && !cell.textContent) {
      cell.textContent = mySymbol;
      socket.emit("makeMove", { index: i });
      isMyTurn = false;
      statusText.textContent = "Waiting for opponent's move...";
    }
  });
}

// Check if someone won
function checkWinner() {
  const cells = [...document.querySelectorAll(".cell")];
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    if (
      cells[a].textContent &&
      cells[a].textContent === cells[b].textContent &&
      cells[a].textContent === cells[c].textContent
    ) {
      return cells[a].textContent;
    }
  }
  return null;
}

// Check if it's a draw
function checkDraw() {
  const cells = [...document.querySelectorAll(".cell")];
  return cells.every((cell) => cell.textContent);
}

// End the game and show message
function endGame(message) {
  statusText.textContent = message;
  isMyTurn = false;
  restartBtn.style.display = "inline-block";
}

// Socket event: waiting for opponent
socket.on("waiting", (msg) => {
  statusText.textContent = msg;
});

// Socket event: game starts
socket.on("startGame", ({ symbolX, symbolO }) => {
  const myId = socket.id;
  mySymbol = myId === symbolX ? "X" : "O";
  isMyTurn = mySymbol === "X";
  statusText.textContent = isMyTurn ? "Your turn (X)" : "Opponent's turn (X)";
});

// Socket event: opponent made a move
socket.on("moveMade", ({ index, symbol }) => {
  const cell = board.querySelector(`[data-index="${index}"]`);
  if (!cell.textContent) {
    cell.textContent = symbol;
  }

  const winner = checkWinner();
  if (winner) return endGame(winner === mySymbol ? "You win!" : "You lose!");
  if (checkDraw()) return endGame("It's a draw!");

  if (symbol !== mySymbol) {
    isMyTurn = true;
    statusText.textContent = `Your turn (${mySymbol})`;
  }
});

// Socket event: opponent left
socket.on("opponentLeft", () => {
  endGame("Your opponent left the game.");
});

// Restart button clicked
restartBtn.addEventListener("click", () => {
  document.querySelectorAll(".cell").forEach((cell) => (cell.textContent = ""));
  restartBtn.style.display = "none";
  socket.emit("requestRestart");
});

// Socket event: restart the game
socket.on("restartGame", () => {
  document.querySelectorAll(".cell").forEach((cell) => (cell.textContent = ""));
  restartBtn.style.display = "none";
  isMyTurn = mySymbol === "X";
  statusText.textContent = isMyTurn
    ? `Your turn (${mySymbol})`
    : `Opponent's turn (${mySymbol})`;
});
