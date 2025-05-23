// DOM Elements
const board = document.getElementById("chessboard");
console.log("Initial board DOM element:", board); // Diagnostic 1
const debugBox = document.getElementById("debug");
const gameStatus = document.getElementById("game-status");
const moveList = document.getElementById("move-list");
const whiteCaptured = document.getElementById("white-captured");
const blackCaptured = document.getElementById("black-captured");
const promotionModal = document.getElementById("promotion-modal");
const whiteTimeDisplay = document.getElementById("white-time");
const blackTimeDisplay = document.getElementById("black-time");
const whiteClockElement = document.querySelector(".white-clock");
const blackClockElement = document.querySelector(".black-clock");

// Game state constants
const PLAYER = {
  WHITE: 0,
  BLACK: 1
};

// Game mode constants
const GAME_MODE = {
  LOCAL: 'local',   // Local 2-player
  AI: 'ai',         // Playing against AI
  ONLINE: 'online'  // Playing online against another player
};

// Current game mode
let currentGameMode = GAME_MODE.LOCAL;

// Chess clock state
const CLOCK = {
  initialTime: 600, // 10 minutes in seconds
  whiteTime: 600,
  blackTime: 600,
  timerInterval: null,
  isRunning: false,
  activePlayer: PLAYER.WHITE, // Matches the initial turn value
  lowTimeThreshold: 60, // 1 minute in seconds
};

// Game state variables
let selectedSquare = null;
window.turn = PLAYER.WHITE; // Make turn globally accessible
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
  moveCount: 1,
  gameOver: false,
  check: false,
  checkmate: false,
  stalemate: false,
  fiftyMoveRule: false,
  insufficientMaterial: false,
  threefoldRepetition: false,
  castlingRightsSnapshot: null,
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
// Chess Clock Functions
// ===========================

/**
 * Formats time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (MM:SS)
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Updates the chess clock displays
 */
function updateClockDisplay() {
  whiteTimeDisplay.textContent = formatTime(CLOCK.whiteTime);
  blackTimeDisplay.textContent = formatTime(CLOCK.blackTime);
  
  // Add visual indicators
  whiteTimeDisplay.classList.toggle('low-time', CLOCK.whiteTime <= CLOCK.lowTimeThreshold);
  blackTimeDisplay.classList.toggle('low-time', CLOCK.blackTime <= CLOCK.lowTimeThreshold);
  
  // Highlight active clock
  whiteClockElement.classList.toggle('active-clock', CLOCK.activePlayer === PLAYER.WHITE);
  blackClockElement.classList.toggle('active-clock', CLOCK.activePlayer === PLAYER.BLACK);
}

/**
 * Starts the chess clock
 */
function startClock() {
  if (CLOCK.isRunning) return;
  
  CLOCK.timerInterval = setInterval(() => {
    if (CLOCK.activePlayer === PLAYER.WHITE) {
      CLOCK.whiteTime--;
      if (CLOCK.whiteTime <= 0) {
        handleTimeOut(PLAYER.WHITE);
      }
    } else {
      CLOCK.blackTime--;
      if (CLOCK.blackTime <= 0) {
        handleTimeOut(PLAYER.BLACK);
      }
    }
    updateClockDisplay();
  }, 1000);
  
  CLOCK.isRunning = true;
}

/**
 * Stops the chess clock
 */
function stopClock() {
  if (CLOCK.timerInterval) {
    clearInterval(CLOCK.timerInterval);
    CLOCK.timerInterval = null;
    CLOCK.isRunning = false;
  }
}

/**
 * Switches the active player on the clock
 */
function switchClock() {
  CLOCK.activePlayer = CLOCK.activePlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  updateClockDisplay();
}

/**
 * Handles the case when a player runs out of time
 * @param {number} player - The player who ran out of time (PLAYER.WHITE or PLAYER.BLACK)
 */
function handleTimeOut(player) {
  stopClock();
  gameState.gameOver = true;
  
  const winner = player === PLAYER.WHITE ? "Black" : "White";
  gameStatus.textContent = `Time's up! ${winner} wins by timeout!`;
  checkForEndOfGame(); // Update game state display for timeout
}

/**
 * Resets the chess clock to initial state
 */
function resetClock() {
  stopClock();
  CLOCK.whiteTime = CLOCK.initialTime;
  CLOCK.blackTime = CLOCK.initialTime;
  CLOCK.activePlayer = PLAYER.WHITE;
  updateClockDisplay();
}

// ===========================
// Board Setup Functions
// ===========================

/**
 * Creates the chessboard grid with event listeners
 */
function createChessboard() {
  console.log("createChessboard called. board DOM element:", board); // Diagnostic 2
  if (!board) {
    console.error("Chessboard DOM element 'chessboard' not found in createChessboard. Cannot create board.");
    return;
  }
  board.innerHTML = ''; 
  let DIsquareCount = 0; // Diagnostic
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("click", () => squareClick(square));
      board.appendChild(square);
      DIsquareCount++; // Diagnostic
    }
  }
  console.log("Number of squares created and appended in createChessboard:", DIsquareCount); // Diagnostic 3
  squares = document.querySelectorAll('.square'); 
  console.log("Number of .square elements found by querySelectorAll after createChessboard:", squares.length); // Diagnostic 4
}

/**
 * Places the initial pieces on the board
 */
function placePieces() {
  const initialSetup = [
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
    Array(8).fill("pawn"),
    ...Array(4).fill(Array(8).fill(null)), // Empty rows
    Array(8).fill("pawn"),
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
  ];

  if (!squares) {
    console.warn("placePieces: squares global variable is not set. Querying again.");
    squares = document.querySelectorAll('.square');
  }
  console.log("placePieces: Number of squares found:", squares ? squares.length : 0); // Diagnostic 5

  if (!squares || squares.length === 0) {
    console.error("placePieces: No squares found to place pieces on. Has createChessboard run successfully?");
    return;
  }
  
  squares.forEach((sq, index) => sq.textContent = ''); // Clear board first

  initialSetup.forEach((row, rowIndex) => {
    row.forEach((pieceType, colIndex) => {
      if (pieceType) {
        const square = squares[rowIndex * 8 + colIndex];
        const color = rowIndex < 4 ? "black" : "white"; // Black pieces on rows 0-1, White on 6-7
        square.textContent = pieces[color][pieceType];
      }
    });
  });
  // Reset king positions logically
  pieces.white.kingRow = 7; pieces.white.kingCol = 4;
  pieces.black.kingRow = 0; pieces.black.kingCol = 4;
  // Reset castling rights for new game
  gameState.whiteCanCastleKingside = true;
  gameState.whiteCanCastleQueenside = true;
  gameState.blackCanCastleKingside = true;
  gameState.blackCanCastleQueenside = true;
  gameState.enPassantTarget = null;
}

// ===========================
// UI Update Functions (Continued)
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
 * Updates the move history display using algebraic notation
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
 * @param {Object} move - The move object from gameState.moveHistory
 * @returns {string} The move in algebraic notation
 */
function algebraicNotation(move) {
  if (!move) return '';
  
  const files = 'abcdefgh';
  const ranks = '87654321'; // Rank 8 is at index 0
  
  const fromFile = files[move.from.col];
  const fromRank = ranks[move.from.row];
  const toFile = files[move.to.col];
  const toRank = ranks[move.to.row];
  
  let piece = '';
  const pieceSymbol = move.pieceMovedOriginal; // The symbol of the piece that moved

  if (pieceSymbol === pieces.white.king || pieceSymbol === pieces.black.king) piece = 'K';
  else if (pieceSymbol === pieces.white.queen || pieceSymbol === pieces.black.queen) piece = 'Q';
  else if (pieceSymbol === pieces.white.rook || pieceSymbol === pieces.black.rook) piece = 'R';
  else if (pieceSymbol === pieces.white.bishop || pieceSymbol === pieces.black.bishop) piece = 'B';
  else if (pieceSymbol === pieces.white.knight || pieceSymbol === pieces.black.knight) piece = 'N';
  // Pawns do not get a letter prefix unless capturing

  if (move.wasCastling) {
    return move.castlingDetails.side === 'kingside' ? 'O-O' : 'O-O-O';
  }
  
  const captureSymbol = (move.capturedPieceDirectly || move.wasEnPassantCapture) ? 'x' : '';
  
  let promotionSuffix = '';
  if (move.wasPromotion && move.promotedToPieceType) {
    let promotedPieceSymbol = '';
    switch (move.promotedToPieceType) {
      case 'queen': promotedPieceSymbol = 'Q'; break;
      case 'rook': promotedPieceSymbol = 'R'; break;
      case 'bishop': promotedPieceSymbol = 'B'; break;
      case 'knight': promotedPieceSymbol = 'N'; break;
    }
    promotionSuffix = `=${promotedPieceSymbol}`;
  }
  
  let checkSuffix = '';
  if (move.resultedInCheckmate) checkSuffix = '#';
  else if (move.resultedInCheck) checkSuffix = '+';

  // Disambiguation (simplified: not fully implemented for all complex cases)
  let disambiguation = ''; 

  if (piece === '') { // Pawn move
    return captureSymbol ? `${fromFile}x${toFile}${toRank}${promotionSuffix}${checkSuffix}` : `${toFile}${toRank}${promotionSuffix}${checkSuffix}`;
    } else {
    return `${piece}${disambiguation}${captureSymbol}${toFile}${toRank}${checkSuffix}`;
  }
}

// ===========================
// Piece Animation
// ===========================
/**
 * Creates a piece element that can be animated
 * @param {string} pieceText - The Unicode character for the piece
 * @param {HTMLElement} square - The square element to place the piece in
 * @returns {HTMLElement} The created piece element
 */
function createPieceElement(pieceText, square) {
  const piece = document.createElement('div');
  piece.className = 'piece-animation-clone'; // Use a distinct class
  piece.textContent = pieceText;
  // Style it to overlay correctly
  const rect = square.getBoundingClientRect();
  piece.style.position = 'fixed'; // Use fixed for viewport-relative positioning
  piece.style.left = `${rect.left}px`;
  piece.style.top = `${rect.top}px`;
  piece.style.width = `${rect.width}px`;
  piece.style.height = `${rect.height}px`;
  piece.style.display = 'flex';
  piece.style.alignItems = 'center';
  piece.style.justifyContent = 'center';
  // Attempt to match original square's font size, or use a default
  const cs = window.getComputedStyle(square);
  piece.style.fontSize = cs.fontSize || '2em'; 
  piece.style.zIndex = '1001'; // Ensure it's above other elements
  piece.style.pointerEvents = 'none'; // Prevent interaction with the clone
  document.body.appendChild(piece);
  return piece;
}

/**
 * Animates a piece's movement from one square to another
 * @param {HTMLElement} fromSquare - Starting square
 * @param {HTMLElement} toSquare - Destination square
 * @param {string} pieceText - The piece being moved
 * @returns {Promise} Resolves when animation is complete
 */
async function animatePieceMovement(fromSquare, toSquare, pieceText) {
  return new Promise(resolve => {
    if (!fromSquare || !toSquare || !pieceText) {
        console.warn("Animation skipped due to missing parameters", fromSquare, toSquare, pieceText);
        resolve();
        return;
    }
    const pieceClone = createPieceElement(pieceText, fromSquare);
    fromSquare.textContent = ''; // Visually clear original square earlier for smoother effect

    const toRect = toSquare.getBoundingClientRect();
    const currentRect = pieceClone.getBoundingClientRect(); // Get current position of the clone

    // Calculate the movement distance based on fixed positions
    const deltaX = toRect.left - currentRect.left;
    const deltaY = toRect.top - currentRect.top;
    
    pieceClone.style.transition = 'transform 0.3s ease-out';
    
    requestAnimationFrame(() => {
      pieceClone.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });

    pieceClone.addEventListener('transitionend', () => {
      pieceClone.remove();
      // The actual placement on toSquare happens in the move logic after animation
      resolve();
    }, { once: true });
  });
}

// ===========================
// Move Validation and Helpers
// ===========================

/**
 * Highlights an invalid move temporarily
 * @param {HTMLElement} square - The square to highlight
 */
function highlightInvalidMove(square) {
  if (!square) return;
  square.classList.add("invalidSquare");
  setTimeout(() => {
    square.classList.remove("invalidSquare");
  }, 150);
}

/**
 * Checks if a square is under attack by opponent pieces
 * @param {number} row - The row to check
 * @param {number} col - The column to check
 * @param {number} colorOfDefender - PLAYER.WHITE or PLAYER.BLACK (the color of the piece potentially being attacked on that square)
 * @returns {boolean} True if the square is under attack
 */
function isSquareUnderAttack(row, col, colorOfDefender) {
  const attackerColor = colorOfDefender === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  const attackerPieceSet = attackerColor === PLAYER.WHITE ? pieces.white : pieces.black;
  // const attackerSymbols = attackerColor === PLAYER.WHITE ? whitePieces : blackPieces; // Not directly used, using attackerPieceSet.pieceName

  // Check for pawn attacks
  // Pawn attacks depend on the attacker's color, so the direction is relative to the attacker
  const pawnAttackDirection = attackerColor === PLAYER.WHITE ? 1 : -1; 
  if (row - pawnAttackDirection >= 0 && row - pawnAttackDirection < 8) { // Check squares pawn could attack FROM
    if (col > 0 && squares[(row - pawnAttackDirection) * 8 + (col - 1)].textContent === attackerPieceSet.pawn) return true;
    if (col < 7 && squares[(row - pawnAttackDirection) * 8 + (col + 1)].textContent === attackerPieceSet.pawn) return true;
  }

  // Check for knight attacks
  const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (const [rowOffset, colOffset] of knightMoves) {
    const newRow = row + rowOffset;
    const newCol = col + colOffset;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      if (squares[newRow * 8 + newCol].textContent === attackerPieceSet.knight) return true;
    }
  }

  // Check for king attacks (for proximity, not for "check" itself, used for castling through check)
  const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  for (const [rowOffset, colOffset] of kingMoves) {
    const newRow = row + rowOffset;
    const newCol = col + colOffset;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      if (squares[newRow * 8 + newCol].textContent === attackerPieceSet.king) return true;
    }
  }

  // Check for rook/queen attacks (horizontal and vertical)
  const straightDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [rowDir, colDir] of straightDirections) {
    let newRow = row + rowDir;
    let newCol = col + colDir;
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const pieceOnSquare = squares[newRow * 8 + newCol].textContent;
      if (pieceOnSquare !== "") {
        if (pieceOnSquare === attackerPieceSet.rook || pieceOnSquare === attackerPieceSet.queen) return true;
        break;
      }
      newRow += rowDir;
      newCol += colDir;
    }
  }

  // Check for bishop/queen attacks (diagonals)
  const diagonalDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [rowDir, colDir] of diagonalDirections) {
    let newRow = row + rowDir;
    let newCol = col + colDir;
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const pieceOnSquare = squares[newRow * 8 + newCol].textContent;
      if (pieceOnSquare !== "") {
        if (pieceOnSquare === attackerPieceSet.bishop || pieceOnSquare === attackerPieceSet.queen) return true;
        break;
      }
      newRow += rowDir;
      newCol += colDir;
    }
  }
  return false;
}

/**
 * Checks if the king of the specified color is currently in check.
 * @param {number} kingColor - PLAYER.WHITE or PLAYER.BLACK.
 * @returns {boolean} True if the king is in check, false otherwise.
 */
function isKingInCheck(kingColor) {
  const kingData = kingColor === PLAYER.WHITE ? pieces.white : pieces.black;
  if(kingData.kingRow === undefined || kingData.kingCol === undefined) {
      console.error("King position undefined for color:", kingColor, kingData);
      // Try to find the king if its position is not tracked - this is a fallback
      for(let r=0; r<8; r++){
          for(let c=0; c<8; c++){
              if(squares[r*8+c].textContent === kingData.king){
                  kingData.kingRow = r;
                  kingData.kingCol = c;
                  console.warn("King position dynamically found. Ensure it is updated correctly.");
                  break;
              }
          }
          if(kingData.kingRow !== undefined) break;
      }
      if(kingData.kingRow === undefined) return true; // Assume check if king not found
  }
  return isSquareUnderAttack(kingData.kingRow, kingData.kingCol, kingColor);
}

// ===========================
// Move Generation and Legality
// ===========================

function getPseudoLegalMovesForPawn(square, sqRow, sqCol, pieceColor) {
  const moves = [];
  // const ownPieceSet = pieceColor === PLAYER.WHITE ? pieces.white : pieces.black; // Not needed directly
  const opponentPieces = pieceColor === PLAYER.WHITE ? blackPieces : whitePieces;
  const direction = pieceColor === PLAYER.WHITE ? -1 : 1;
  const startRow = pieceColor === PLAYER.WHITE ? 6 : 1;

  // Forward one square
  if (sqRow + direction >= 0 && sqRow + direction < 8 && squares[(sqRow + direction) * 8 + sqCol].textContent === "") {
    moves.push(squares[(sqRow + direction) * 8 + sqCol]);
    // Forward two squares (from starting position)
    if (sqRow === startRow && squares[(sqRow + 2 * direction) * 8 + sqCol].textContent === "") {
      moves.push(squares[(sqRow + 2 * direction) * 8 + sqCol]);
    }
  }
  // Diagonal captures
  for (let colOffset of [-1, 1]) {
    const newCol = sqCol + colOffset;
    if (newCol >= 0 && newCol < 8 && sqRow + direction >= 0 && sqRow + direction < 8) {
      const targetSquare = squares[(sqRow + direction) * 8 + newCol];
      if (targetSquare && opponentPieces.includes(targetSquare.textContent)) {
        moves.push(targetSquare);
      }
      // En passant
      if (gameState.enPassantTarget &&
          (sqRow + direction) === gameState.enPassantTarget.row &&
          newCol === gameState.enPassantTarget.col &&
          targetSquare.textContent === "") { // Target square must be empty for en-passant visualization
        moves.push(targetSquare);
      }
    }
  }
  return moves;
}

function getPseudoLegalMovesForRook(square, sqRow, sqCol, pieceColor) {
  const moves = [];
  const opponentPieces = pieceColor === PLAYER.WHITE ? blackPieces : whitePieces;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [rowDir, colDir] of directions) {
    let newRow = sqRow + rowDir;
    let newCol = sqCol + colDir;
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetSquare = squares[newRow * 8 + newCol];
      if (targetSquare.textContent === "") {
        moves.push(targetSquare);
      } else if (opponentPieces.includes(targetSquare.textContent)) {
        moves.push(targetSquare);
        break;
      } else { // Own piece
        break;
      }
      newRow += rowDir;
      newCol += colDir;
    }
  }
  return moves;
}

function getPseudoLegalMovesForKnight(square, sqRow, sqCol, pieceColor) {
  const moves = [];
  const ownPieces = pieceColor === PLAYER.WHITE ? whitePieces : blackPieces;
  const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

  for (const [rowOffset, colOffset] of knightMoves) {
    const newRow = sqRow + rowOffset;
    const newCol = sqCol + colOffset;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetSquare = squares[newRow * 8 + newCol];
      if (!ownPieces.includes(targetSquare.textContent)) { // Can move to empty or opponent's square
        moves.push(targetSquare);
      }
    }
  }
  return moves;
}

function getPseudoLegalMovesForBishop(square, sqRow, sqCol, pieceColor) {
  const moves = [];
  const opponentPieces = pieceColor === PLAYER.WHITE ? blackPieces : whitePieces;
  const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [rowDir, colDir] of diagonals) {
    let newRow = sqRow + rowDir;
    let newCol = sqCol + colDir;
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetSquare = squares[newRow * 8 + newCol];
      if (targetSquare.textContent === "") {
        moves.push(targetSquare);
      } else if (opponentPieces.includes(targetSquare.textContent)) {
        moves.push(targetSquare);
        break;
      } else { // Own piece
        break;
      }
      newRow += rowDir;
      newCol += colDir;
    }
  }
  return moves;
}

function getPseudoLegalMovesForQueen(square, sqRow, sqCol, pieceColor) {
  return [
    ...getPseudoLegalMovesForRook(square, sqRow, sqCol, pieceColor),
    ...getPseudoLegalMovesForBishop(square, sqRow, sqCol, pieceColor)
  ];
}

function getPseudoLegalMovesForKing(square, sqRow, sqCol, pieceColor) {
  const moves = [];
  const ownPieces = pieceColor === PLAYER.WHITE ? whitePieces : blackPieces;
  const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  for (const [rowOffset, colOffset] of kingMoves) {
    const newRow = sqRow + rowOffset;
    const newCol = sqCol + colOffset;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetSquare = squares[newRow * 8 + newCol];
      if (!ownPieces.includes(targetSquare.textContent)) {
        moves.push(targetSquare);
      }
    }
  }
  // Castling moves (pseudo-legal, legality check including 'not through check' is in isMoveLegal)
  const kingInitialRow = pieceColor === PLAYER.WHITE ? 7 : 0;
  const canCastleKingside = pieceColor === PLAYER.WHITE ? gameState.whiteCanCastleKingside : gameState.blackCanCastleKingside;
  const canCastleQueenside = pieceColor === PLAYER.WHITE ? gameState.whiteCanCastleQueenside : gameState.blackCanCastleQueenside;
  const rookPiece = pieceColor === PLAYER.WHITE ? pieces.white.rook : pieces.black.rook;

  if (sqRow === kingInitialRow && sqCol === 4) { // King is on its starting square
    if (canCastleKingside &&
        squares[kingInitialRow * 8 + 5].textContent === "" &&
        squares[kingInitialRow * 8 + 6].textContent === "" &&
        squares[kingInitialRow * 8 + 7].textContent === rookPiece) {
      moves.push(squares[kingInitialRow * 8 + 6]); // Target square for king
    }
    if (canCastleQueenside &&
        squares[kingInitialRow * 8 + 3].textContent === "" &&
        squares[kingInitialRow * 8 + 2].textContent === "" &&
        squares[kingInitialRow * 8 + 1].textContent === "" && // Note: B file also empty for queen-side
        squares[kingInitialRow * 8 + 0].textContent === rookPiece) {
      moves.push(squares[kingInitialRow * 8 + 2]); // Target square for king
    }
  }
  return moves;
}

function getPseudoLegalMovesForPiece(squareElement, pieceColor) {
  const pieceText = squareElement.textContent;
  const sqRow = parseInt(squareElement.dataset.row);
  const sqCol = parseInt(squareElement.dataset.col);

  if (pieceColor === PLAYER.WHITE) {
    if (pieceText === pieces.white.pawn) return getPseudoLegalMovesForPawn(squareElement, sqRow, sqCol, PLAYER.WHITE);
    if (pieceText === pieces.white.rook) return getPseudoLegalMovesForRook(squareElement, sqRow, sqCol, PLAYER.WHITE);
    if (pieceText === pieces.white.knight) return getPseudoLegalMovesForKnight(squareElement, sqRow, sqCol, PLAYER.WHITE);
    if (pieceText === pieces.white.bishop) return getPseudoLegalMovesForBishop(squareElement, sqRow, sqCol, PLAYER.WHITE);
    if (pieceText === pieces.white.queen) return getPseudoLegalMovesForQueen(squareElement, sqRow, sqCol, PLAYER.WHITE);
    if (pieceText === pieces.white.king) return getPseudoLegalMovesForKing(squareElement, sqRow, sqCol, PLAYER.WHITE);
  } else { // PLAYER.BLACK
    if (pieceText === pieces.black.pawn) return getPseudoLegalMovesForPawn(squareElement, sqRow, sqCol, PLAYER.BLACK);
    if (pieceText === pieces.black.rook) return getPseudoLegalMovesForRook(squareElement, sqRow, sqCol, PLAYER.BLACK);
    if (pieceText === pieces.black.knight) return getPseudoLegalMovesForKnight(squareElement, sqRow, sqCol, PLAYER.BLACK);
    if (pieceText === pieces.black.bishop) return getPseudoLegalMovesForBishop(squareElement, sqRow, sqCol, PLAYER.BLACK);
    if (pieceText === pieces.black.queen) return getPseudoLegalMovesForQueen(squareElement, sqRow, sqCol, PLAYER.BLACK);
    if (pieceText === pieces.black.king) return getPseudoLegalMovesForKing(squareElement, sqRow, sqCol, PLAYER.BLACK);
  }
  return [];
}

/**
 * Checks if a move is legal (i.e., does not leave the player's king in check).
 * @param {HTMLElement} fromSquareElement - The square the piece is moving from.
 * @param {HTMLElement} toSquareElement - The square the piece is moving to.
 * @param {number} playerColor - PLAYER.WHITE or PLAYER.BLACK.
 * @returns {boolean} True if the move is legal, false otherwise.
 */
function isMoveLegal(fromSquareElement, toSquareElement, playerColor) {
  if (!fromSquareElement || !toSquareElement) return false; // Basic check
  const movingPieceText = fromSquareElement.textContent;
  const capturedPieceText = toSquareElement.textContent; // Content of target square before move
  const fromRow = parseInt(fromSquareElement.dataset.row);
  const fromCol = parseInt(fromSquareElement.dataset.col);
  const toRow = parseInt(toSquareElement.dataset.row);
  const toCol = parseInt(toSquareElement.dataset.col);

  // Store original king position for restoration
  const kingData = playerColor === PLAYER.WHITE ? pieces.white : pieces.black;
  const originalKingRow = kingData.kingRow;
  const originalKingCol = kingData.kingCol;

  let enPassantVictimSquare = null;
  let originalEnPassantVictimPiece = null;
  let isCastlingMove = false;
  let castlingRookFromSquare = null, castlingRookToSquare = null, originalRookTargetSquarePiece = null;

  // --- Preliminary Castling Checks (Path, Rights, Not in Check) ---
  if (movingPieceText === kingData.king && Math.abs(fromCol - toCol) === 2) { // Potential castling
      isCastlingMove = true;
      const kingInitialRow = playerColor === PLAYER.WHITE ? 7 : 0;
      const rookPiece = playerColor === PLAYER.WHITE ? pieces.white.rook : pieces.black.rook;
      
      if (isKingInCheck(playerColor)) return false; // Cannot castle out of check

      if (toCol === 6) { // Kingside
          if (!( (playerColor === PLAYER.WHITE ? gameState.whiteCanCastleKingside : gameState.blackCanCastleKingside) &&
                 squares[kingInitialRow * 8 + 5].textContent === "" &&
                 squares[kingInitialRow * 8 + 6].textContent === "" && // King's landing square
                 squares[kingInitialRow * 8 + 7].textContent === rookPiece &&
                 !isSquareUnderAttack(kingInitialRow, 5, playerColor) && // Square king passes over (F1/F8)
                 !isSquareUnderAttack(kingInitialRow, 6, playerColor)    // King's landing square (G1/G8)
             )) return false;
          castlingRookFromSquare = squares[kingInitialRow * 8 + 7];
          castlingRookToSquare = squares[kingInitialRow * 8 + 5];
      } else { // Queenside (toCol === 2)
          if (!( (playerColor === PLAYER.WHITE ? gameState.whiteCanCastleQueenside : gameState.blackCanCastleQueenside) &&
                 squares[kingInitialRow * 8 + 1].textContent === "" && // B1/B8
                 squares[kingInitialRow * 8 + 2].textContent === "" && // C1/C8 (King's landing)
                 squares[kingInitialRow * 8 + 3].textContent === "" && // D1/D8
                 squares[kingInitialRow * 8 + 0].textContent === rookPiece &&
                 !isSquareUnderAttack(kingInitialRow, 3, playerColor) && // Square king passes over (D1/D8)
                 !isSquareUnderAttack(kingInitialRow, 2, playerColor)    // King's landing square (C1/C8)
             )) return false;
          castlingRookFromSquare = squares[kingInitialRow * 8 + 0];
          castlingRookToSquare = squares[kingInitialRow * 8 + 3];
      }
      if (castlingRookToSquare) originalRookTargetSquarePiece = castlingRookToSquare.textContent; // Should be empty
  }


  // --- Simulate the move ---
  toSquareElement.textContent = movingPieceText;
  fromSquareElement.textContent = "";

  if (movingPieceText === kingData.king) {
    kingData.kingRow = toRow;
    kingData.kingCol = toCol;
  }
  if (isCastlingMove && castlingRookFromSquare && castlingRookToSquare) {
    castlingRookToSquare.textContent = castlingRookFromSquare.textContent;
    castlingRookFromSquare.textContent = "";
  }
  // En passant simulation
  const pawnBeingMoved = playerColor === PLAYER.WHITE ? pieces.white.pawn : pieces.black.pawn;
  if (movingPieceText === pawnBeingMoved &&
      gameState.enPassantTarget &&
      toRow === gameState.enPassantTarget.row && toCol === gameState.enPassantTarget.col &&
      capturedPieceText === "") { // Target square for en-passant move itself is empty
    const victimPawnRow = playerColor === PLAYER.WHITE ? toRow + 1 : toRow - 1;
    enPassantVictimSquare = squares[victimPawnRow * 8 + toCol];
    if (enPassantVictimSquare) {
        originalEnPassantVictimPiece = enPassantVictimSquare.textContent;
        // Ensure the victim is actually an opponent's pawn
        const opponentPawn = playerColor === PLAYER.WHITE ? pieces.black.pawn : pieces.white.pawn;
        if (originalEnPassantVictimPiece === opponentPawn) {
        enPassantVictimSquare.textContent = "";
        } else {
            // This case should ideally not happen if enPassantTarget is set correctly
            enPassantVictimSquare = null; // Invalid en-passant if victim isn't there or isn't opponent pawn
            originalEnPassantVictimPiece = null;
        }
    }
  }

  // --- Check if king is in check after simulated move ---
  const kingNowInCheck = isKingInCheck(playerColor);

  // --- Undo the simulation ---
  fromSquareElement.textContent = movingPieceText;
  toSquareElement.textContent = capturedPieceText;
  kingData.kingRow = originalKingRow;
  kingData.kingCol = originalKingCol;

  if (isCastlingMove && castlingRookFromSquare && castlingRookToSquare) {
    castlingRookFromSquare.textContent = castlingRookToSquare.textContent; // Rook back to original
    castlingRookToSquare.textContent = originalRookTargetSquarePiece; // Restore empty or original content
  }
  if (enPassantVictimSquare && originalEnPassantVictimPiece) { // Only restore if it was removed
    enPassantVictimSquare.textContent = originalEnPassantVictimPiece;
  }
  
  return !kingNowInCheck;
}

function getAllLegalMovesForPlayer(playerColor) {
  const legalMoves = [];
  const playerPieceSet = playerColor === PLAYER.WHITE ? whitePieces : blackPieces;

  if (!squares) return []; // Guard if squares is not initialized

  for (let i = 0; i < squares.length; i++) {
    const fromSquareElement = squares[i];
    if (playerPieceSet.includes(fromSquareElement.textContent)) {
      const pseudoLegalTargetSquares = getPseudoLegalMovesForPiece(fromSquareElement, playerColor);
      for (const toSquareElement of pseudoLegalTargetSquares) {
        if (isMoveLegal(fromSquareElement, toSquareElement, playerColor)) {
          legalMoves.push({ from: fromSquareElement, to: toSquareElement });
        }
      }
    }
  }
  return legalMoves;
}

// ===========================
// Main Game Functions
// ===========================

/**
 * Entry point for the Chess application
 * Initializes the board and sets up event listeners
 */
function initChessApp() {
  console.log("initChessApp: Entered function."); // New Diagnostic A
  // Create chessboard and set up pieces
  console.log("initChessApp: About to call createChessboard and placePieces."); // New Diagnostic B
  createChessboard();
  placePieces();
  squares = document.querySelectorAll('.square');

  // Update the central state with the square DOM elements
  if (typeof window.updateState === 'function') {
    window.updateState({ squares: Array.from(squares) }); // Use Array.from to store a plain array
    console.log("SCRIPT_LOG: initChessApp - Updated central state with square DOM elements count:", squares.length);
  } else {
    console.error("SCRIPT_LOG: initChessApp - window.updateState is not available to update squares in central state.");
  }
  
  // Set up promotion modal handlers
  setupPromotionModal();
  
  // Set up undo button handler
  const undoButton = document.getElementById('undo-button');
  if (undoButton) {
    undoButton.addEventListener('click', undoMove);
  }
  
  // Check URL parameters for game mode
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get('mode');
  
  if (modeParam) {
    switch(modeParam) {
      case GAME_MODE.AI:
        currentGameMode = GAME_MODE.AI;
        // Auto-enable AI
        const aiToggle = document.getElementById('ai-toggle');
        if (aiToggle) {
          aiToggle.checked = true;
          if (typeof toggleAI === 'function') {
            console.log("SCRIPT_LOG: initChessApp - Auto-enabling AI due to URL param.");
            toggleAI(true); // Call from ai.js
          } else {
            console.error("SCRIPT_LOG: initChessApp - toggleAI function not found!");
          }
        }
        break;
      
      case GAME_MODE.ONLINE:
        currentGameMode = GAME_MODE.ONLINE;
        // Initialize multiplayer
        if (typeof initMultiplayer === 'function') {
          initMultiplayer();
        } else {
          console.error('Multiplayer module not loaded');
        }
        break;
      
      default:
        currentGameMode = GAME_MODE.LOCAL;
    }
  }
  
  // Update game status based on mode
  updateGameStatus();
  
  // Set up back to home link
  addBackToHomeLink();
}

/**
 * Add a back to home link to the page
 */
function addBackToHomeLink() {
  // Create a back link if it doesn't exist
  if (!document.getElementById('back-to-home')) {
    const backLink = document.createElement('a');
    backLink.id = 'back-to-home';
    backLink.href = 'home.html';
    backLink.textContent = '← Back to Home';
    backLink.className = 'back-link';
    
    // Insert it in a more structured way if possible, e.g., inside .container or at top of body
    const container = document.querySelector('.container') || document.body;
    container.prepend(backLink);
  }
}

/**
 * Sets up the event listeners for the promotion modal choices.
 */
function setupPromotionModal() {
    console.log("setupPromotionModal: Entered function. promotionModal DOM element:", promotionModal); // New Diagnostic C
    if (!promotionModal) {
        console.error("setupPromotionModal: promotionModal element not found! Cannot set up listeners.");
        return;
    }
    const promotionPiecesElements = promotionModal.querySelectorAll('.promotion-piece');
    promotionPiecesElements.forEach(pieceElement => {
        pieceElement.addEventListener('click', (e) => {
            const pieceType = e.target.dataset.piece;
            selectPromotionPiece(pieceType);
        });
    });
}

/**
 * Handles clicks on chessboard squares
 * @param {HTMLElement} square - The clicked square element
 */
async function squareClick(square) {
  // Don't allow moves if the game is over
  if (gameState.gameOver) return;
  
  // Online mode: only allow moves if it's the player's turn
  if (currentGameMode === GAME_MODE.ONLINE && window.MP && window.MP.onlineModeActive) {
    if ((window.MP.playerColor === PLAYER.WHITE && window.turn !== PLAYER.WHITE) ||
        (window.MP.playerColor === PLAYER.BLACK && window.turn !== PLAYER.BLACK)) {
      console.log("Not your turn in online mode");
      return;
    }
  }
  
  // Start the clock if it's the first move and game is not online (online game start handled by multiplayer.js)
  if (!CLOCK.isRunning && gameState.moveHistory.length === 0 && currentGameMode !== GAME_MODE.ONLINE && !gameState.gameOver) {
    startClock();
  }

  // AI mode: enforce proper turn and piece constraints
  if (currentGameMode === GAME_MODE.AI && window.aiActive) {
    // Don't allow human player to move if it's AI's turn (unless AI is making the move via isAIMakingMove flag)
    if (window.turn === window.aiColor && !window.isAIMakingMove) {
      console.log('Human click ignored: It is AI\'s turn.');
      return;
    }
    
    // In AI mode, the human player should only be able to move their color pieces
    // (opposite of AI color)
    const humanColor = window.aiColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    const pieceOnSquare = square.textContent;
    const humanPieces = humanColor === PLAYER.WHITE ? whitePieces : blackPieces;
    
    // If a piece is selected and it's not the human's turn, clear the selection
    if (selectedSquare && window.turn !== humanColor) {
      cleanupAfterMove();
      return;
    }
    
    // If trying to select a piece and it's not the human's color, ignore
    if (!selectedSquare && !humanPieces.includes(pieceOnSquare)) {
      console.log('Cannot select opponent or AI pieces in AI mode');
      return;
    }
  }

  const pieceOnSquare = square.textContent;
  const currentPlayerColor = window.turn;
  const currentPlayerPieces = currentPlayerColor === PLAYER.WHITE ? whitePieces : blackPieces;
  const opponentPieces = currentPlayerColor === PLAYER.WHITE ? blackPieces : whitePieces; // Not strictly needed here but good for clarity

  if (selectedSquare) { // A piece is already selected
    if (square === selectedSquare) { // Clicked selected square again
      cleanupAfterMove(); // Deselect
    } else if (currentPlayerPieces.includes(selectedSquare.textContent)) { // Own piece was selected
      // Check if the target square is highlighted as a valid move (movelight or takelight)
      if (square.classList.contains("movelight") || square.classList.contains("takelight")) {
        // isMoveLegal check is implicitly handled by the highlighting logic in handlePieceSelect
        // and re-verified within handlePieceMove simulation for safety.
        if (currentPlayerColor === PLAYER.WHITE) {
          await handleWhitePieceMove(square, parseInt(square.dataset.row), parseInt(square.dataset.col));
        } else {
          await handleBlackPieceMove(square, parseInt(square.dataset.row), parseInt(square.dataset.col));
        }
      } else { // Clicked an invalid target or another of own pieces
        if (currentPlayerPieces.includes(pieceOnSquare)) { // Clicked another of own pieces
            handlePieceSelect(square, currentPlayerColor); // Select the new piece
        } else { // Invalid move to a non-highlighted square
            highlightInvalidMove(square);
            // cleanupAfterMove(); // Optionally deselect, or allow re-selection
        }
      }
    }
  } else { // No piece is selected yet
    if (currentPlayerPieces.includes(pieceOnSquare)) { // Clicked on own piece
      handlePieceSelect(square, currentPlayerColor);
    } else {
      // Clicked on empty square or opponent's piece when no piece selected - do nothing
    }
  }
}

/**
 * Modified function to handle moves for white pieces
 * Also tracks moves for multiplayer
 * @param {HTMLElement} square - The target square
 */
async function moveWhite(square) {
  // Extract square coordinates
  const sqRow = parseInt(square.dataset.row);
  const sqCol = parseInt(square.dataset.col);
  
  // Get the index of the squares for multiplayer tracking (still useful for MP module)
  const fromIndex = Array.from(squares).indexOf(selectedSquare);
  const toIndex = Array.from(squares).indexOf(square);
  
  // The core move logic is now in handleWhitePieceMove -> handlePieceMove
  await handleWhitePieceMove(square, sqRow, sqCol); 
  
  // For online mode, send the move to the opponent
  // This is for regular moves. Promotion moves are sent by selectPromotionPiece after local processing.
  if (currentGameMode === GAME_MODE.ONLINE && window.MP && window.MP.onlineModeActive && typeof window.sendMove === 'function') {
    const lastMove = gameState.moveHistory[gameState.moveHistory.length -1];
    if (lastMove && !lastMove.wasPromotion) { // Ensure it was not a promotion (which is handled by selectPromotionPiece)
        // Send relevant part of the moveData. The MP module might only need from/to indices and promotion info.
        const onlineMoveData = {
            fromIndex: fromIndex,
            toIndex: toIndex,
            // Potentially add more from lastMove if needed by server, like piece, castling flags
            // For now, keeping it minimal as per the original MP design for `sendMove`
        };
        console.log("Sending move to opponent (via moveWhite):", onlineMoveData);
        window.sendMove(onlineMoveData); 
    }
  }
}

/**
 * Modified function to handle moves for black pieces
 * Also tracks moves for multiplayer
 * @param {HTMLElement} square - The target square
 */
async function moveBlack(square) {
  // Extract square coordinates
  const sqRow = parseInt(square.dataset.row);
  const sqCol = parseInt(square.dataset.col);
  
  const fromIndex = Array.from(squares).indexOf(selectedSquare);
  const toIndex = Array.from(squares).indexOf(square);
  
  await handleBlackPieceMove(square, sqRow, sqCol);
    
  if (currentGameMode === GAME_MODE.ONLINE && window.MP && window.MP.onlineModeActive && typeof window.sendMove === 'function') {
    const lastMove = gameState.moveHistory[gameState.moveHistory.length -1];
    if (lastMove && !lastMove.wasPromotion) {
        const onlineMoveData = {
            fromIndex: fromIndex,
            toIndex: toIndex,
        };
        console.log("Sending move to opponent (via moveBlack):", onlineMoveData);
        window.sendMove(onlineMoveData);
    }
  }
}

/**
 * Updates the game status display
 */
function updateGameStatus() {
  if (gameState.gameOver) {
    // Show game over status (check, checkmate, etc.)
    if (gameState.checkmate) {
      const winner = window.turn === PLAYER.WHITE ? "Black" : "White";
      gameStatus.textContent = `Checkmate! ${winner} wins!`;
    } else if (gameState.stalemate) {
      gameStatus.textContent = "Stalemate! Game drawn.";
    } else if (gameState.fiftyMoveRule) {
      gameStatus.textContent = "Draw by fifty-move rule.";
    } else if (gameState.insufficientMaterial) {
      gameStatus.textContent = "Draw by insufficient material.";
    } else if (gameState.threefoldRepetition) {
      gameStatus.textContent = "Draw by threefold repetition.";
    }
  } else {
    // Show current player's turn and check status
    const playerTurn = window.turn === PLAYER.WHITE ? "White" : "Black";
    const oppColor = window.turn === PLAYER.WHITE ? "black" : "white";
    
    if (gameState.check) {
      gameStatus.textContent = `${playerTurn} to move (in check)`;
    } else {
      // For online mode, show whose turn it is
      if (currentGameMode === GAME_MODE.ONLINE && window.MP && window.MP.onlineModeActive) {
        if ((window.MP.playerColor === PLAYER.WHITE && window.turn === PLAYER.WHITE) ||
            (window.MP.playerColor === PLAYER.BLACK && window.turn === PLAYER.BLACK)) {
          gameStatus.textContent = "Your turn to move";
        } else {
          gameStatus.textContent = "Opponent's turn to move";
        }
      } else {
        gameStatus.textContent = `${playerTurn} to move`;
      }
    }
  }
}

/**
 * Custom function to handle pawn promotion
 * @param {HTMLElement} fromSquare - The square the pawn moved from
 * @param {HTMLElement} toSquare - The square the pawn moved to
 * @param {number} playerColor - The color of the player (PLAYER.WHITE or PLAYER.BLACK)
 */
function handlePawnPromotion(fromSquare, toSquare, playerColor) {
  // Store promotion data for multiplayer
  pendingPromotion = {
    fromSquare: fromSquare,
    toSquare: toSquare,
    playerColor: playerColor,
    fromIndex: Array.from(squares).indexOf(fromSquare),
    toIndex: Array.from(squares).indexOf(toSquare)
  };
  
  // Show promotion selection UI
  showPromotionModal(playerColor, parseInt(toSquare.dataset.row), parseInt(toSquare.dataset.col), pendingPromotion);
}

/**
 * Handle promotion piece selection with multiplayer support
 * @param {string} pieceType - The type of piece to promote to (queen, rook, bishop, knight)
 */
function selectPromotionPiece(pieceType) {
  if (!pendingPromotion || !pendingPromotion.moveData) {
    console.error("Pending promotion or moveData is missing.");
    // Gracefully hide modal if something went wrong
    promotionModal.style.display = 'none';
    return;
  }
  
  const { fromSquare, toSquare, playerColor, fromIndex, toIndex, moveData } = pendingPromotion;
  const pieceSet = playerColor === PLAYER.WHITE ? pieces.white : pieces.black;
  
  let promotedPieceSymbol;
  switch(pieceType) {
    case 'queen': promotedPieceSymbol = pieceSet.queen; break;
    case 'rook': promotedPieceSymbol = pieceSet.rook; break;
    case 'bishop': promotedPieceSymbol = pieceSet.bishop; break;
    case 'knight': promotedPieceSymbol = pieceSet.knight; break;
    default: promotedPieceSymbol = pieceSet.queen; // Default to queen
  }
  
  // Update the board with the chosen piece
  toSquare.textContent = promotedPieceSymbol;
  
  // Finalize the moveData that was started in handlePieceMove
  moveData.promotedToPieceType = pieceType;
  // Ensure the pieceMovedOriginal in moveData is the pawn, if it was overwritten by a bug.
  // (handlePieceMove should set pieceMovedOriginal correctly as the pawn initially).

  // Push the now completed promotion move to history
  gameState.moveHistory.push(moveData);

  // For online mode, send the promotion choice
  if (currentGameMode === GAME_MODE.ONLINE && window.MP && window.MP.onlineModeActive && typeof window.sendMove === 'function') {
    const onlinePromotionData = { 
      fromIndex: fromIndex, // from pendingPromotion
      toIndex: toIndex,   // from pendingPromotion
      promotion: pieceType 
    };
    console.log("Sending promotion choice to opponent:", onlinePromotionData);
    window.sendMove(onlinePromotionData);
  }
  
  // Clean up promotion state
  pendingPromotion = null; // Clear pendingPromotion
  promotionModal.style.display = 'none';
  
  // Continue with game flow that was paused for promotion
  const newTurn = (playerColor === PLAYER.WHITE) ? PLAYER.BLACK : PLAYER.WHITE;
  window.turn = newTurn; // For legacy use
  CLOCK.activePlayer = newTurn; // Directly set clock's active player

  if (typeof window.updateState === 'function') {
    window.updateState({ turn: newTurn });
    console.log(`SCRIPT_LOG: selectPromotionPiece - Called window.updateState({ turn: ${newTurn} })`);
  } else {
    console.warn("SCRIPT_LOG: selectPromotionPiece - window.updateState is not a function. AI might not get correct turn.");
  }
  updateClockDisplay(); // Update clock display with the new active player
  // switchClock(); // Original call replaced
  
  // Update game state after promotion and turn switch
  const opponentColorNow = window.turn; // Current turn is now the opponent
  if (isKingInCheck(opponentColorNow)) {
      moveData.resultedInCheck = true; // Update the original moveData object
      const opponentLegalMoves = getAllLegalMovesForPlayer(opponentColorNow);
      if (opponentLegalMoves.length === 0) {
          moveData.resultedInCheckmate = true; // Update the original moveData object
      }
  } else {
      moveData.resultedInCheck = false;
      moveData.resultedInCheckmate = false;
  }

  updateMoveHistory(); // Update history display with algebraic notation including promotion
  checkForEndOfGame(); // This will call updateGameStatus and handle check/checkmate
  cleanupAfterMove(); // Clear selection highlights, update danger lights etc.
  
  // AI Turn Check if applicable
  console.log(`SCRIPT_LOG: selectPromotionPiece - After promotion. Current game mode: ${currentGameMode}, AI Active: ${window.aiActive}, Current turn: ${window.turn}, AI Color: ${window.aiColor}, Game Over: ${gameState.gameOver}`);
  if (currentGameMode === GAME_MODE.AI && window.aiActive && window.turn === window.aiColor && !gameState.gameOver) {
    if (typeof checkAITurn === 'function') {
        console.log("SCRIPT_LOG: selectPromotionPiece - Conditions met for AI turn. Calling checkAITurn.");
        setTimeout(checkAITurn, 100); // Small delay for UI to catch up
    } else {
        console.error("SCRIPT_LOG: selectPromotionPiece - checkAITurn function not found!");
    }
  } else {
    console.log("SCRIPT_LOG: selectPromotionPiece - Conditions NOT met for AI turn after promotion.");
  }
}


// ===========================
// Game Ending Logic
// ===========================
/**
 * Checks for checkmate or stalemate for the current player.
 * Updates game status and gameState.gameOver accordingly.
 */
function checkForEndOfGame() {
  const currentPlayer = window.turn;
  // const opponentPlayer = (currentPlayer === PLAYER.WHITE) ? PLAYER.BLACK : PLAYER.WHITE; // Not directly needed here

  // Update check status for current player
  gameState.check = isKingInCheck(currentPlayer);

  const legalMoves = getAllLegalMovesForPlayer(currentPlayer);

  if (legalMoves.length === 0) {
    gameState.gameOver = true;
    if (gameState.check) { // Current player is in check and has no legal moves
      gameState.checkmate = true;
      // gameStatus.textContent will be updated by updateGameStatus()
    } else { // No legal moves and not in check
      gameState.stalemate = true;
      // gameStatus.textContent will be updated by updateGameStatus()
    }
    stopClock(); // Stop clock on game end
  } else {
    gameState.gameOver = false;
    gameState.checkmate = false;
    gameState.stalemate = false;
  }
  // Other draw conditions (50-move, threefold repetition, insufficient material) would need more state tracking.
  updateGameStatus(); // Always update status after checking for end of game
}


// ===========================
// Detailed Piece Movement Handlers
// ===========================

function cleanupAfterMove() {
  if (selectedSquare) {
    selectedSquare.classList.remove("highlight");
  }
  squares.forEach(s => {
    s.classList.remove("movelight");
    s.classList.remove("takelight");
  });
  
  // Explicitly update dangerlight based on current check status for both kings
  const whiteKingSquare = squares[pieces.white.kingRow * 8 + pieces.white.kingCol];
  const blackKingSquare = squares[pieces.black.kingRow * 8 + pieces.black.kingCol];
  
  if (isKingInCheck(PLAYER.WHITE)) whiteKingSquare.classList.add("dangerlight");
  else whiteKingSquare.classList.remove("dangerlight");
  
  if (isKingInCheck(PLAYER.BLACK)) blackKingSquare.classList.add("dangerlight");
  else blackKingSquare.classList.remove("dangerlight");

  selectedSquare = null;
}

/**
 * General handler for selecting a piece.
 * @param {HTMLElement} square - The clicked square with the piece.
 * @param {number} pieceColor - PLAYER.WHITE or PLAYER.BLACK.
 */
function handlePieceSelect(square, pieceColor) {
    cleanupAfterMove(); // Clear previous highlights before new selection
    selectedSquare = square;
    square.classList.add("highlight");

    const pseudoLegalMoves = getPseudoLegalMovesForPiece(square, pieceColor);
    pseudoLegalMoves.forEach(targetSq => {
        if (isMoveLegal(square, targetSq, pieceColor)) {
            targetSq.classList.add(targetSq.textContent === "" ? "movelight" : "takelight");
        }
    });
}

async function handlePieceMove(fromSquare, toSquare, pieceColor) {
    const pieceText = fromSquare.textContent;
    const capturedText = toSquare.textContent;
    const fromRow = parseInt(fromSquare.dataset.row);
    const fromCol = parseInt(fromSquare.dataset.col);
    const toRow = parseInt(toSquare.dataset.row);
    const toCol = parseInt(toSquare.dataset.col);

    const moveData = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        pieceMovedOriginal: pieceText,
        capturedPieceDirectly: null, 
        wasPromotion: false,
        promotedToPieceType: null,
        wasCastling: false,
        castlingDetails: null,
        wasEnPassantCapture: false,
        enPassantVictimDetails: null,
        previousEnPassantTarget: gameState.enPassantTarget, 
        prevWhiteCanCastleKingside: gameState.whiteCanCastleKingside,
        prevWhiteCanCastleQueenside: gameState.whiteCanCastleQueenside,
        prevBlackCanCastleKingside: gameState.blackCanCastleKingside,
        prevBlackCanCastleQueenside: gameState.blackCanCastleQueenside,
        playerColor: pieceColor, 
        resultedInCheck: false, 
        resultedInCheckmate: false 
    };

    await animatePieceMovement(fromSquare, toSquare, pieceText);
    toSquare.textContent = pieceText; 
    // fromSquare.textContent = ""; // Already cleared by animatePieceMovement or earlier if desired

    if (capturedText !== "") {
        moveData.capturedPieceDirectly = capturedText;
        if (pieceColor === PLAYER.WHITE) gameState.capturedPieces.white.push(capturedText);
        else gameState.capturedPieces.black.push(capturedText);
    }
    
    if (pieceText === pieces.white.king) { pieces.white.kingRow = toRow; pieces.white.kingCol = toCol; }
    if (pieceText === pieces.black.king) { pieces.black.kingRow = toRow; pieces.black.kingCol = toCol; }

    if (pieceText === (pieceColor === PLAYER.WHITE ? pieces.white.king : pieces.black.king) && Math.abs(fromCol - toCol) === 2) {
        moveData.wasCastling = true;
        const kingInitialRow = pieceColor === PLAYER.WHITE ? 7 : 0;
        const rookToMoveSymbol = pieceColor === PLAYER.WHITE ? pieces.white.rook : pieces.black.rook;
        let rookFromSqElement, rookToSqElement;
        if (toCol === 6) { // Kingside
            rookFromSqElement = squares[kingInitialRow * 8 + 7];
            rookToSqElement = squares[kingInitialRow * 8 + 5];
            moveData.castlingDetails = { side: 'kingside', rookOriginalSquare: {row: kingInitialRow, col: 7}, rookNewSquare: {row: kingInitialRow, col: 5}};
        } else { // Queenside (toCol === 2)
            rookFromSqElement = squares[kingInitialRow * 8 + 0];
            rookToSqElement = squares[kingInitialRow * 8 + 3];
            moveData.castlingDetails = { side: 'queenside', rookOriginalSquare: {row: kingInitialRow, col: 0}, rookNewSquare: {row: kingInitialRow, col: 3}};
        }
        await animatePieceMovement(rookFromSqElement, rookToSqElement, rookToMoveSymbol); 
        rookToSqElement.textContent = rookToMoveSymbol;
        // rookFromSqElement.textContent = ""; // Should be cleared by its animation
    }

    if (pieceText === pieces.white.king) {
        gameState.whiteCanCastleKingside = false;
        gameState.whiteCanCastleQueenside = false;
    } else if (pieceText === pieces.black.king) {
        gameState.blackCanCastleKingside = false;
        gameState.blackCanCastleQueenside = false;
    } else if (pieceText === pieces.white.rook) {
        if (fromRow === 7 && fromCol === 0) gameState.whiteCanCastleQueenside = false;
        if (fromRow === 7 && fromCol === 7) gameState.whiteCanCastleKingside = false;
    } else if (pieceText === pieces.black.rook) {
        if (fromRow === 0 && fromCol === 0) gameState.blackCanCastleQueenside = false;
        if (fromRow === 0 && fromCol === 7) gameState.blackCanCastleKingside = false;
    }
    // If a rook is captured on its starting square, castling rights change.
    if (capturedText === pieces.white.rook && toRow === 7 && toCol === 0) gameState.whiteCanCastleQueenside = false;
    if (capturedText === pieces.white.rook && toRow === 7 && toCol === 7) gameState.whiteCanCastleKingside = false;
    if (capturedText === pieces.black.rook && toRow === 0 && toCol === 0) gameState.blackCanCastleQueenside = false;
    if (capturedText === pieces.black.rook && toRow === 0 && toCol === 7) gameState.blackCanCastleKingside = false;


    const pawnBeingMoved = pieceColor === PLAYER.WHITE ? pieces.white.pawn : pieces.black.pawn;
    if (pieceText === pawnBeingMoved && gameState.enPassantTarget &&
        toRow === gameState.enPassantTarget.row && toCol === gameState.enPassantTarget.col &&
        !capturedText) { 
        moveData.wasEnPassantCapture = true;
        const victimPawnRow = pieceColor === PLAYER.WHITE ? toRow + 1 : toRow - 1;
        const victimSquare = squares[victimPawnRow * 8 + toCol];
        moveData.enPassantVictimDetails = { piece: victimSquare.textContent, row: victimPawnRow, col: toCol };
        if (pieceColor === PLAYER.WHITE) gameState.capturedPieces.white.push(victimSquare.textContent);
        else gameState.capturedPieces.black.push(victimSquare.textContent);
        victimSquare.textContent = ""; 
    }

    if (pieceText === pawnBeingMoved && Math.abs(fromRow - toRow) === 2) {
        gameState.enPassantTarget = { row: (fromRow + toRow) / 2, col: toCol };
  } else {
        gameState.enPassantTarget = null;
    }
    
    const promotionRow = pieceColor === PLAYER.WHITE ? 0 : 7;
    if (pieceText === pawnBeingMoved && toRow === promotionRow) {
        moveData.wasPromotion = true;
        // Store the nearly complete moveData in pendingPromotion so selectPromotionPiece can finalize it.
        pendingPromotion.moveData = moveData; 
        // `handlePawnPromotion` (called by `moveWhite`/`moveBlack` wrapper) will trigger `showPromotionModal`.
        // The `showPromotionModal` itself doesn't need `moveData` passed directly if `pendingPromotion.moveData` is set.
        // `selectPromotionPiece` will then use `pendingPromotion.moveData`.
    }

    if (!moveData.wasPromotion) { 
        const newTurn = (pieceColor === PLAYER.WHITE) ? PLAYER.BLACK : PLAYER.WHITE;
        window.turn = newTurn; // For legacy use within script.js, if any
        CLOCK.activePlayer = newTurn; // Directly set clock's active player

        if (typeof window.updateState === 'function') {
            window.updateState({ turn: newTurn });
            console.log(`SCRIPT_LOG: handlePieceMove - Called window.updateState({ turn: ${newTurn} })`);
        } else {
            console.warn("SCRIPT_LOG: handlePieceMove - window.updateState is not a function. AI might not get correct turn.");
        }
        updateClockDisplay(); // Update clock display with the new active player
        // switchClock(); // Original call replaced by direct CLOCK.activePlayer set and updateClockDisplay()

        gameState.moveHistory.push(moveData); // Push non-promotion moves here
    } else {
        // For promotion moves, history push is deferred to `selectPromotionPiece`
        // after the piece is chosen, so `promotedToPieceType` is known.
    }
    
    const opponentPlayerColor = (pieceColor === PLAYER.WHITE) ? PLAYER.BLACK : PLAYER.WHITE;
    if (isKingInCheck(opponentPlayerColor)) {
        moveData.resultedInCheck = true;
        const opponentLegalMoves = getAllLegalMovesForPlayer(opponentPlayerColor);
        if (opponentLegalMoves.length === 0) {
            moveData.resultedInCheckmate = true;
        }
    }

    updateCapturedPieces();
    updateMoveHistory(); 
    cleanupAfterMove(); 
    
    // Send move to opponent if in multiplayer mode
    console.log('Checking multiplayer conditions:', {
        currentGameMode: currentGameMode,
        GAME_MODE_ONLINE: GAME_MODE.ONLINE,
        isMatchingMode: currentGameMode === GAME_MODE.ONLINE,
        MP: window.MP ? 'exists' : 'undefined',
        onlineActive: window.MP ? window.MP.onlineModeActive : 'N/A',
        socketConnected: window.MP && window.MP.socket ? window.MP.socket.connected : 'N/A',
        playerColor: window.MP ? window.MP.playerColor : 'N/A',
        pieceColor: pieceColor,
        sendMoveFunction: typeof window.sendMove === 'function' ? 'exists' : 'undefined'
    });
    
    if (currentGameMode === GAME_MODE.ONLINE && window.MP && window.MP.onlineModeActive && window.MP.socket) {
        console.log('Sending move to multiplayer system:', moveData);
        // Make sure we're only sending our own moves, not reflecting opponent's moves
        if ((window.MP.playerColor === PLAYER.WHITE && pieceColor === PLAYER.WHITE) ||
            (window.MP.playerColor === PLAYER.BLACK && pieceColor === PLAYER.BLACK)) {
            try {
                if (typeof window.sendMove !== 'function') {
                    console.error('sendMove function not available! Attempting to use fallback.');
                    if (window.MP.socket && window.MP.socket.emit) {
                        window.MP.socket.emit('make_move', {
                            roomId: window.MP.roomId,
                            move: `${moveData.pieceMovedOriginal},${moveData.from.row},${moveData.from.col},${moveData.to.row},${moveData.to.col}`
                        });
                        console.log('Used socket.emit fallback to send move');
                    } else {
                        console.error('No fallback available for sending moves!');
                    }
                } else {
                    // Call the multiplayer module's sendMove function
                    window.sendMove({
                        piece: moveData.pieceMovedOriginal,
                        from: moveData.from,
                        to: moveData.to
                    });
                    console.log('Move sent to multiplayer server via window.sendMove');
                }
            } catch (error) {
                console.error('Error sending move to multiplayer server:', error);
            }
        } else {
            console.log('Not sending move - opponent\'s move reflection');
        }
    }

    if (!moveData.wasPromotion) {
      checkForEndOfGame(); // This calls updateGameStatus internally
      // AI Turn Check (if AI is active and it's now AI's turn)
      console.log(`SCRIPT_LOG: handlePieceMove - After human move. Current game mode: ${currentGameMode}, AI Active: ${window.aiActive}, Current turn: ${window.turn}, AI Color: ${window.aiColor}, Game Over: ${gameState.gameOver}`);
      if (currentGameMode === GAME_MODE.AI && window.aiActive && window.turn === window.aiColor && !gameState.gameOver) {
        if (typeof checkAITurn === 'function') {
            console.log("SCRIPT_LOG: handlePieceMove - Conditions met for AI turn. Calling checkAITurn.");
            setTimeout(checkAITurn, 100); // Small delay for AI to process UI updates
        } else {
            console.error("SCRIPT_LOG: handlePieceMove - checkAITurn function not found!");
        }
      } else {
        console.log("SCRIPT_LOG: handlePieceMove - Conditions NOT met for AI turn after human move.");
      }
    } else {
        console.log("SCRIPT_LOG: handlePieceMove - Move was a promotion. AI turn check deferred to selectPromotionPiece.");
        // For promotions, checkForEndOfGame will be called by selectPromotionPiece
    }
}


async function handleWhitePieceMove(square, sqRow, sqCol) {
    await handlePieceMove(selectedSquare, square, PLAYER.WHITE);
}

async function handleBlackPieceMove(square, sqRow, sqCol) {
    await handlePieceMove(selectedSquare, square, PLAYER.BLACK);
}


// ===========================
// Pawn Promotion Modal
// ===========================
/**
 * Shows the pawn promotion modal
 * Assumes pendingPromotion is already set by handlePawnPromotion, which should include
 * fromSquare, toSquare, playerColor, fromIndex, toIndex, and the partial moveData object.
 */
function showPromotionModal(color, row, col) { 
  const whitePromos = document.querySelectorAll('.white-promotion');
  const blackPromos = document.querySelectorAll('.black-promotion');
  
  if (color === PLAYER.WHITE) {
    whitePromos.forEach(p => p.style.display = 'block');
    blackPromos.forEach(p => p.style.display = 'none');
  } else { // PLAYER.BLACK
    whitePromos.forEach(p => p.style.display = 'none');
    blackPromos.forEach(p => p.style.display = 'block');
  }
  promotionModal.style.display = 'flex';
}


// ===========================
// Undo Move Functionality
// ===========================
function performUndoMove() {
  if (gameState.moveHistory.length === 0) return;

  const lastMove = gameState.moveHistory.pop();
  const fromSq = squares[lastMove.from.row * 8 + lastMove.from.col];
  const toSq = squares[lastMove.to.row * 8 + lastMove.to.col];

  let pieceToRestore = lastMove.pieceMovedOriginal;
    if (lastMove.wasPromotion) {
      pieceToRestore = lastMove.playerColor === PLAYER.WHITE ? pieces.white.pawn : pieces.black.pawn;
  }
  fromSq.textContent = pieceToRestore;

  if (lastMove.capturedPieceDirectly && !lastMove.wasEnPassantCapture) {
      toSq.textContent = lastMove.capturedPieceDirectly;
      if (lastMove.playerColor === PLAYER.WHITE) gameState.capturedPieces.white.pop();
      else gameState.capturedPieces.black.pop();
  } else if (!lastMove.wasCastling && !lastMove.wasEnPassantCapture) { 
      toSq.textContent = "";
  }
  
  if (lastMove.pieceMovedOriginal === pieces.white.king) {
      pieces.white.kingRow = lastMove.from.row; pieces.white.kingCol = lastMove.from.col;
  } else if (lastMove.pieceMovedOriginal === pieces.black.king) {
      pieces.black.kingRow = lastMove.from.row; pieces.black.kingCol = lastMove.from.col;
  }

  if (lastMove.wasEnPassantCapture) {
      toSq.textContent = ""; 
      const victimDetails = lastMove.enPassantVictimDetails;
      squares[victimDetails.row * 8 + victimDetails.col].textContent = victimDetails.piece;
      if (lastMove.playerColor === PLAYER.WHITE) gameState.capturedPieces.white.pop();
      else gameState.capturedPieces.black.pop();
  }

  if (lastMove.wasCastling) {
      const kingInitialRow = lastMove.playerColor === PLAYER.WHITE ? 7 : 0;
      const rookSymbol = lastMove.playerColor === PLAYER.WHITE ? pieces.white.rook : pieces.black.rook;
      toSq.textContent = ""; 

      if (lastMove.castlingDetails.side === 'kingside') {
          squares[kingInitialRow * 8 + 7].textContent = rookSymbol; 
          squares[kingInitialRow * 8 + 5].textContent = "";       
      } else { // Queenside
          squares[kingInitialRow * 8 + 0].textContent = rookSymbol; 
          squares[kingInitialRow * 8 + 3].textContent = "";       
      }
  }

  gameState.enPassantTarget = lastMove.previousEnPassantTarget;
  gameState.whiteCanCastleKingside = lastMove.prevWhiteCanCastleKingside;
  gameState.whiteCanCastleQueenside = lastMove.prevWhiteCanCastleQueenside;
  gameState.blackCanCastleKingside = lastMove.prevBlackCanCastleKingside;
  gameState.blackCanCastleQueenside = lastMove.prevBlackCanCastleQueenside;
  
  window.turn = lastMove.playerColor; 
  CLOCK.activePlayer = window.turn; // Ensure clock active player is also reverted
  
  gameState.gameOver = false;
  gameState.checkmate = false;
  gameState.stalemate = false;
  
  updateCapturedPieces();
  updateMoveHistory();
  checkForEndOfGame(); 
  cleanupAfterMove(); 
  updateClockDisplay(); // Update clock display with new active player
  
  if (!CLOCK.isRunning && gameState.moveHistory.length > 0 && !gameState.gameOver) {
      startClock();
  }
}

function undoMove() {
  if (gameState.moveHistory.length === 0) return;
  if (currentGameMode === GAME_MODE.ONLINE) return; // No undo in online games for now

  let movesToUndo = 1;
  if (currentGameMode === GAME_MODE.AI && window.aiActive) {
    const lastMoveData = gameState.moveHistory[gameState.moveHistory.length - 1];
    // If AI just moved, and it was AI's turn, and there's a move before that (player's move)
    if (lastMoveData.playerColor === window.aiColor && gameState.moveHistory.length > 1) {
      movesToUndo = 2; // Undo AI's move and player's preceding move
    }
  }
  
  for (let i=0; i < movesToUndo; i++) {
      if (gameState.moveHistory.length > 0) performUndoMove();
  }

  if (currentGameMode === GAME_MODE.AI && window.aiActive && window.turn === window.aiColor && !gameState.gameOver) {
      if (typeof checkAITurn === 'function') {
          setTimeout(checkAITurn, 100); // Delay for AI to process UI updates
      }
  }
}

console.log("Script: Reached point before adding DOMContentLoaded listener."); // New Diagnostic D
// Initialize the app when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("Script: DOMContentLoaded event fired. About to call initChessApp."); // New Diagnostic E
  initChessApp();
});
