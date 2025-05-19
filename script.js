// DOM Elements
const board = document.getElementById("chessboard");
const debugBox = document.getElementById("debug");
const gameStatus = document.getElementById("game-status");
const moveList = document.getElementById("move-list");
const whiteCaptured = document.getElementById("white-captured");
const blackCaptured = document.getElementById("black-captured");
const promotionModal = document.getElementById("promotion-modal");

// Game state constants
const PLAYER = {
  WHITE: 0,
  BLACK: 1
};

// Game state variables
let selectedSquare = null;
let turn = PLAYER.WHITE;
let invalidOpacity = 0;
let pendingPromotion = null;
let squares = null; // Will be populated after board creation

// Game state object
const gameState = {
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
  },
  moveCount: 1
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

// ===========================
// Main Game Logic Functions
// ===========================

/**
 * Handles the click event on a chess square
 * @param {HTMLElement} square - The square that was clicked
 */
function squareClick(square) {
  if (turn === PLAYER.WHITE) {
    moveWhite(square);
    analyzeCheckPawnBlack(pieces.black, whitePieces);
    analyzeCheck(pieces.black, pieces.white);
  } else {
    moveBlack(square);
    analyzeCheckPawnWhite(pieces.white, pieces.black);
    analyzeCheck(pieces.white, pieces.black);
  }
  updateGameStatus();
}

/**
 * Checks if a pawn is putting the white king in check
 * @param {Object} piece - The player's king piece
 * @param {Array} opp - The opponent's pieces
 */
function analyzeCheckPawnWhite(piece, opp) {
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (
    kingRow > 0 &&
    ((squares[(kingRow - 1) * 8 + (kingCol - 1)].textContent === opp.pawn &&
      kingCol > 0) ||
      (squares[(kingRow - 1) * 8 + (kingCol + 1)].textContent === opp.pawn &&
        kingCol < 7))
  ) {
    piece.checked = true;
    squares[kingRow * 8 + kingCol].classList.add("dangerlight");
  } else {
    piece.checked = false;
  }
}

/**
 * Checks if a pawn is putting the black king in check
 * @param {Object} piece - The player's king piece
 * @param {Array} opp - The opponent's pieces
 */
function analyzeCheckPawnBlack(piece, opp) {
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (
    (kingRow < 7 &&
      squares[(kingRow + 1) * 8 + (kingCol - 1)].textContent === opp.pawn &&
      kingCol > 0) ||
    (squares[(kingRow + 1) * 8 + (kingCol + 1)].textContent === opp.pawn &&
      kingCol < 7)
  ) {
    piece.checked = true;
    squares[kingRow * 8 + kingCol].classList.add("dangerlight");
  } else {
    piece.checked = false;
  }
}

/**
 * Analyzes if a king is in check from any piece
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 */
function analyzeCheck(piece, opp) {
  const row = piece.kingRow;
  const col = piece.kingCol;
  piece.checked = false;
  
  // Check for rook or queen attacks (horizontal/vertical)
  checkRookAttacks(piece, opp, row, col);
  
  // Check for knight attacks
  checkKnightAttacks(piece, opp, row, col);
  
  // Check for bishop or queen attacks (diagonal)
  checkBishopAttacks(piece, opp, row, col);
}

/**
 * Check if a rook or queen is attacking the king horizontally/vertically
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 * @param {number} row - King's row
 * @param {number} col - King's column
 */
function checkRookAttacks(piece, opp, row, col) {
  // Check upwards
  for (let i = 1; i <= row; i++) {
    if (squares[(row - i) * 8 + col].textContent === opp.rook ||
        squares[(row - i) * 8 + col].textContent === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[(row - i) * 8 + col].textContent !== "") {
      break;
    }
  }
  
  // Check downwards
  for (let i = row + 1; i <= 7; i++) {
    if (squares[i * 8 + col].textContent === opp.rook ||
        squares[i * 8 + col].textContent === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[i * 8 + col].textContent !== "") {
      break;
    }
  }
  
  // Check left
  for (let i = 1; i <= col; i++) {
    if (squares[row * 8 + (col - i)].textContent === opp.rook ||
        squares[row * 8 + (col - i)].textContent === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[row * 8 + (col - i)].textContent !== "") {
      break;
    }
  }
  
  // Check right
  for (let i = col + 1; i <= 7; i++) {
    if (squares[row * 8 + i].textContent === opp.rook ||
        squares[row * 8 + i].textContent === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (squares[row * 8 + i].textContent !== "") {
      break;
    }
  }
}

/**
 * Check if a knight is attacking the king
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 * @param {number} row - King's row
 * @param {number} col - King's column
 */
function checkKnightAttacks(piece, opp, row, col) {
  const nRow = [row - 1, row + 1];
  const nRow2 = [row - 2, row + 2];
  const nCol = [col - 1, col + 1];
  const nCol2 = [col - 2, col + 2];

  // Check all knight move patterns
  nRow.forEach((knightRow) => {
    nCol2.forEach((knightCol) => {
      if (
        knightRow * 8 + knightCol < 64 &&
        knightRow * 8 + knightCol >= 0 &&
        knightCol <= 7 &&
        knightCol >= 0 &&
        squares[knightRow * 8 + knightCol].textContent === opp.knight
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
        squares[knightRow * 8 + knightCol].textContent === opp.knight
      ) {
        piece.checked = true;
        squares[row * 8 + col].classList.add("dangerlight");
      }
    });
  });
}

/**
 * Check if a bishop or queen is attacking the king diagonally
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 * @param {number} row - King's row
 * @param {number} col - King's column
 */
function checkBishopAttacks(piece, opp, row, col) {
  // Check upper-left diagonal
  for (let i = 1; i <= Math.min(row, col); i++) {
    const targetRow = row - i;
    const targetCol = col - i;
    const target = squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check upper-right diagonal
  for (let i = 1; i <= Math.min(row, 7 - col); i++) {
    const targetRow = row - i;
    const targetCol = col + i;
    const target = squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check lower-left diagonal
  for (let i = 1; i <= Math.min(7 - row, col); i++) {
    const targetRow = row + i;
    const targetCol = col - i;
    const target = squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check lower-right diagonal
  for (let i = 1; i <= Math.min(7 - row, 7 - col); i++) {
    const targetRow = row + i;
    const targetCol = col + i;
    const target = squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
}

/**
 * Handles white piece movement
 * @param {HTMLElement} square - The clicked square
 */
function moveWhite(square) {
  const sqRow = parseInt(square.dataset.row);
  const sqCol = parseInt(square.dataset.col);

  if (selectedSquare) {
    // Handle moving a selected piece
    handleWhitePieceMove(square, sqRow, sqCol);
  } else if (blackPieces.indexOf(square.textContent) !== -1) {
    // Highlights invalid move (Opponent move)
    highlightInvalidMove(square);
  } else if (square.textContent === pieces.white.king) {
    // Handle king selection
    handleWhiteKingSelect(square, sqRow, sqCol);
  } else if (!pieces.white.checked) {
    // Handle other piece selection when not in check
    handleWhitePieceSelect(square, sqRow, sqCol);
  }
}

/**
 * Handles black piece movement
 * @param {HTMLElement} square - The clicked square
 */
function moveBlack(square) {
  const sqRow = parseInt(square.dataset.row);
  const sqCol = parseInt(square.dataset.col);

  if (selectedSquare) {
    // Handle moving a selected piece
    handleBlackPieceMove(square, sqRow, sqCol);
  } else if (whitePieces.indexOf(square.textContent) !== -1) {
    // Highlights invalid move
    highlightInvalidMove(square);
  } else if (square.textContent === pieces.black.king) {
    // Handle king selection
    handleBlackKingSelect(square, sqRow, sqCol);
  } else if (!pieces.black.checked) {
    // Handle other piece selection when not in check
    handleBlackPieceSelect(square, sqRow, sqCol);
  }
}

/**
 * Highlights an invalid move temporarily
 * @param {HTMLElement} square - The square to highlight
 */
function highlightInvalidMove(square) {
  square.classList.add("invalidSquare");
  setTimeout(() => {
    square.classList.remove("invalidSquare");
  }, 150);
}

/**
 * Checks if a square is under attack by opponent pieces
 * @param {number} row - The row to check
 * @param {number} col - The column to check
 * @param {string} color - The color of the pieces to check ('white' or 'black')
 * @returns {boolean} True if the square is under attack
 */
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

// ===========================
// Board Setup Functions
// ===========================

/**
 * Creates the chessboard grid with event listeners
 */
function createChessboard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("click", () => squareClick(square));
      board.appendChild(square);
    }
  }
}

/**
 * Places the initial pieces on the board
 */
function placePieces() {
  const initialSetup = [
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
    Array(8).fill("pawn"),
    ...Array(4).fill(Array(8).fill(null)),
    Array(8).fill("pawn"),
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
  ];

  initialSetup.forEach((row, rowIndex) => {
    row.forEach((pieceType, colIndex) => {
      if (pieceType) {
        const square = squares[rowIndex * 8 + colIndex];
        const color = rowIndex < 4 ? "black" : "white";
        square.textContent = pieces[color][pieceType];
      }
    });
  });
}

// ===========================
// UI Update Functions
// ===========================

/**
 * Updates the captured pieces display
 */
function updateCapturedPieces() {
  whiteCaptured.innerHTML = '';
  blackCaptured.innerHTML = '';
  
  gameState.capturedPieces.white.forEach(piece => {
    const pieceElement = document.createElement('span');
    pieceElement.textContent = piece;
    whiteCaptured.appendChild(pieceElement);
  });
  
  gameState.capturedPieces.black.forEach(piece => {
    const pieceElement = document.createElement('span');
    pieceElement.textContent = piece;
    blackCaptured.appendChild(pieceElement);
  });
}

/**
 * Updates the move history display
 */
function updateMoveHistory() {
  moveList.innerHTML = '';
  
  for (let i = 0; i < gameState.moveHistory.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = gameState.moveHistory[i];
    const blackMove = gameState.moveHistory[i + 1];
    
    const moveItem = document.createElement('div');
    moveItem.classList.add('move-item');
    
    const moveNumberElement = document.createElement('div');
    moveNumberElement.classList.add('move-number');
    moveNumberElement.textContent = `${moveNumber}.`;
    
    const moveTextElement = document.createElement('div');
    moveTextElement.classList.add('move-text');
    
    let moveText = `${algebraicNotation(whiteMove)}`;
    if (blackMove) {
      moveText += ` ${algebraicNotation(blackMove)}`;
    }
    
    moveTextElement.textContent = moveText;
    
    moveItem.appendChild(moveNumberElement);
    moveItem.appendChild(moveTextElement);
    moveList.appendChild(moveItem);
  }
  
  // Auto-scroll to bottom
  moveList.scrollTop = moveList.scrollHeight;
}

/**
 * Converts a move to algebraic notation
 * @param {Object} move - The move object
 * @returns {string} The move in algebraic notation
 */
function algebraicNotation(move) {
  if (!move) return '';
  
  // Simplistic algebraic notation
  const files = 'abcdefgh';
  const ranks = '87654321';
  
  const fromFile = files[move.from.col];
  const fromRank = ranks[move.from.row];
  const toFile = files[move.to.col];
  const toRank = ranks[move.to.row];
  
  let piece = '';
  switch(move.piece) {
    case pieces.white.king:
    case pieces.black.king:
      piece = 'K';
      break;
    case pieces.white.queen:
    case pieces.black.queen:
      piece = 'Q';
      break;
    case pieces.white.rook:
    case pieces.black.rook:
      piece = 'R';
      break;
    case pieces.white.bishop:
    case pieces.black.bishop:
      piece = 'B';
      break;
    case pieces.white.knight:
    case pieces.black.knight:
      piece = 'N';
      break;
    // Pawns don't get a letter prefix
  }
  
  // For pawns, include the file if a capture occurred
  if (piece === '' && move.captured) {
    return `${fromFile}x${toFile}${toRank}`;
  }
  
  const captureSymbol = move.captured ? 'x' : '';
  return `${piece}${captureSymbol}${toFile}${toRank}`;
}

/**
 * Updates the game status display
 */
function updateGameStatus() {
  if (turn === PLAYER.WHITE) {
    gameStatus.textContent = "White to move";
  } else {
    gameStatus.textContent = "Black to move";
  }
  
  if (pieces.white.checked) {
    gameStatus.textContent = "White is in check!";
  } else if (pieces.black.checked) {
    gameStatus.textContent = "Black is in check!";
  }
}

// ===========================
// Pawn Promotion
// ===========================

/**
 * Sets up the pawn promotion modal event listeners
 */
function setupPromotionModal() {
  const promotionPieces = document.querySelectorAll('.promotion-piece');
  
  promotionPieces.forEach(piece => {
    piece.addEventListener('click', () => {
      if (!pendingPromotion) return;
      
      const pieceType = piece.getAttribute('data-piece');
      const color = turn === PLAYER.WHITE ? 'black' : 'white'; // Because we've already switched turns
      
      // Update the piece on the board
      const square = squares[pendingPromotion.row * 8 + pendingPromotion.col];
      square.textContent = pieces[color][pieceType];
      
      // Update the move history
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
      lastMove.promotion = pieceType;
      
      // Hide the modal
      promotionModal.style.display = 'none';
      pendingPromotion = null;
    });
  });
}

/**
 * Shows the pawn promotion modal
 * @param {string} color - The color of the pawn ('white' or 'black')
 * @param {number} row - The row of the promotion square
 * @param {number} col - The column of the promotion square
 */
function showPromotionModal(color, row, col) {
  // Store the pending promotion
  pendingPromotion = { row, col };
  
  // Show the appropriate color pieces
  const whitePromotions = document.querySelectorAll('.white-promotion');
  const blackPromotions = document.querySelectorAll('.black-promotion');
  
  if (color === 'white') {
    whitePromotions.forEach(p => p.style.display = 'block');
    blackPromotions.forEach(p => p.style.display = 'none');
  } else {
    whitePromotions.forEach(p => p.style.display = 'none');
    blackPromotions.forEach(p => p.style.display = 'block');
  }
  
  // Show the modal
  promotionModal.style.display = 'flex';
}

function debug(content) {
  debugBox.innerHTML = content;
}

// ===========================
// Initialize the Game
// ===========================

// Initialize the board and pieces
createChessboard();

// Get squares collection after board creation
squares = document.getElementsByClassName("square");

// Place pieces on the board
placePieces();

// Initialize UI
updateGameStatus();
setupPromotionModal();

/**
 * Handles moving a selected white piece
 * @param {HTMLElement} square - The destination square
 * @param {number} sqRow - The row of the destination square
 * @param {number} sqCol - The column of the destination square
 */
function handleWhitePieceMove(square, sqRow, sqCol) {
  if (square !== selectedSquare) {
    if (
      square.classList.contains("movelight") ||
      square.classList.contains("takelight")
    ) {
      // Store the original piece and position for history and en passant logic
      const pieceText = selectedSquare.textContent;
      const originalRow = parseInt(selectedSquare.dataset.row);
      const originalCol = parseInt(selectedSquare.dataset.col);

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

      // Move the piece
      square.textContent = selectedSquare.textContent;
      selectedSquare.textContent = "";

      // Set en passant target if pawn moved two squares
      if (pieceText === pieces.white.pawn && originalRow === 6 && sqRow === 4) {
        gameState.enPassantTarget = { row: 5, col: sqCol };
      } else {
        // Clear en passant target after each move
        gameState.enPassantTarget = null;
      }

      // Handle pawn promotion
      if (square.textContent === pieces.white.pawn && sqRow === 0) {
        // Show promotion modal instead of auto-promoting
        showPromotionModal('white', sqRow, sqCol);
      }

      turn = PLAYER.BLACK;

      // Add move to history
      gameState.moveHistory.push({
        piece: square.textContent,
        from: {
          row: originalRow,
          col: originalCol
        },
        to: {
          row: sqRow,
          col: sqCol
        },
        captured: gameState.capturedPieces.white[gameState.capturedPieces.white.length - 1] || null
      });

      // Update UI
      updateGameStatus();
      updateCapturedPieces();
      updateMoveHistory();
    }
  }
  
  // Clean up
  cleanupAfterMove();
}

/**
 * Cleans up after a move is made
 */
function cleanupAfterMove() {
  if (!selectedSquare) return;
  
  selectedSquare.classList.remove("highlight");
  for (let i = 0; i < 64; i++) {
    squares[i].classList.remove("movelight");
    squares[i].classList.remove("takelight");
  }
  selectedSquare = null;
}

/**
 * Handles selecting the white king
 * @param {HTMLElement} square - The king's square
 * @param {number} sqRow - The row of the king
 * @param {number} sqCol - The column of the king
 */
function handleWhiteKingSelect(square, sqRow, sqCol) {
  selectedSquare = square;
  square.classList.add("highlight");
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let moveCell = (sqRow - 1 + i) * 8 + sqCol - 1 + j;
      if (
        moveCell > 63 ||
        moveCell < 0 ||
        (sqCol % 8 === 0 && j === 0) ||
        (sqCol % 8 === 7 && j === 2)
      ) {
        continue; // King Corner overflow controlled
      }
      if (whitePieces.indexOf(squares[moveCell].textContent) === -1) {
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
}

/**
 * Handles selecting a white piece (other than king)
 * @param {HTMLElement} square - The piece's square
 * @param {number} sqRow - The row of the piece
 * @param {number} sqCol - The column of the piece
 */
function handleWhitePieceSelect(square, sqRow, sqCol) {
  selectedSquare = square;
  square.classList.add("highlight");
  
  const pieceType = square.textContent;
  
  if (pieceType === pieces.white.pawn) {
    handleWhitePawnSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.white.rook) {
    handleWhiteRookSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.white.knight) {
    handleWhiteKnightSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.white.bishop) {
    handleWhiteBishopSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.white.queen) {
    handleWhiteQueenSelect(square, sqRow, sqCol);
  }
}

/**
 * Handles selecting a white pawn
 * @param {HTMLElement} square - The pawn's square
 * @param {number} sqRow - The row of the pawn
 * @param {number} sqCol - The column of the pawn
 */
function handleWhitePawnSelect(square, sqRow, sqCol) {
  // Highlight forward move (one square)
  if (sqRow > 0 && squares[(sqRow - 1) * 8 + sqCol].textContent === "") {
    squares[(sqRow - 1) * 8 + sqCol].classList.add("movelight");
    
    // Highlight forward move (two squares) if pawn is on starting position
    if (sqRow === 6 && squares[(sqRow - 2) * 8 + sqCol].textContent === "") {
      squares[(sqRow - 2) * 8 + sqCol].classList.add("movelight");
    }
  }
  
  // Highlight diagonal captures
  for (let colOffset of [-1, 1]) {
    const newCol = sqCol + colOffset;
    if (newCol >= 0 && newCol < 8) {
      const target = squares[(sqRow - 1) * 8 + newCol];
      
      // Standard capture
      if (blackPieces.indexOf(target.textContent) !== -1) {
        target.classList.add("takelight");
      }
      
      // En passant capture
      if (gameState.enPassantTarget && 
          sqRow === gameState.enPassantTarget.row + 1 && 
          newCol === gameState.enPassantTarget.col) {
        target.classList.add("takelight");
      }
    }
  }
}

/**
 * Handles selecting a white rook
 * @param {HTMLElement} square - The rook's square
 * @param {number} sqRow - The row of the rook
 * @param {number} sqCol - The column of the rook
 */
function handleWhiteRookSelect(square, sqRow, sqCol) {
  // Highlight moves in all four directions (up, down, left, right)
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [rowDir, colDir] of directions) {
    let newRow = sqRow + rowDir;
    let newCol = sqCol + colDir;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = squares[newRow * 8 + newCol];
      
      if (target.textContent === "") {
        // Empty square
        target.classList.add("movelight");
      } else if (blackPieces.indexOf(target.textContent) !== -1) {
        // Opponent's piece
        target.classList.add("takelight");
        break;
      } else {
        // Own piece
        break;
      }
      
      newRow += rowDir;
      newCol += colDir;
    }
  }
}

/**
 * Handles selecting a white knight
 * @param {HTMLElement} square - The knight's square
 * @param {number} sqRow - The row of the knight
 * @param {number} sqCol - The column of the knight
 */
function handleWhiteKnightSelect(square, sqRow, sqCol) {
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [rowOffset, colOffset] of knightMoves) {
    const newRow = sqRow + rowOffset;
    const newCol = sqCol + colOffset;
    
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = squares[newRow * 8 + newCol];
      
      if (target.textContent === "") {
        // Empty square
        target.classList.add("movelight");
      } else if (blackPieces.indexOf(target.textContent) !== -1) {
        // Opponent's piece
        target.classList.add("takelight");
      }
    }
  }
}

/**
 * Handles selecting a white bishop
 * @param {HTMLElement} square - The bishop's square
 * @param {number} sqRow - The row of the bishop
 * @param {number} sqCol - The column of the bishop
 */
function handleWhiteBishopSelect(square, sqRow, sqCol) {
  // Highlight moves in all four diagonal directions
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  for (const [rowDir, colDir] of diagonals) {
    let newRow = sqRow + rowDir;
    let newCol = sqCol + colDir;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = squares[newRow * 8 + newCol];
      
      if (target.textContent === "") {
        // Empty square
        target.classList.add("movelight");
      } else if (blackPieces.indexOf(target.textContent) !== -1) {
        // Opponent's piece
        target.classList.add("takelight");
        break;
      } else {
        // Own piece
        break;
      }
      
      newRow += rowDir;
      newCol += colDir;
    }
  }
}

/**
 * Handles selecting a white queen
 * @param {HTMLElement} square - The queen's square
 * @param {number} sqRow - The row of the queen
 * @param {number} sqCol - The column of the queen
 */
function handleWhiteQueenSelect(square, sqRow, sqCol) {
  // Queen combines rook and bishop movements
  // First, add rook-like movements (horizontal and vertical)
  handleWhiteRookSelect(square, sqRow, sqCol);
  
  // Then, add bishop-like movements (diagonals)
  handleWhiteBishopSelect(square, sqRow, sqCol);
}

/**
 * Handles moving a selected black piece
 * @param {HTMLElement} square - The destination square
 * @param {number} sqRow - The row of the destination square
 * @param {number} sqCol - The column of the destination square
 */
function handleBlackPieceMove(square, sqRow, sqCol) {
  if (square !== selectedSquare) {
    if (
      square.classList.contains("movelight") ||
      square.classList.contains("takelight")
    ) {
      // Store the original piece and position for history and en passant logic
      const pieceText = selectedSquare.textContent;
      const originalRow = parseInt(selectedSquare.dataset.row);
      const originalCol = parseInt(selectedSquare.dataset.col);

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

      // Move the piece
      square.textContent = selectedSquare.textContent;
      selectedSquare.textContent = "";

      // Set en passant target if pawn moved two squares
      if (pieceText === pieces.black.pawn && originalRow === 1 && sqRow === 3) {
        gameState.enPassantTarget = { row: 2, col: sqCol };
      } else {
        // Clear en passant target after each move
        gameState.enPassantTarget = null;
      }

      // Handle pawn promotion
      if (square.textContent === pieces.black.pawn && sqRow === 7) {
        // Show promotion modal instead of auto-promoting
        showPromotionModal('black', sqRow, sqCol);
      }

      turn = PLAYER.WHITE;

      // Add move to history
      gameState.moveHistory.push({
        piece: square.textContent,
        from: {
          row: originalRow,
          col: originalCol
        },
        to: {
          row: sqRow,
          col: sqCol
        },
        captured: gameState.capturedPieces.black[gameState.capturedPieces.black.length - 1] || null
      });

      // Update UI
      updateGameStatus();
      updateCapturedPieces();
      updateMoveHistory();
    }
  }
  
  // Clean up
  cleanupAfterMove();
}

/**
 * Handles selecting a black piece (other than king)
 * @param {HTMLElement} square - The piece's square
 * @param {number} sqRow - The row of the piece
 * @param {number} sqCol - The column of the piece
 */
function handleBlackPieceSelect(square, sqRow, sqCol) {
  selectedSquare = square;
  square.classList.add("highlight");
  
  const pieceType = square.textContent;
  
  if (pieceType === pieces.black.pawn) {
    handleBlackPawnSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.black.rook) {
    handleBlackRookSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.black.knight) {
    handleBlackKnightSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.black.bishop) {
    handleBlackBishopSelect(square, sqRow, sqCol);
  } else if (pieceType === pieces.black.queen) {
    handleBlackQueenSelect(square, sqRow, sqCol);
  }
}

/**
 * Handles selecting the black king
 * @param {HTMLElement} square - The king's square
 * @param {number} sqRow - The row of the king
 * @param {number} sqCol - The column of the king
 */
function handleBlackKingSelect(square, sqRow, sqCol) {
  selectedSquare = square;
  square.classList.add("highlight");
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let moveCell = (sqRow - 1 + i) * 8 + sqCol - 1 + j;
      if (
        moveCell > 63 ||
        moveCell < 0 ||
        (sqCol % 8 === 0 && j === 0) ||
        (sqCol % 8 === 7 && j === 2)
      ) {
        continue; // King Corner overflow controlled
      }
      if (blackPieces.indexOf(squares[moveCell].textContent) === -1) {
        squares[moveCell].classList.add("movelight");
      }
    }
  }

  // Add castling moves
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
}

/**
 * Handles selecting a black pawn
 * @param {HTMLElement} square - The pawn's square
 * @param {number} sqRow - The row of the pawn
 * @param {number} sqCol - The column of the pawn
 */
function handleBlackPawnSelect(square, sqRow, sqCol) {
  // Highlight forward move (one square)
  if (sqRow < 7 && squares[(sqRow + 1) * 8 + sqCol].textContent === "") {
    squares[(sqRow + 1) * 8 + sqCol].classList.add("movelight");
    
    // Highlight forward move (two squares) if pawn is on starting position
    if (sqRow === 1 && squares[(sqRow + 2) * 8 + sqCol].textContent === "") {
      squares[(sqRow + 2) * 8 + sqCol].classList.add("movelight");
    }
  }
  
  // Highlight diagonal captures
  for (let colOffset of [-1, 1]) {
    const newCol = sqCol + colOffset;
    if (newCol >= 0 && newCol < 8) {
      const target = squares[(sqRow + 1) * 8 + newCol];
      
      // Standard capture
      if (whitePieces.indexOf(target.textContent) !== -1) {
        target.classList.add("takelight");
      }
      
      // En passant capture
      if (gameState.enPassantTarget && 
          sqRow === gameState.enPassantTarget.row - 1 && 
          newCol === gameState.enPassantTarget.col) {
        target.classList.add("takelight");
      }
    }
  }
}

/**
 * Handles selecting a black rook
 * @param {HTMLElement} square - The rook's square
 * @param {number} sqRow - The row of the rook
 * @param {number} sqCol - The column of the rook
 */
function handleBlackRookSelect(square, sqRow, sqCol) {
  // Highlight moves in all four directions (up, down, left, right)
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [rowDir, colDir] of directions) {
    let newRow = sqRow + rowDir;
    let newCol = sqCol + colDir;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = squares[newRow * 8 + newCol];
      
      if (target.textContent === "") {
        // Empty square
        target.classList.add("movelight");
      } else if (whitePieces.indexOf(target.textContent) !== -1) {
        // Opponent's piece
        target.classList.add("takelight");
        break;
      } else {
        // Own piece
        break;
      }
      
      newRow += rowDir;
      newCol += colDir;
    }
  }
}

/**
 * Handles selecting a black knight
 * @param {HTMLElement} square - The knight's square
 * @param {number} sqRow - The row of the knight
 * @param {number} sqCol - The column of the knight
 */
function handleBlackKnightSelect(square, sqRow, sqCol) {
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [rowOffset, colOffset] of knightMoves) {
    const newRow = sqRow + rowOffset;
    const newCol = sqCol + colOffset;
    
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = squares[newRow * 8 + newCol];
      
      if (target.textContent === "") {
        // Empty square
        target.classList.add("movelight");
      } else if (whitePieces.indexOf(target.textContent) !== -1) {
        // Opponent's piece
        target.classList.add("takelight");
      }
    }
  }
}

/**
 * Handles selecting a black bishop
 * @param {HTMLElement} square - The bishop's square
 * @param {number} sqRow - The row of the bishop
 * @param {number} sqCol - The column of the bishop
 */
function handleBlackBishopSelect(square, sqRow, sqCol) {
  // Highlight moves in all four diagonal directions
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  for (const [rowDir, colDir] of diagonals) {
    let newRow = sqRow + rowDir;
    let newCol = sqCol + colDir;
    
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const target = squares[newRow * 8 + newCol];
      
      if (target.textContent === "") {
        // Empty square
        target.classList.add("movelight");
      } else if (whitePieces.indexOf(target.textContent) !== -1) {
        // Opponent's piece
        target.classList.add("takelight");
        break;
      } else {
        // Own piece
        break;
      }
      
      newRow += rowDir;
      newCol += colDir;
    }
  }
}

/**
 * Handles selecting a black queen
 * @param {HTMLElement} square - The queen's square
 * @param {number} sqRow - The row of the queen
 * @param {number} sqCol - The column of the queen
 */
function handleBlackQueenSelect(square, sqRow, sqCol) {
  // Queen combines rook and bishop movements
  // First, add rook-like movements (horizontal and vertical)
  handleBlackRookSelect(square, sqRow, sqCol);
  
  // Then, add bishop-like movements (diagonals)
  handleBlackBishopSelect(square, sqRow, sqCol);
}
