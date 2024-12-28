const board = document.getElementById("chessboard");
const debugBox = document.getElementById("debug");

// Chess pieces Unicode symbols
const pieces = {
  white: {
    king: "\u2654",
    queen: "\u2655",
    rook: "\u2656",
    bishop: "\u2657",
    knight: "\u2658",
    pawn: "\u2659",
  },
  black: {
    king: "\u265A",
    queen: "\u265B",
    rook: "\u265C",
    bishop: "\u265D",
    knight: "\u265E",
    pawn: "\u265F",
  },
};

// Create chess board
function createChessboard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 == 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      board.appendChild(square);
    }
  }
}

// Place initial pieces
function placePieces() {
  const initialSetup = [
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
    Array(8).fill("pawn"),
    ...Array(4).fill(Array(8).fill(null)),
    Array(8).fill("pawn"),
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
  ];

  initialSetup.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (piece) {
        const square = board.children[rowIndex * 8 + colIndex];
        const color = rowIndex < 2 ? "black" : "white";
        square.textContent = pieces[color][piece];
      }
    });
  });
}

// Initialize the game
createChessboard();
placePieces();

//debug
const squares = document.getElementsByClassName("square");
function debug() {
  debugBox.innerHTML = initialSetup;
}
// debug();
