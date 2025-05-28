/**
 * blackMoves.js - Handle black piece moves
 */

import { PLAYER, pieces, blackPieces, whitePieces, gameState } from '../gameState.js';
import { cleanupAfterMove, animatePieceMovement, highlightInvalidMove } from '../board.js';
import { switchTurn } from './moveHandler.js';
import { stopClock, switchClock } from '../ui/clock.js';
import { showPawnPromotionDialog } from '../ui/promotion.js';
import { updateMoveHistory } from '../ui/history.js';
import { checkForEndOfGame } from '../ui/status.js';

/**
 * Handles move logic for black pieces
 * @param {HTMLElement} square - The square clicked
 */
export async function moveBlack(square) {
  if (square.textContent !== "" && blackPieces.includes(square.textContent)) {
    // If the square contains a black piece, select it
    window.selectedSquare?.classList.remove("highlight");
    for (let i = 0; i < 64; i++) {
      gameState.squares[i].classList.remove("movelight");
      gameState.squares[i].classList.remove("takelight");
    }
    
    square.classList.add("highlight");
    window.selectedSquare = square;
    
    const sqRow = parseInt(square.dataset.row);
    const sqCol = parseInt(square.dataset.col);
    
    // Handle move options based on the selected piece
    if (square.textContent === pieces.black.pawn) {
      handleBlackPawnMoveOptions(sqRow, sqCol);
    } else if (square.textContent === pieces.black.knight) {
      handleBlackKnightMoveOptions(sqRow, sqCol);
    } else if (square.textContent === pieces.black.bishop) {
      handleBlackBishopMoveOptions(sqRow, sqCol);
    } else if (square.textContent === pieces.black.rook) {
      handleBlackRookMoveOptions(sqRow, sqCol);
    } else if (square.textContent === pieces.black.queen) {
      handleBlackQueenMoveOptions(sqRow, sqCol);
    } else if (square.textContent === pieces.black.king) {
      handleBlackKingMoveOptions(sqRow, sqCol);
    }
  } else if (window.selectedSquare) {
    // If a piece is already selected, try to move it
    await handleBlackPieceMove(square, parseInt(square.dataset.row), parseInt(square.dataset.col));
  }
}

/**
 * Executes the move of a black piece to the target square
 * @param {HTMLElement} square - Target square
 * @param {number} sqRow - Target row
 * @param {number} sqCol - Target column
 */
export async function handleBlackPieceMove(square, sqRow, sqCol) {
  if (square !== window.selectedSquare) {
    if (square.classList.contains("movelight") || square.classList.contains("takelight")) {
      const pieceText = window.selectedSquare.textContent; // Capture piece symbol BEFORE clearing
      const originalRow = parseInt(window.selectedSquare.dataset.row);
      const originalCol = parseInt(window.selectedSquare.dataset.col);
      
      // Handle special move: castling
      let moveData = { wasCastling: false, wasPawnPromotion: false, wasEnPassant: false };
      
      if (pieceText === pieces.black.king && Math.abs(sqCol - originalCol) === 2) {
        // Handle castling
        moveData = await handleBlackCastling(sqRow, sqCol, originalRow, originalCol);
      } else if (pieceText === pieces.black.pawn && sqRow === 7) {
        // Handle pawn promotion
        moveData = await handleBlackPawnPromotion(square, pieceText, originalRow, originalCol);
      } else if (pieceText === pieces.black.pawn && sqCol !== originalCol && square.textContent === "") {
        // Handle en passant capture
        moveData = await handleBlackEnPassant(square, pieceText, sqRow, sqCol, originalRow, originalCol);
      } else {
        // Standard move (capture or non-capture)
        await standardBlackMove(square, pieceText, sqRow, sqCol, originalRow, originalCol);
      }
      
      // After the move is completed
      updateMoveHistory();
      checkForEndOfGame();
      if (gameState.gameOver) {
        stopClock();
      }
      
      // Handle AI turn if needed
      if (typeof window.checkAITurn === 'function' && !gameState.gameOver) {
        console.log('handleBlackPieceMove: Explicitly calling checkAITurn');
        window.checkAITurn();
      }
    } else {
      // Invalid move attempt
      highlightInvalidMove(square);
    }
  }
}

/**
 * Handles standard black piece movement (non-special moves)
 * @param {HTMLElement} square - Target square
 * @param {string} pieceText - The piece being moved
 * @param {number} sqRow - Target row
 * @param {number} sqCol - Target column
 * @param {number} originalRow - Original row
 * @param {number} originalCol - Original column
 */
async function standardBlackMove(square, pieceText, sqRow, sqCol, originalRow, originalCol) {
  // Store move for history
  const moveNotation = createMoveNotation(pieceText, originalRow, originalCol, sqRow, sqCol, square.textContent !== "");
  gameState.moveHistory.push(moveNotation);
  
  // Capture logic
  if (square.textContent !== "" && whitePieces.includes(square.textContent)) {
    gameState.capturedPieces.black.push(square.textContent);
  }
  
  // Update king position if king moves
  if (pieceText === pieces.black.king) {
    pieces.black.kingRow = sqRow;
    pieces.black.kingCol = sqCol;
    
    // Update castling rights
    gameState.blackCanCastleKingside = false;
    gameState.blackCanCastleQueenside = false;
  }
  
  // Update rook castling rights if rook moves
  if (pieceText === pieces.black.rook) {
    if (originalRow === 0) {
      if (originalCol === 0) gameState.blackCanCastleQueenside = false;
      if (originalCol === 7) gameState.blackCanCastleKingside = false;
    }
  }
  
  // Animation
  await animatePieceMovement(window.selectedSquare, square, pieceText);
  
  // Actually move the piece
  square.textContent = pieceText;
  window.selectedSquare.textContent = "";
  
  // Remove 'dangerlight' from the king's original square if the king moved
  if (pieceText === pieces.black.king) {
    gameState.squares[originalRow * 8 + originalCol].classList.remove("dangerlight");
  }
  
  // If a pawn moved two squares, record for en passant
  if (pieceText === pieces.black.pawn && Math.abs(sqRow - originalRow) === 2) {
    gameState.lastPawnDoubleMove = { row: sqRow, col: sqCol, color: PLAYER.BLACK };
  } else {
    gameState.lastPawnDoubleMove = null;
  }
  
  // Switch turn and cleanup
  switchTurn();
  switchClock();
  cleanupAfterMove();
}

/**
 * Handle black pawn promotion
 * @param {HTMLElement} square - Target square
 * @param {string} pieceText - The pawn being promoted
 * @param {number} originalRow - Original row
 * @param {number} originalCol - Original column
 * @returns {Object} Move data
 */
async function handleBlackPawnPromotion(square, pieceText, originalRow, originalCol) {
  const sqRow = parseInt(square.dataset.row);
  const sqCol = parseInt(square.dataset.col);
  
  // Capture if there's a piece
  if (square.textContent !== "" && whitePieces.includes(square.textContent)) {
    gameState.capturedPieces.black.push(square.textContent);
  }
  
  // Animate pawn movement
  await animatePieceMovement(window.selectedSquare, square, pieceText);
  
  // Open promotion dialog and get choice
  const promotedPiece = await showPawnPromotionDialog(PLAYER.BLACK);
  
  // Update board
  square.textContent = promotedPiece;
  window.selectedSquare.textContent = "";
  
  // Create move notation with promotion
  const moveNotation = createMoveNotation(
    pieceText, 
    originalRow, 
    originalCol, 
    sqRow, 
    sqCol, 
    square.textContent !== ""
  ) + "=" + getPieceNotationSymbol(promotedPiece);
  
  gameState.moveHistory.push(moveNotation);
  
  // Switch turn and cleanup
  switchTurn();
  switchClock();
  cleanupAfterMove();
  
  return { wasPawnPromotion: true, promotedTo: promotedPiece };
}

/**
 * Handle castling for black king
 * @param {number} sqRow - Target row
 * @param {number} sqCol - Target column
 * @param {number} originalRow - Original row
 * @param {number} originalCol - Original column
 * @returns {Object} Castling details
 */
async function handleBlackCastling(sqRow, sqCol, originalRow, originalCol) {
  // Determine if kingside or queenside castling
  const isKingsideCastling = sqCol > originalCol;
  const castlingNotation = isKingsideCastling ? "O-O" : "O-O-O";
  gameState.moveHistory.push(castlingNotation);
  
  // Get rook position and new position
  const rookOriginalCol = isKingsideCastling ? 7 : 0;
  const rookNewCol = isKingsideCastling ? 5 : 3;
  
  const rookOriginalSquare = gameState.squares[originalRow * 8 + rookOriginalCol];
  const rookNewSquare = gameState.squares[originalRow * 8 + rookNewCol];
  const rookPiece = pieces.black.rook;
  
  // Move the king
  await animatePieceMovement(window.selectedSquare, gameState.squares[sqRow * 8 + sqCol], pieces.black.king);
  gameState.squares[sqRow * 8 + sqCol].textContent = pieces.black.king;
  window.selectedSquare.textContent = "";
  
  // Move the rook
  await animatePieceMovement(rookOriginalSquare, rookNewSquare, rookPiece);
  rookNewSquare.textContent = rookPiece;
  rookOriginalSquare.textContent = "";
  
  // Update king position
  pieces.black.kingRow = sqRow;
  pieces.black.kingCol = sqCol;
  
  // Update castling rights
  gameState.blackCanCastleKingside = false;
  gameState.blackCanCastleQueenside = false;
  
  // Switch turn and cleanup
  switchTurn();
  switchClock();
  cleanupAfterMove();
  
  return { 
    wasCastling: true, 
    castlingDetails: { 
      side: isKingsideCastling ? "kingside" : "queenside", 
      rookOriginalSquare: { row: originalRow, col: rookOriginalCol },
      rookNewSquare: { row: originalRow, col: rookNewCol }
    }
  };
}

/**
 * Handle en passant capture for black pawns
 * @param {HTMLElement} square - Target square
 * @param {string} pieceText - The pawn making the capture
 * @param {number} sqRow - Target row
 * @param {number} sqCol - Target column
 * @param {number} originalRow - Original row
 * @param {number} originalCol - Original column
 * @returns {Object} En passant details
 */
async function handleBlackEnPassant(square, pieceText, sqRow, sqCol, originalRow, originalCol) {
  // The target pawn is on the same row as the moving pawn but on the target column
  const capturedPawnSquare = gameState.squares[(originalRow) * 8 + sqCol];
  
  if (capturedPawnSquare.textContent === pieces.white.pawn) {
    // This is an en passant capture
    gameState.capturedPieces.black.push(pieces.white.pawn);
    
    // Create move notation with e.p. indicator
    const moveNotation = createMoveNotation(
      pieceText, 
      originalRow, 
      originalCol, 
      sqRow, 
      sqCol, 
      true
    ) + " e.p.";
    
    gameState.moveHistory.push(moveNotation);
    
    // Animate pawn movement
    await animatePieceMovement(window.selectedSquare, square, pieceText);
    
    // Update board - move the pawn and remove the captured pawn
    square.textContent = pieceText;
    window.selectedSquare.textContent = "";
    capturedPawnSquare.textContent = "";
    
    // Switch turn and cleanup
    switchTurn();
    switchClock();
    cleanupAfterMove();
    
    return { 
      wasEnPassant: true, 
      capturedPawnPosition: { row: originalRow, col: sqCol }
    };
  }
  
  return { wasEnPassant: false };
}

/**
 * Gets the algebraic notation symbol for a piece
 * @param {string} pieceUnicode - The Unicode character for the piece
 * @returns {string} The algebraic notation symbol
 */
function getPieceNotationSymbol(pieceUnicode) {
  const map = {
    [pieces.white.king]: "K",
    [pieces.white.queen]: "Q",
    [pieces.white.rook]: "R",
    [pieces.white.bishop]: "B",
    [pieces.white.knight]: "N",
    [pieces.white.pawn]: "",
    [pieces.black.king]: "K",
    [pieces.black.queen]: "Q",
    [pieces.black.rook]: "R",
    [pieces.black.bishop]: "B",
    [pieces.black.knight]: "N",
    [pieces.black.pawn]: ""
  };
  return map[pieceUnicode] || "";
}

/**
 * Creates algebraic notation for a move
 * @param {string} pieceText - The piece being moved
 * @param {number} fromRow - Starting row
 * @param {number} fromCol - Starting column
 * @param {number} toRow - Ending row
 * @param {number} toCol - Ending column
 * @param {boolean} isCapture - Whether the move is a capture
 * @returns {string} Algebraic notation for the move
 */
function createMoveNotation(pieceText, fromRow, fromCol, toRow, toCol, isCapture) {
  const pieceSymbol = getPieceNotationSymbol(pieceText);
  const fromSquare = String.fromCharCode(97 + fromCol) + (8 - fromRow);
  const toSquare = String.fromCharCode(97 + toCol) + (8 - toRow);
  const captureSymbol = isCapture ? "x" : "";
  
  return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}`;
}

// Move highlight functions for each piece type
function handleBlackPawnMoveOptions(row, col) {
  // Forward movement
  if (row < 7 && gameState.squares[(row + 1) * 8 + col].textContent === "") {
    gameState.squares[(row + 1) * 8 + col].classList.add("movelight");
    
    // Double move from starting position
    if (row === 1 && gameState.squares[(row + 2) * 8 + col].textContent === "") {
      gameState.squares[(row + 2) * 8 + col].classList.add("movelight");
    }
  }
  
  // Capture moves
  if (row < 7 && col > 0) {
    const diagLeftSquare = gameState.squares[(row + 1) * 8 + (col - 1)];
    if (whitePieces.includes(diagLeftSquare.textContent)) {
      diagLeftSquare.classList.add("takelight");
    }
  }
  
  if (row < 7 && col < 7) {
    const diagRightSquare = gameState.squares[(row + 1) * 8 + (col + 1)];
    if (whitePieces.includes(diagRightSquare.textContent)) {
      diagRightSquare.classList.add("takelight");
    }
  }
  
  // En passant
  if (row === 4 && gameState.lastPawnDoubleMove) {
    const lastMove = gameState.lastPawnDoubleMove;
    if (lastMove.color === PLAYER.WHITE && lastMove.row === 4) {
      if (lastMove.col === col - 1) {
        gameState.squares[(row + 1) * 8 + (col - 1)].classList.add("takelight");
      } else if (lastMove.col === col + 1) {
        gameState.squares[(row + 1) * 8 + (col + 1)].classList.add("takelight");
      }
    }
  }
}

function handleBlackKnightMoveOptions(row, col) {
  const knightMoves = [
    { row: row - 2, col: col - 1 },
    { row: row - 2, col: col + 1 },
    { row: row - 1, col: col - 2 },
    { row: row - 1, col: col + 2 },
    { row: row + 1, col: col - 2 },
    { row: row + 1, col: col + 2 },
    { row: row + 2, col: col - 1 },
    { row: row + 2, col: col + 1 }
  ];
  
  knightMoves.forEach(move => {
    if (move.row >= 0 && move.row < 8 && move.col >= 0 && move.col < 8) {
      const square = gameState.squares[move.row * 8 + move.col];
      if (square.textContent === "") {
        square.classList.add("movelight");
      } else if (whitePieces.includes(square.textContent)) {
        square.classList.add("takelight");
      }
    }
  });
}

function handleBlackBishopMoveOptions(row, col) {
  // Up-left diagonal
  for (let i = 1; i <= Math.min(row, col); i++) {
    const square = gameState.squares[(row - i) * 8 + (col - i)];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
  
  // Up-right diagonal
  for (let i = 1; i <= Math.min(row, 7 - col); i++) {
    const square = gameState.squares[(row - i) * 8 + (col + i)];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
  
  // Down-left diagonal
  for (let i = 1; i <= Math.min(7 - row, col); i++) {
    const square = gameState.squares[(row + i) * 8 + (col - i)];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
  
  // Down-right diagonal
  for (let i = 1; i <= Math.min(7 - row, 7 - col); i++) {
    const square = gameState.squares[(row + i) * 8 + (col + i)];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
}

function handleBlackRookMoveOptions(row, col) {
  // Upward
  for (let i = row - 1; i >= 0; i--) {
    const square = gameState.squares[i * 8 + col];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
  
  // Downward
  for (let i = row + 1; i < 8; i++) {
    const square = gameState.squares[i * 8 + col];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
  
  // Left
  for (let i = col - 1; i >= 0; i--) {
    const square = gameState.squares[row * 8 + i];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
  
  // Right
  for (let i = col + 1; i < 8; i++) {
    const square = gameState.squares[row * 8 + i];
    if (square.textContent === "") {
      square.classList.add("movelight");
    } else if (whitePieces.includes(square.textContent)) {
      square.classList.add("takelight");
      break;
    } else {
      break;
    }
  }
}

function handleBlackQueenMoveOptions(row, col) {
  // Queen combines rook and bishop movements
  handleBlackBishopMoveOptions(row, col);
  handleBlackRookMoveOptions(row, col);
}

function handleBlackKingMoveOptions(row, col) {
  // Regular king moves (one square in any direction)
  const kingMoves = [
    { row: row - 1, col: col - 1 },
    { row: row - 1, col: col },
    { row: row - 1, col: col + 1 },
    { row: row, col: col - 1 },
    { row: row, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col: col },
    { row: row + 1, col: col + 1 }
  ];
  
  kingMoves.forEach(move => {
    if (move.row >= 0 && move.row < 8 && move.col >= 0 && move.col < 8) {
      const square = gameState.squares[move.row * 8 + move.col];
      if (square.textContent === "") {
        square.classList.add("movelight");
      } else if (whitePieces.includes(square.textContent)) {
        square.classList.add("takelight");
      }
    }
  });
  
  // Castling options
  if (row === 0 && col === 4) {
    // Kingside castling
    if (gameState.blackCanCastleKingside && 
        gameState.squares[row * 8 + 5].textContent === "" && 
        gameState.squares[row * 8 + 6].textContent === "" &&
        !pieces.black.checked) {
      gameState.squares[row * 8 + 6].classList.add("movelight");
    }
    
    // Queenside castling
    if (gameState.blackCanCastleQueenside && 
        gameState.squares[row * 8 + 3].textContent === "" && 
        gameState.squares[row * 8 + 2].textContent === "" &&
        gameState.squares[row * 8 + 1].textContent === "" &&
        !pieces.black.checked) {
      gameState.squares[row * 8 + 2].classList.add("movelight");
    }
  }
} 