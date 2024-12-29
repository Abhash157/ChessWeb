const board = document.getElementById("chessboard");
const debugBox = document.getElementById("debug");
let selectedSquare = null;
let turn = 1;
let invalidOpacity = 0;

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

const whitePieces = [
  pieces.white.king,
  pieces.white.queen,
  pieces.white.rook,
  pieces.white.bishop,
  pieces.white.knight,
  pieces.white.pawn,
];
const blackPieces = [
  pieces.black.king,
  pieces.black.queen,
  pieces.black.rook,
  pieces.black.bishop,
  pieces.black.knight,
  pieces.black.pawn,
];

// Create chess board
function createChessboard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 == 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("click", () => squareClick(square));
      board.appendChild(square);
    }
  }
}

function placePieces() {
  const initialSetup = [
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
    Array(8).fill("pawn"),
    ...Array(4).fill(Array(8).fill(null)),
    Array(8).fill("pawn"),
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
  ];

  initialSetup.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      if (col) {
        const squareMap =
          document.getElementsByClassName("square")[rowIndex * 8 + colIndex];
        const color = rowIndex < 4 ? "black" : "white";
        squareMap.textContent = pieces[color][col];
      }
    });
  });
}

function squareClick(square) {
  if (turn == 0) {
    moveWhite(square);
  } else {
    moveBlack(square);
  }
}

function moveWhite(square) {
  sqRow = parseInt(square.dataset.row);
  sqCol = parseInt(square.dataset.col);
  if (selectedSquare) {
    // Move piece to new square if it's not the same square
    if (square !== selectedSquare) {
      if (
        square.classList.contains("movelight") ||
        square.classList.contains("takelight")
      ) {
        square.textContent = selectedSquare.textContent;
        selectedSquare.textContent = "";
        turn = 1;
      }
    }
    selectedSquare.classList.remove("highlight");
    for (let i = 0; i < 64; i++) {
      squares[i].classList.remove("movelight");
      squares[i].classList.remove("takelight");
    }
    selectedSquare = null;
  } else if (square.textContent == pieces.white.pawn) {
    //Move for white pawn
    const squares = document.getElementsByClassName("square");
    selectedSquare = square;
    square.classList.add("highlight");

    // Show pawn moves
    // 2 moves in first move
    if (sqRow == 6) {
      squares[(sqRow - 2) * 8 + sqCol].classList.add("movelight");
    }
    // pawn normal move
    if (squares[(sqRow - 1) * 8 + sqCol].innerText == "") {
      squares[(sqRow - 1) * 8 + sqCol].classList.add("movelight");
    }
    // pawn diagonal move
    if (
      blackPieces.indexOf(squares[(sqRow - 1) * 8 + (sqCol - 1)].innerHTML) !=
        -1 &&
      sqCol != 0 //bug fix on left end of board
    ) {
      squares[(sqRow - 1) * 8 + (sqCol - 1)].classList.add("takelight");
    }
    if (
      blackPieces.indexOf(squares[(sqRow - 1) * 8 + (sqCol + 1)].innerHTML) !=
        -1 &&
      sqCol != 7 //bug fix on right end of board
    ) {
      squares[(sqRow - 1) * 8 + (sqCol + 1)].classList.add("takelight");
    }
  } else if (square.textContent == pieces.white.rook) {
    selectedSquare = square;

    // Rook Column moves
    for (let i = sqRow - 1; i >= 0; i--) {
      if (blackPieces.indexOf(squares[i * 8 + sqCol].textContent) != -1) {
        squares[i * 8 + sqCol].classList.add("takelight");
      }
      if (squares[i * 8 + sqCol].textContent != "") {
        break;
      }
      squares[i * 8 + sqCol].classList.add("movelight");
    }
    for (let i = sqRow + 1; i <= 7; i++) {
      if (blackPieces.indexOf(squares[i * 8 + sqCol].textContent) != -1) {
        squares[i * 8 + sqCol].classList.add("takelight");
      }
      if (squares[i * 8 + sqCol].textContent != "") {
        break;
      }
      squares[i * 8 + sqCol].classList.add("movelight");
    }

    // Rook Row moves
    for (let i = sqCol + 1; i <= 7; i++) {
      if (blackPieces.indexOf(squares[sqRow * 8 + i].textContent) != -1) {
        squares[sqRow * 8 + i].classList.add("takelight");
      }
      if (squares[sqRow * 8 + i].textContent != "") {
        break;
      }
      squares[sqRow * 8 + i].classList.add("movelight");
    }
    for (let i = sqCol - 1; i >= 0; i--) {
      if (blackPieces.indexOf(squares[sqRow * 8 + i].textContent) != -1) {
        squares[sqRow * 8 + i].classList.add("takelight");
      }
      if (squares[sqRow * 8 + i].textContent != "") {
        break;
      }
      squares[sqRow * 8 + i].classList.add("movelight");
    }
  } else if (blackPieces.indexOf(square.textContent) != -1) {
    // Highlights invalid move
    square.classList.add("invalidSquare");
    setTimeout(() => {
      square.classList.remove("invalidSquare");
    }, 150);
  }
}

function moveBlack(square) {
  sqRow = parseInt(square.dataset.row);
  sqCol = parseInt(square.dataset.col);
  if (selectedSquare) {
    // Move piece to new square if it's not the same square
    if (square !== selectedSquare) {
      if (
        square.classList.contains("movelight") ||
        square.classList.contains("takelight")
      ) {
        square.textContent = selectedSquare.textContent;
        selectedSquare.textContent = "";
        turn = 1;
      }
    }
    selectedSquare.classList.remove("highlight");
    for (let i = 0; i < 64; i++) {
      squares[i].classList.remove("movelight");
      squares[i].classList.remove("takelight");
    }
    selectedSquare = null;
  } else if (square.textContent == pieces.black.pawn) {
    //Move for black pawn
    const squares = document.getElementsByClassName("square");
    selectedSquare = square;
    square.classList.add("highlight");

    // Show pawn moves
    // 2 moves in first move
    if (sqRow == 1) {
      squares[(sqRow + 2) * 8 + sqCol].classList.add("movelight");
    }
    // pawn normal move
    if (squares[(sqRow + 1) * 8 + sqCol].innerText == "") {
      squares[(sqRow + 1) * 8 + sqCol].classList.add("movelight");
    }
    // pawn diagonal move
    if (
      whitePieces.indexOf(squares[(sqRow + 1) * 8 + (sqCol - 1)].innerHTML) !=
        -1 &&
      sqCol != 0 //bug fix on left end of board
    ) {
      squares[(sqRow + 1) * 8 + (sqCol - 1)].classList.add("takelight");
    }
    if (
      whitePieces.indexOf(squares[(sqRow + 1) * 8 + (sqCol + 1)].innerHTML) !=
        -1 &&
      sqCol != 7 //bug fix on right end of board
    ) {
      squares[(sqRow + 1) * 8 + (sqCol + 1)].classList.add("takelight");
    }
  } else if (square.textContent == pieces.black.rook) {
    selectedSquare = square;
    // Rook Column moves
    for (let i = sqRow - 1; i >= 0; i--) {
      if (whitePieces.indexOf(squares[i * 8 + sqCol].textContent) != -1) {
        squares[i * 8 + sqCol].classList.add("takelight");
      }
      if (squares[i * 8 + sqCol].textContent != "") {
        break;
      }
      squares[i * 8 + sqCol].classList.add("movelight");
    }
    for (let i = sqRow + 1; i <= 7; i++) {
      if (whitePieces.indexOf(squares[i * 8 + sqCol].textContent) != -1) {
        squares[i * 8 + sqCol].classList.add("takelight");
      }
      if (squares[i * 8 + sqCol].textContent != "") {
        break;
      }
      squares[i * 8 + sqCol].classList.add("movelight");
    }

    // // Rook Row moves
    for (let i = sqCol + 1; i <= 7; i++) {
      if (whitePieces.indexOf(squares[sqRow * 8 + i].textContent) != -1) {
        squares[sqRow * 8 + i].classList.add("takelight");
      }
      if (squares[sqRow * 8 + i].textContent != "") {
        break;
      }
      squares[sqRow * 8 + i].classList.add("movelight");
    }
    for (let i = sqCol - 1; i >= 0; i--) {
      if (whitePieces.indexOf(squares[sqRow * 8 + i].textContent) != -1) {
        squares[sqRow * 8 + i].classList.add("takelight");
      }
      if (squares[sqRow * 8 + i].textContent != "") {
        break;
      }
      squares[sqRow * 8 + i].classList.add("movelight");
    }
  } else if (whitePieces.indexOf(square.textContent) != -1) {
    // Highlights invalid move
    square.classList.add("invalidSquare");
    setTimeout(() => {
      square.classList.remove("invalidSquare");
    }, 150);
  }
}

// Initialize the game
createChessboard();
placePieces();

//debug
const squares = document.getElementsByClassName("square");
function debug(content) {
  debugBox.innerHTML = content;
}
// debug();
