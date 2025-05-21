/**
 * moveHandler.js - High-level move handling functionality
 */

import { PLAYER, gameState, pieces, whitePieces, blackPieces, CLOCK } from '../gameState.js';
import { moveWhite } from './whiteMoves.js';
import { moveBlack } from './blackMoves.js';
import { analyzeCheckPawnWhite, analyzeCheckPawnBlack, analyzeCheck } from './checkDetection.js';
import { startClock } from '../ui/clock.js';
import { updateGameStatus } from '../ui/status.js';

/**
 * Handles the click event on a chess square
 * @param {HTMLElement} square - The square that was clicked
 */
export async function squareClick(square) {
  console.log(`squareClick: Start of function. Current turn: ${gameState.turn === PLAYER.WHITE ? 'White' : 'Black'} (raw: ${gameState.turn})`);
  if (gameState.gameOver && !window.isAIMakingMove) return; // Allow AI to finish its move even if game just ended
  
  // Don't allow human player to move if it's AI's turn, unless AI is making the move
  if (window.aiActive && gameState.turn === window.aiColor && !window.isAIMakingMove) {
    console.log('Human click ignored: It is AI\'s turn.');
    return;
  }

  // Start the clock on the first move
  if (!CLOCK.isRunning && gameState.moveHistory.length === 0) {
    startClock();
  }

  if (gameState.turn === PLAYER.WHITE) {
    await moveWhite(square);
    analyzeCheckPawnBlack(pieces.black, whitePieces);
    analyzeCheck(pieces.black, pieces.white);
  } else {
    await moveBlack(square);
    analyzeCheckPawnWhite(pieces.white, pieces.black);
    analyzeCheck(pieces.white, pieces.black);
  }
  
  updateGameStatus(); // This will call checkAITurn if appropriate
  console.log(`squareClick: End of function. Turn should have flipped. Current turn: ${gameState.turn === PLAYER.WHITE ? 'White' : 'Black'}`);
}

// Expose squareClick to the global scope for ai.js
window.squareClick = squareClick;

/**
 * Switches the current turn between players
 */
export function switchTurn() {
  // Don't directly reassign the imported turn variable
  gameState.turn = gameState.turn === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  window.turn = gameState.turn; // Keep window.turn in sync
  console.log(`switchTurn: Turn switched to ${window.turn === PLAYER.WHITE ? 'White' : 'Black'}`);
} 