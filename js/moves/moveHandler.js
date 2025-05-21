/**
 * moveHandler.js - High-level move handling for backward compatibility
 * 
 * This module provides a bridge between the old move handling system
 * and the new centralized state management approach.
 */

import { getState, updateState, PLAYER, pieces } from '../state.js';
import { moveWhite } from './whiteMoves.js';
import { moveBlack } from './blackMoves.js';
import { analyzeCheckPawnWhite, analyzeCheckPawnBlack, analyzeCheck } from './checkDetection.js';
import { startClock } from '../ui/clock.js';
import { updateGameStatus } from '../ui/status.js';

/**
 * Handles the click event on a chess square for backward compatibility
 * @param {HTMLElement} square - The square that was clicked
 */
export async function squareClick(square) {
  const state = getState();
  console.log(`squareClick: Start of function. Current turn: ${state.turn === PLAYER.WHITE ? 'White' : 'Black'} (raw: ${state.turn})`);
  
  if (state.gameOver && !state.ai.isMakingMove) return; // Allow AI to finish its move even if game just ended
  
  // Don't allow human player to move if it's AI's turn, unless AI is making the move
  if (state.ai.active && state.turn === state.ai.color && !state.ai.isMakingMove) {
    console.log('Human click ignored: It is AI\'s turn.');
    return;
  }

  // Start the clock on the first move
  if (!state.clock.isRunning && state.moveHistory.length === 0) {
    startClock();
  }

  if (state.turn === PLAYER.WHITE) {
    await moveWhite(square);
    analyzeCheckPawnBlack(pieces.black, pieces.white);
    analyzeCheck(pieces.black, pieces.white);
  } else {
    await moveBlack(square);
    analyzeCheckPawnWhite(pieces.white, pieces.black);
    analyzeCheck(pieces.white, pieces.black);
  }
  
  updateGameStatus(); // This will call checkAITurn if appropriate
  console.log(`squareClick: End of function. Turn should have flipped. Current turn: ${getState().turn === PLAYER.WHITE ? 'White' : 'Black'}`);
}

/**
 * Switches the current turn between players
 */
export function switchTurn() {
  const currentTurn = getState().turn;
  const newTurn = currentTurn === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  updateState({ turn: newTurn });
  console.log(`switchTurn: Turn switched to ${newTurn === PLAYER.WHITE ? 'White' : 'Black'}`);
} 