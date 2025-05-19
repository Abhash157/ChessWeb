const board = document.getElementById("chessboard");
const debugBox = document.getElementById("debug");
let selectedSquare = null;
let turn = 0;
let whiteTurn = 1;
let blackTurn = 0;
let invalidOpacity = 0;

// Game state variables
let gameState = {
    whiteCanCastleKingside: true,
    whiteCanCastleQueenside: true,
    blackCanCastleKingside: true,
    blackCanCastleQueenside: true,
    enPassantTarget: null,
    lastPawnDoubleMove: null,
    moveHistory: [],
    capturedPieces: {
        white: [],
        black: []
    }
};

// Chess pieces Unicode symbols
const pieces = {
  white: {
    king: "\u2654",
    queen: "\u2655",
    rook: "\u2656",
    bishop: "\u2657",
    knight: "\u2658",
    pawn: "\u2659",
    checked: false,
    checkSquare: 0,
    kingRow: 7,
    kingCol: 4,
  },
  black: {
    king: "\u265A",
    queen: "\u265B",
    rook: "\u265C",
    bishop: "\u265D",
    knight: "\u265E",
    pawn: "\u265F",
    checked: false,
    checkSquare: 0,
    kingRow: 0,
    kingCol: 4,
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
    analyzeCheckPawnBlack(pieces.black, whitePieces);
    analyzeCheck(pieces.black, pieces.white);
  } else {
    moveBlack(square);
    analyzeCheckPawnWhite(pieces.white, pieces.black);
    analyzeCheck(pieces.white, pieces.black);
  }
}

function analyzeCheckPawnWhite(piece, opp) {
  if (
    piece.kingRow > 0 &&
    ((squares[(piece.kingRow - 1) * 8 + (piece.kingCol - 1)].textContent ==
      opp.pawn &&
      piece.kingCol > 0) ||
      (squares[(piece.kingRow - 1) * 8 + (piece.kingCol + 1)].textContent ==
        opp.pawn &&
        piece.kingCol < 7))
  ) {
    piece.checked = true;
    squares[piece.kingRow * 8 + piece.kingCol].classList.add("dangerlight");
  } else {
    piece.checked = false;
  }
}
function analyzeCheck(piece, opp) {
  row = piece.kingRow;
  col = piece.kingCol;
  piece.checked = false;
  // Rook
  for (i = 1; i <= row; i++) {
    if (squares[(row - i) * 8 + col].textContent == opp.rook) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[(row - i) * 8 + col].textContent != "") {
      break;
    }
  }
  for (i = row + 1; i <= 7; i++) {
    if (squares[i * 8 + col].textContent == opp.rook) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[i * 8 + col].textContent != "") {
      break;
    }
  }
  for (i = 1; i <= col; i++) {
    if (squares[row * 8 + col - i].textContent == opp.rook) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[row * 8 + col - i].textContent != "") {
      break;
    }
  }
  for (i = col + 1; i <= 7; i++) {
    if (squares[row * 8 + i].textContent == opp.rook) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[row * 8 + i].textContent != "") {
      break;
    }
  }

  //Knight
  nRow = [row - 1, row + 1];
  nRow2 = [row - 2, row + 2];
  nCol = [col - 1, col + 1];
  nCol2 = [col - 2, col + 2];

  nRow.forEach((knightRow) => {
    nCol2.forEach((knightCol) => {
      if (
        knightRow * 8 + knightCol < 63 &&
        knightRow * 8 + knightCol > 0 &&
        knightCol <= 7 &&
        knightCol >= 0 &&
        squares[knightRow * 8 + knightCol].textContent == opp.knight
      ) {
        piece.checked = true;
        squares[row * 8 + col].classList.add("dangerlight");
      }
    });
  });
  nRow2.forEach((knightRow) => {
    nCol.forEach((knightCol) => {
      if (
        knightRow * 8 + knightCol <= 63 &&
        knightRow * 8 + knightCol >= 0 &&
        knightCol <= 7 &&
        knightCol >= 0 &&
        squares[knightRow * 8 + knightCol].textContent == opp.knight
      ) {
        piece.checked = true;
        squares[row * 8 + col].classList.add("dangerlight");
      }
    });
  });

  // Bishop
  function bishopCheckCondition() {
    if (bRow >= 0 && bCol >= 0 && bRow < 8 && bCol < 8) {
      if (squares[bRow * 8 + bCol].textContent == opp.bishop) {
        piece.checked = true;
        squares[row * 8 + col].classList.add("dangerlight");
      }
      if (squares[bRow * 8 + bCol].textContent != "") {
        interrupt = true;
      }
    }
  }
  for (let i = 0; i <= 7; i++) {
    bRow = row - i - 1;
    bCol = col - i - 1;
    interrupt = false;
    bishopCheckCondition();
    if (interrupt) break;
  }
  for (let i = 0; i <= 7; i++) {
    bRow = row - i - 1;
    bCol = col + i + 1;

    bishopCheckCondition();
    if (interrupt) break;
  }
  for (let i = 0; i <= 7; i++) {
    bRow = row + i + 1;
    bCol = col - i - 1;

    bishopCheckCondition();
    if (interrupt) break;
  }
  for (let i = 0; i <= 7; i++) {
    bRow = row + i + 1;
    bCol = col + i + 1;

    bishopCheckCondition();
    if (interrupt) break;
  }
}
function moveWhite(square) {
  sqRow = parseInt(square.dataset.row);
  sqCol = parseInt(square.dataset.col);

  // analyzeCheck(pieces.white, blackPieces);

  if (selectedSquare) {
    if (square !== selectedSquare) {
      if (
        square.classList.contains("movelight") ||
        square.classList.contains("takelight")
      ) {
        // Handle castling moves
        if (selectedSquare.textContent === pieces.white.king) {
          const oldCol = parseInt(selectedSquare.dataset.col);
          const newCol = parseInt(square.dataset.col);
          
          // Kingside castling
          if (oldCol === 4 && newCol === 6) {
            squares[7 * 8 + 7].textContent = ""; // Remove rook from old position
            squares[7 * 8 + 5].textContent = pieces.white.rook; // Place rook in new position
          }
          // Queenside castling
          else if (oldCol === 4 && newCol === 2) {
            squares[7 * 8 + 0].textContent = ""; // Remove rook from old position
            squares[7 * 8 + 3].textContent = pieces.white.rook; // Place rook in new position
          }

          // Update king position and castling rights
          pieces.white.kingRow = sqRow;
          pieces.white.kingCol = sqCol;
          gameState.whiteCanCastleKingside = false;
          gameState.whiteCanCastleQueenside = false;
          selectedSquare.classList.remove("dangerlight");
        }

        // Update castling rights if rook moves
        if (selectedSquare.textContent === pieces.white.rook) {
          const oldCol = parseInt(selectedSquare.dataset.col);
          if (oldCol === 0) gameState.whiteCanCastleQueenside = false;
          if (oldCol === 7) gameState.whiteCanCastleKingside = false;
        }

        // Store captured piece if any
        if (square.textContent !== "") {
          gameState.capturedPieces.white.push(square.textContent);
        }

        // Handle en passant capture
        if (selectedSquare.textContent === pieces.white.pawn &&
            gameState.enPassantTarget &&
            sqRow === gameState.enPassantTarget.row &&
            sqCol === gameState.enPassantTarget.col) {
          // Remove the captured pawn
          const capturedPawn = squares[(sqRow + 1) * 8 + sqCol];
          gameState.capturedPieces.white.push(capturedPawn.textContent);
          capturedPawn.textContent = "";
        }

        square.textContent = selectedSquare.textContent;
        selectedSquare.textContent = "";

        // Clear en passant target after each move
        gameState.enPassantTarget = null;

        // Handle pawn promotion
        if (square.textContent === pieces.white.pawn && sqRow === 0) {
          // Automatically promote to queen for now
          square.textContent = pieces.white.queen;
        }

        turn = whiteTurn;

        // Add move to history
        gameState.moveHistory.push({
          piece: square.textContent,
          from: {
            row: parseInt(selectedSquare.dataset.row),
            col: parseInt(selectedSquare.dataset.col)
          },
          to: {
            row: sqRow,
            col: sqCol
          },
          captured: gameState.capturedPieces.white[gameState.capturedPieces.white.length - 1] || null
        });
      }
    }
    selectedSquare.classList.remove("highlight");
    for (let i = 0; i < 64; i++) {
      squares[i].classList.remove("movelight");
      squares[i].classList.remove("takelight");
      if (!pieces.white.checked) squares[i].classList.remove("dangerlight");
    }
    selectedSquare = null;
    // debug(pieces.black.checked);
  } else if (blackPieces.indexOf(square.textContent) != -1) {
    // Highlights invalid move (Opponent move)
    square.classList.add("invalidSquare");
    setTimeout(() => {
      square.classList.remove("invalidSquare");
    }, 150);
  } else if (square.textContent == pieces.white.king) {
    selectedSquare = square;
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        let moveCell = (sqRow - 1 + i) * 8 + sqCol - 1 + j;
        if (
          moveCell > 63 ||
          moveCell < 0 ||
          (sqCol % 8 == 0 && j == 0) ||
          (sqCol % 8 == 7 && j == 2)
        ) {
          continue; //King Corner overflow controlled
        }
        if (whitePieces.indexOf(squares[moveCell].textContent) == -1) {
          squares[moveCell].classList.add("movelight");
        }
      }
    }

    // Add castling moves
    if (gameState.whiteCanCastleKingside && !pieces.white.checked) {
      // Check if squares between king and rook are empty
      if (squares[7 * 8 + 5].textContent === "" && 
          squares[7 * 8 + 6].textContent === "" &&
          squares[7 * 8 + 7].textContent === pieces.white.rook) {
        // Check if squares are not under attack
        if (!isSquareUnderAttack(7, 5, "white") && 
            !isSquareUnderAttack(7, 6, "white")) {
          squares[7 * 8 + 6].classList.add("movelight");
        }
      }
    }
    
    if (gameState.whiteCanCastleQueenside && !pieces.white.checked) {
      // Check if squares between king and rook are empty
      if (squares[7 * 8 + 3].textContent === "" && 
          squares[7 * 8 + 2].textContent === "" &&
          squares[7 * 8 + 1].textContent === "" &&
          squares[7 * 8 + 0].textContent === pieces.white.rook) {
        // Check if squares are not under attack
        if (!isSquareUnderAttack(7, 3, "white") && 
            !isSquareUnderAttack(7, 2, "white")) {
          squares[7 * 8 + 2].classList.add("movelight");
        }
      }
    }
  } else if (!pieces.white.checked) {
    if (square.textContent == pieces.white.pawn) {
      //Move for white pawn
      const squares = document.getElementsByClassName("square");
      selectedSquare = square;
      square.classList.add("highlight");

      // Show pawn moves
      // 2 moves in first move
      if (sqRow == 6) {
        if (squares[(sqRow - 1) * 8 + sqCol].textContent === "") {
          squares[(sqRow - 2) * 8 + sqCol].classList.add("movelight");
          // Set this pawn as potential en passant target
          gameState.lastPawnDoubleMove = {
            row: sqRow - 2,
            col: sqCol
          };
        }
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

      // En passant capture
      if (sqRow === 3) { // White pawns can only en passant capture on rank 5 (row 3)
        if (gameState.lastPawnDoubleMove) {
          const lastMove = gameState.lastPawnDoubleMove;
          if (lastMove.row === 3) { // Check if the last move was to rank 5
            // Check if the last moved pawn is adjacent
            if (Math.abs(lastMove.col - sqCol) === 1) {
              squares[2 * 8 + lastMove.col].classList.add("takelight");
              gameState.enPassantTarget = {
                row: 2,
                col: lastMove.col
              };
            }
          }
        }
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
    } else if (square.textContent == pieces.white.knight) {
      selectedSquare = square;
      nRow = [sqRow - 1, sqRow + 1];
      nRow2 = [sqRow - 2, sqRow + 2];
      nCol = [sqCol - 1, sqCol + 1];
      nCol2 = [sqCol - 2, sqCol + 2];

      // adds movelight for Row (+-1) then column (+-2),and Row(+-2) then column(+-1)
      nRow.forEach((row) => {
        nCol2.forEach((col) => {
          if (
            row * 8 + col > 63 ||
            row * 8 + col < 0 ||
            col >= 8 ||
            col <= -1 ||
            whitePieces.indexOf(squares[row * 8 + col].textContent) != -1
          ) {
            return;
          }
          let squareBox = squares[row * 8 + col];
          squares[row * 8 + col].classList.add("movelight");
          squareBox.classList.add("movelight");
          if (blackPieces.indexOf(squareBox.textContent) != -1) {
            squareBox.classList.add("takelight");
          }
        });
      });
      nRow2.forEach((row) => {
        nCol.forEach((col) => {
          if (
            row * 8 + col > 63 ||
            row * 8 + col < 0 ||
            col >= 8 ||
            col <= -1 ||
            whitePieces.indexOf(squares[row * 8 + col].textContent) != -1
          ) {
            return;
          }
          let squareBox = squares[row * 8 + col];
          squares[row * 8 + col].classList.add("movelight");
          squareBox.classList.add("movelight");
          if (blackPieces.indexOf(squareBox.textContent) != -1) {
            squareBox.classList.add("takelight");
          }
        });
      });
    } else if (square.textContent == pieces.white.bishop) {
      selectedSquare = square;
      squares[sqRow * 8 + sqCol].classList.add("highlight");
      // Bishop Column Up
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol - i - 1;

        if (bRow >= 0 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol + i + 1;
        if (bRow >= 0 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      // Bishop Column Down
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol - i - 1;
        if (bRow <= 7 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol + i + 1;
        if (bRow <= 7 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
    } else if (square.textContent == pieces.white.queen) {
      selectedSquare = square;
      squares[sqRow * 8 + sqCol].classList.add("highlight");

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

      // Bishop Column Up
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol - i - 1;

        if (bRow >= 0 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol + i + 1;
        if (bRow >= 0 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      // Bishop Column Down
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol - i - 1;
        if (bRow <= 7 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol + i + 1;
        if (bRow <= 7 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
    }
  }
}

function analyzeCheckPawnBlack(piece, opp) {
  if (
    (piece.kingRow < 7 &&
      squares[(piece.kingRow + 1) * 8 + (piece.kingCol - 1)].textContent ==
        opp.pawn &&
      piece.kingCol > 0) ||
    (squares[(piece.kingRow + 1) * 8 + (piece.kingCol + 1)].textContent ==
      opp.pawn &&
      piece.kingCol < 7)
  ) {
    piece.checked = true;
    squares[piece.kingRow * 8 + piece.kingCol].classList.add("dangerlight");
  } else {
    piece.checked = false;
  }
}
function moveBlack(square) {
  sqRow = parseInt(square.dataset.row);
  sqCol = parseInt(square.dataset.col);

  // analyzeCheck(pieces.black, whitePieces);

  if (selectedSquare) {
    // Move piece to new square if it's not the same square
    if (square !== selectedSquare) {
      if (
        square.classList.contains("movelight") ||
        square.classList.contains("takelight")
      ) {
        // Handle castling moves
        if (selectedSquare.textContent === pieces.black.king) {
          const oldCol = parseInt(selectedSquare.dataset.col);
          const newCol = parseInt(square.dataset.col);
          
          // Kingside castling
          if (oldCol === 4 && newCol === 6) {
            squares[0 * 8 + 7].textContent = ""; // Remove rook from old position
            squares[0 * 8 + 5].textContent = pieces.black.rook; // Place rook in new position
          }
          // Queenside castling
          else if (oldCol === 4 && newCol === 2) {
            squares[0 * 8 + 0].textContent = ""; // Remove rook from old position
            squares[0 * 8 + 3].textContent = pieces.black.rook; // Place rook in new position
          }

          // Update king position and castling rights
          pieces.black.kingRow = sqRow;
          pieces.black.kingCol = sqCol;
          gameState.blackCanCastleKingside = false;
          gameState.blackCanCastleQueenside = false;
          selectedSquare.classList.remove("dangerlight");
        }

        // Update castling rights if rook moves
        if (selectedSquare.textContent === pieces.black.rook) {
          const oldCol = parseInt(selectedSquare.dataset.col);
          if (oldCol === 0) gameState.blackCanCastleQueenside = false;
          if (oldCol === 7) gameState.blackCanCastleKingside = false;
        }

        // Store captured piece if any
        if (square.textContent !== "") {
          gameState.capturedPieces.black.push(square.textContent);
        }

        // Handle en passant capture
        if (selectedSquare.textContent === pieces.black.pawn &&
            gameState.enPassantTarget &&
            sqRow === gameState.enPassantTarget.row &&
            sqCol === gameState.enPassantTarget.col) {
          // Remove the captured pawn
          const capturedPawn = squares[(sqRow - 1) * 8 + sqCol];
          gameState.capturedPieces.black.push(capturedPawn.textContent);
          capturedPawn.textContent = "";
        }

        square.textContent = selectedSquare.textContent;
        selectedSquare.textContent = "";

        // Clear en passant target after each move
        gameState.enPassantTarget = null;

        // Handle pawn promotion
        if (square.textContent === pieces.black.pawn && sqRow === 7) {
          // Automatically promote to queen for now
          square.textContent = pieces.black.queen;
        }

        turn = blackTurn;

        // Add move to history
        gameState.moveHistory.push({
          piece: square.textContent,
          from: {
            row: parseInt(selectedSquare.dataset.row),
            col: parseInt(selectedSquare.dataset.col)
          },
          to: {
            row: sqRow,
            col: sqCol
          },
          captured: gameState.capturedPieces.black[gameState.capturedPieces.black.length - 1] || null
        });
      }
    }
    selectedSquare.classList.remove("highlight");
    for (let i = 0; i < 64; i++) {
      squares[i].classList.remove("movelight");
      squares[i].classList.remove("takelight");
    }
    selectedSquare = null;
  } else if (whitePieces.indexOf(square.textContent) != -1) {
    // Highlights invalid move
    square.classList.add("invalidSquare");
    setTimeout(() => {
      square.classList.remove("invalidSquare");
    }, 150);
  } else if (square.textContent == pieces.black.king) {
    selectedSquare = square;
    for (i = 0; i < 3; i++) {
      for (j = 0; j < 3; j++) {
        let moveCell = (sqRow - 1 + i) * 8 + sqCol - 1 + j;
        if (
          moveCell > 63 ||
          moveCell < 0 ||
          (sqCol % 8 == 0 && j == 0) ||
          (sqCol % 8 == 7 && j == 2)
        ) {
          continue; //King overflow controlled
        }
        if (blackPieces.indexOf(squares[moveCell].textContent) == -1) {
          squares[moveCell].classList.add("movelight");
        }
      }
    }

    // Add castling moves for black
    if (gameState.blackCanCastleKingside && !pieces.black.checked) {
      // Check if squares between king and rook are empty
      if (squares[0 * 8 + 5].textContent === "" && 
          squares[0 * 8 + 6].textContent === "" &&
          squares[0 * 8 + 7].textContent === pieces.black.rook) {
        // Check if squares are not under attack
        if (!isSquareUnderAttack(0, 5, "black") && 
            !isSquareUnderAttack(0, 6, "black")) {
          squares[0 * 8 + 6].classList.add("movelight");
        }
      }
    }
    
    if (gameState.blackCanCastleQueenside && !pieces.black.checked) {
      // Check if squares between king and rook are empty
      if (squares[0 * 8 + 3].textContent === "" && 
          squares[0 * 8 + 2].textContent === "" &&
          squares[0 * 8 + 1].textContent === "" &&
          squares[0 * 8 + 0].textContent === pieces.black.rook) {
        // Check if squares are not under attack
        if (!isSquareUnderAttack(0, 3, "black") && 
            !isSquareUnderAttack(0, 2, "black")) {
          squares[0 * 8 + 2].classList.add("movelight");
        }
      }
    }
  } else if (pieces.black.checked == false) {
    if (square.textContent == pieces.black.pawn) {
      //Move for black pawn
      const squares = document.getElementsByClassName("square");
      selectedSquare = square;
      square.classList.add("highlight");

      // Show pawn moves
      // 2 moves in first move
      if (sqRow == 1) {
        if (squares[(sqRow + 1) * 8 + sqCol].textContent === "") {
          squares[(sqRow + 2) * 8 + sqCol].classList.add("movelight");
          // Set this pawn as potential en passant target
          gameState.lastPawnDoubleMove = {
            row: sqRow + 2,
            col: sqCol
          };
        }
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

      // En passant capture
      if (sqRow === 4) { // Black pawns can only en passant capture on rank 4
        if (gameState.lastPawnDoubleMove) {
          const lastMove = gameState.lastPawnDoubleMove;
          if (lastMove.row === 4) { // Check if the last move was to rank 4
            // Check if the last moved pawn is adjacent
            if (Math.abs(lastMove.col - sqCol) === 1) {
              squares[5 * 8 + lastMove.col].classList.add("takelight");
              gameState.enPassantTarget = {
                row: 5,
                col: lastMove.col
              };
            }
          }
        }
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
    } else if (square.textContent == pieces.black.knight) {
      selectedSquare = square;
      nRow = [sqRow - 1, sqRow + 1];
      nRow2 = [sqRow - 2, sqRow + 2];
      nCol = [sqCol - 1, sqCol + 1];
      nCol2 = [sqCol - 2, sqCol + 2];

      // adds movelight for Row (+-1) then column (+-2),and Row(+-2) then column(+-1)
      nRow.forEach((row) => {
        nCol2.forEach((col) => {
          if (
            row * 8 + col > 63 ||
            row * 8 + col < 0 ||
            col >= 8 ||
            col <= -1 ||
            whitePieces.indexOf(squares[row * 8 + col].textContent) != -1
          ) {
            return;
          }
          let squareBox = squares[row * 8 + col];
          squares[row * 8 + col].classList.add("movelight");
          squareBox.classList.add("movelight");
          if (blackPieces.indexOf(squareBox.textContent) != -1) {
            squareBox.classList.add("takelight");
          }
        });
      });
      nRow2.forEach((row) => {
        nCol.forEach((col) => {
          if (
            row * 8 + col > 63 ||
            row * 8 + col < 0 ||
            col >= 8 ||
            col <= -1 ||
            whitePieces.indexOf(squares[row * 8 + col].textContent) != -1
          ) {
            return;
          }
          let squareBox = squares[row * 8 + col];
          squareBox.classList.add("movelight");
          if (blackPieces.indexOf(squareBox.textContent) != -1) {
            squareBox.classList.add("takelight");
          }
        });
      });
    } else if (square.textContent == pieces.black.bishop) {
      selectedSquare = square;
      squares[sqRow * 8 + sqCol].classList.add("highlight");
      // Bishop Column Up
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol - i - 1;

        if (bRow >= 0 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol + i + 1;
        if (bRow >= 0 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      // Bishop Column Down
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol - i - 1;
        if (bRow <= 7 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol + i + 1;
        if (bRow <= 7 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
    } else if (square.textContent == pieces.black.queen) {
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

      // Bishop Column Up
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol - i - 1;

        if (bRow >= 0 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow - i - 1;
        bCol = sqCol + i + 1;
        if (bRow >= 0 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      // Bishop Column Down
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol - i - 1;
        if (bRow <= 7 && bCol >= 0) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
      for (let i = 0; i <= 7; i++) {
        bRow = sqRow + i + 1;
        bCol = sqCol + i + 1;
        if (bRow <= 7 && bCol <= 7) {
          if (whitePieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            break;
          }
          squares[bRow * 8 + bCol].classList.add("movelight");
          if (blackPieces.indexOf(squares[bRow * 8 + bCol].textContent) != -1) {
            squares[bRow * 8 + bCol].classList.add("takelight");
            break;
          }
        }
      }
    }
  }
}

// Initialize the game
createChessboard();
placePieces();

const squares = document.getElementsByClassName("square");
function debug(content) {
  debugBox.innerHTML = content;
}
// debug();

function isSquareUnderAttack(row, col, color) {
    const opponentColor = color === "white" ? "black" : "white";
    const opponentPieces = color === "white" ? blackPieces : whitePieces;
    
    // Check for pawn attacks
    const pawnDirection = color === "white" ? -1 : 1;
    if (row + pawnDirection >= 0 && row + pawnDirection < 8) {
        if (col > 0 && squares[(row + pawnDirection) * 8 + (col - 1)].textContent === pieces[opponentColor].pawn) return true;
        if (col < 7 && squares[(row + pawnDirection) * 8 + (col + 1)].textContent === pieces[opponentColor].pawn) return true;
    }

    // Check for knight attacks
    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [rowOffset, colOffset] of knightMoves) {
        const newRow = row + rowOffset;
        const newCol = col + colOffset;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            if (squares[newRow * 8 + newCol].textContent === pieces[opponentColor].knight) return true;
        }
    }

    // Check for king attacks
    const kingMoves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    for (const [rowOffset, colOffset] of kingMoves) {
        const newRow = row + rowOffset;
        const newCol = col + colOffset;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            if (squares[newRow * 8 + newCol].textContent === pieces[opponentColor].king) return true;
        }
    }

    // Check for rook/queen attacks (horizontal and vertical)
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [rowDir, colDir] of directions) {
        let newRow = row + rowDir;
        let newCol = col + colDir;
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const piece = squares[newRow * 8 + newCol].textContent;
            if (piece !== "") {
                if (piece === pieces[opponentColor].rook || piece === pieces[opponentColor].queen) return true;
                break;
            }
            newRow += rowDir;
            newCol += colDir;
        }
    }

    // Check for bishop/queen attacks (diagonals)
    const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [rowDir, colDir] of diagonals) {
        let newRow = row + rowDir;
        let newCol = col + colDir;
        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const piece = squares[newRow * 8 + newCol].textContent;
            if (piece !== "") {
                if (piece === pieces[opponentColor].bishop || piece === pieces[opponentColor].queen) return true;
                break;
            }
            newRow += rowDir;
            newCol += colDir;
        }
    }

    return false;
}
