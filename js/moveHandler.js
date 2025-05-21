/**
 * moveHandler.js - High-level move handling and coordination
 */

import { 
  getState, 
  updateState, 
  PLAYER, 
  pieces, 
  StateEvents, 
  subscribe 
} from './state.js';
import { highlightInvalidMove, cleanupAfterMove } from './board.js';
import { getValidMovesForSquare } from './moves/moveValidator.js';
import { makeMove } from './moves/moveExecutor.js';
import { isKingInCheck, isCheckmate, isStalemate } from './moves/checkDetection.js';
import { updateGameStatus } from './ui/status.js';
import { updateMoveHistory } from './ui/history.js';
import { updateCapturedPieces } from './ui/capturedPieces.js';

/**
 * Handles a square click event
 * @param {HTMLElement} square - The clicked square element
 */
export function squareClick(square) {
  // Get current state
  const state = getState();
  const { selectedSquare, turn, gameOver } = state;
  
  // Get piece and position information
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const index = row * 8 + col;
  const piece = square.textContent;
  
  // Ignore clicks if game is over
  if (gameOver) {
    console.log("Game is over, no more moves allowed");
    return;
  }
  
  // Ignore clicks if AI is making a move
  if (state.ai.isMakingMove) {
    console.log("AI is thinking, please wait");
    return;
  }
  
  // First click - Select a piece to move
  if (!selectedSquare) {
    handleFirstClick(square, piece, turn);
  } 
  // Second click - Attempt to move the selected piece
  else {
    handleSecondClick(square, selectedSquare, row, col);
  }
}

/**
 * Handles the first click (selecting a piece)
 * @param {HTMLElement} square - The clicked square
 * @param {string} piece - The piece on the square
 * @param {number} turn - Current turn (PLAYER.WHITE or PLAYER.BLACK)
 */
function handleFirstClick(square, piece, turn) {
  // Check if the clicked square contains a piece
  if (!piece) {
    console.log("No piece to select");
    return;
  }
  
  // Check if the clicked piece belongs to the current player
  const isPieceWhite = piece.charCodeAt(0) < 9900;
  if ((turn === PLAYER.WHITE && !isPieceWhite) || (turn === PLAYER.BLACK && isPieceWhite)) {
    console.log("Not your piece to move");
    highlightInvalidMove(square);
    return;
  }
  
  // Select the square and highlight it
  square.classList.add("highlight");
  updateState({ selectedSquare: square });
  
  // Display valid moves for the selected piece
  showValidMoves(square);
}

/**
 * Handles the second click (attempting to move)
 * @param {HTMLElement} targetSquare - The destination square
 * @param {HTMLElement} selectedSquare - The selected square with the piece
 * @param {number} row - Target row
 * @param {number} col - Target column
 */
function handleSecondClick(targetSquare, selectedSquare, row, col) {
  // If clicking the same square, deselect it
  if (targetSquare === selectedSquare) {
    cleanupAfterMove();
    return;
  }
  
  // Get selected piece info
  const selectedRow = parseInt(selectedSquare.dataset.row);
  const selectedCol = parseInt(selectedSquare.dataset.col);
  const selectedPiece = selectedSquare.textContent;
  
  // Check if the move is valid
  const validMoves = getValidMovesForSquare(selectedRow, selectedCol);
  const isValidMove = validMoves.some(move => move.row === row && move.col === col);
  
  if (isValidMove) {
    // Execute the move
    executeMove(selectedSquare, targetSquare, selectedRow, selectedCol, row, col);
  } else {
    // Handle invalid move
    console.log("Invalid move");
    highlightInvalidMove(targetSquare);
    
    // If clicked on own piece, select that piece instead
    const clickedPiece = targetSquare.textContent;
    if (clickedPiece) {
      const currentTurn = getState().turn;
      const isPieceWhite = clickedPiece.charCodeAt(0) < 9900;
      if ((currentTurn === PLAYER.WHITE && isPieceWhite) || (currentTurn === PLAYER.BLACK && !isPieceWhite)) {
        cleanupAfterMove();
        handleFirstClick(targetSquare, clickedPiece, currentTurn);
        return;
      }
    }
  }
}

/**
 * Executes a chess move
 * @param {HTMLElement} fromSquare - Starting square
 * @param {HTMLElement} toSquare - Destination square
 * @param {number} fromRow - Starting row
 * @param {number} fromCol - Starting column
 * @param {number} toRow - Destination row
 * @param {number} toCol - Destination column
 */
function executeMove(fromSquare, toSquare, fromRow, fromCol, toRow, toCol) {
  // Get current state and piece info
  const state = getState();
  const movingPiece = fromSquare.textContent;
  const capturedPiece = toSquare.textContent;
  
  // Execute the move
  makeMove(fromSquare, toSquare, fromRow, fromCol, toRow, toCol);
  
  // Clean up the board display
  cleanupAfterMove();
  
  // Update turn
  const newTurn = state.turn === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  updateState({ turn: newTurn });
  
  // Check for check, checkmate, or stalemate
  checkGameStatus();
  
  // Update UI elements
  updateGameStatus();
  updateMoveHistory();
  if (capturedPiece) {
    updateCapturedPieces();
  }
  
  // If AI is active and it's AI's turn, trigger AI move
  if (state.ai.active && state.ai.color === newTurn && typeof window.checkAITurn === 'function') {
    setTimeout(() => window.checkAITurn(), 250);
  }
}

/**
 * Shows valid moves for the selected piece
 * @param {HTMLElement} square - The selected square
 */
function showValidMoves(square) {
  const state = getState();
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  
  // Get valid moves for the selected piece
  const validMoves = getValidMovesForSquare(row, col);
  
  // Highlight valid moves
  validMoves.forEach(move => {
    const targetSquare = state.squares[move.row * 8 + move.col];
    if (targetSquare.textContent) {
      targetSquare.classList.add("takelight");
    } else {
      targetSquare.classList.add("movelight");
    }
  });
}

/**
 * Checks for check, checkmate, or stalemate after a move
 */
function checkGameStatus() {
  const state = getState();
  const { turn } = state;
  
  // Check if the opponent's king is in check
  const opponentColor = turn === PLAYER.WHITE ? 'black' : 'white';
  const kingInCheck = isKingInCheck(pieces[opponentColor].kingRow, pieces[opponentColor].kingCol, opponentColor);
  
  if (kingInCheck) {
    // Update check status
    pieces[opponentColor].checked = true;
    updateState({ check: true });
    
    // Highlight the king in check
    const kingSquare = state.squares[pieces[opponentColor].kingRow * 8 + pieces[opponentColor].kingCol];
    kingSquare.classList.add("dangerlight");
    
    // Check for checkmate
    if (isCheckmate(opponentColor)) {
      console.log(`Checkmate! ${turn === PLAYER.WHITE ? 'Black' : 'White'} wins!`);
      updateState({ 
        gameOver: true, 
        checkmate: true 
      });
    }
  } else {
    // Clear previous check status
    pieces.white.checked = false;
    pieces.black.checked = false;
    updateState({ check: false });
    
    // Check for stalemate
    if (isStalemate(opponentColor)) {
      console.log("Stalemate! The game is a draw.");
      updateState({ 
        gameOver: true, 
        stalemate: true 
      });
    }
  }
  
  // If game is over, stop the clock
  if (state.gameOver) {
    clearInterval(state.clock.timerInterval);
    updateState({ 'clock.isRunning': false });
  }
}

// Initialize event subscription for AI status
subscribe(StateEvents.AI_STATUS_CHANGE, handleAIStatusChange);

/**
 * Handles AI status changes
 * @param {Object} changes - State changes related to AI
 */
function handleAIStatusChange(changes) {
  const state = getState();
  // If AI was just turned on and it's AI's turn, trigger AI move
  if (changes.active && state.ai.active && state.turn === state.ai.color) {
    if (typeof window.checkAITurn === 'function') {
      setTimeout(() => window.checkAITurn(), 250);
    }
  }
}

// Export window-compatible functions for backward compatibility
window.squareClick = squareClick; 