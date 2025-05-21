/**
 * status.js - Game status updates and end game detection
 */

import { getState, updateState, PLAYER, pieces, resetState } from '../state.js';
import { stopClock } from './clock.js';

/**
 * Updates the game status display
 */
export function updateGameStatus() {
  const state = getState();
  console.log('updateGameStatus: Start. Current turn:', state.turn === PLAYER.WHITE ? 'White' : 'Black');
  
  const gameStatus = document.getElementById('game-status');
  
  if (state.gameOver) {
    if (state.checkmate) {
      const winner = state.turn === PLAYER.WHITE ? 'Black' : 'White';
      gameStatus.textContent = `Checkmate! ${winner} wins!`;
      showGameOverScreen(`${winner} wins by checkmate!`);
    } else if (state.stalemate) {
      gameStatus.textContent = 'Stalemate! The game is a draw.';
      showGameOverScreen('Draw by stalemate!');
    } else if (state.insufficientMaterial) {
      gameStatus.textContent = 'Draw by insufficient material!';
      showGameOverScreen('Draw by insufficient material!');
    } else if (state.fiftyMoveRule) {
      gameStatus.textContent = 'Draw by fifty-move rule!';
      showGameOverScreen('Draw by fifty-move rule!');
    } else if (state.threefoldRepetition) {
      gameStatus.textContent = 'Draw by threefold repetition!';
      showGameOverScreen('Draw by threefold repetition!');
    }
  } else {
    // Update current player turn
    const currentPlayer = state.turn === PLAYER.WHITE ? 'White' : 'Black';
    
    if (state.check) {
      gameStatus.textContent = `${currentPlayer} to move. Check!`;
    } else {
      gameStatus.textContent = `${currentPlayer} to move.`;
    }
  }
  
  // Update check indicator
  if (pieces.white.checked) {
    const whiteKingSquare = state.squares[pieces.white.kingRow * 8 + pieces.white.kingCol];
    whiteKingSquare.classList.add("dangerlight");
  }
  
  if (pieces.black.checked) {
    const blackKingSquare = state.squares[pieces.black.kingRow * 8 + pieces.black.kingCol];
    blackKingSquare.classList.add("dangerlight");
  }
  
  console.log('updateGameStatus: End. Current turn:', state.turn === PLAYER.WHITE ? 'White' : 'Black');
}

/**
 * Shows the game over screen with the result
 * @param {string} message - The game result message to display
 */
export function showGameOverScreen(message) {
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('game-over-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    document.body.appendChild(overlay);
    
    // Style the overlay
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
  }
  
  // Create content container if it doesn't exist
  let container = document.getElementById('game-over-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-over-container';
    overlay.appendChild(container);
    
    // Style the container
    container.style.backgroundColor = 'white';
    container.style.padding = '2rem';
    container.style.borderRadius = '8px';
    container.style.textAlign = 'center';
    container.style.maxWidth = '80%';
  }
  
  // Set content
  container.innerHTML = `
    <h2>Game Over</h2>
    <p>${message}</p>
    <button id="new-game-button">New Game</button>
  `;
  
  // Style the button
  const button = document.getElementById('new-game-button');
  button.style.padding = '0.5rem 1rem';
  button.style.marginTop = '1rem';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  // Add event listener to the button
  button.addEventListener('click', () => {
    overlay.style.display = 'none';
    resetGame();
  });
  
  // Stop the clock
  stopClock();
  
  // Display the overlay
  overlay.style.display = 'flex';
}

/**
 * Checks for end of game conditions (checkmate, stalemate, etc.)
 */
export function checkForEndOfGame() {
  // Get current state
  const state = getState();
  
  // Reset game state flags
  updateState({
    checkmate: false,
    stalemate: false
  });
  
  // Check if the current player is in check
  const currentPlayerPieces = state.turn === PLAYER.WHITE ? pieces.white : pieces.black;
  const isInCheck = currentPlayerPieces.checked;
  updateState({ check: isInCheck });
  
  // Check if there are any legal moves
  const hasLegalMoves = checkForLegalMoves();
  
  // If there are no legal moves, it's either checkmate or stalemate
  if (!hasLegalMoves) {
    if (isInCheck) {
      updateState({ 
        checkmate: true,
        gameOver: true
      });
    } else {
      updateState({ 
        stalemate: true,
        gameOver: true
      });
    }
  }
  
  // TODO: Add checks for other draw conditions
  // - Insufficient material
  // - Fifty-move rule
  // - Threefold repetition
}

/**
 * Checks if the current player has any legal moves
 * @returns {boolean} True if there are legal moves, false otherwise
 */
function checkForLegalMoves() {
  // This is a simplified version - would need to be expanded for a complete implementation
  
  // For now, we'll assume there are always legal moves
  // In a real implementation, you would:
  // 1. Find all pieces of the current player
  // 2. For each piece, check all possible moves
  // 3. For each move, verify it doesn't leave the king in check
  // 4. If any valid move is found, return true
  
  return true; // Placeholder
}

/**
 * Resets the game to the initial state
 */
export function resetGame() {
  // Use our centralized reset function
  resetState();
  
  // Update the UI
  updateGameStatus();
} 