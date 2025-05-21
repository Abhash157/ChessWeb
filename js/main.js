/**
 * main.js - Main entry point for the chess application
 */

import { createChessboard, placePieces } from './board.js';
import { initClock, resetClock } from './ui/clock.js';
import { updateGameStatus } from './ui/status.js';
import { updateMoveHistory } from './ui/history.js';
import { resetGameState } from './gameState.js';

// Global settings for AI
window.aiActive = false;
window.aiColor = 1; // Black by default
window.aiDifficulty = 10; // Medium difficulty by default
window.aiThinking = false;
window.waitingForMove = false;
window.isAIMakingMove = false;

/**
 * Initializes the chess application
 */
function initChess() {
  console.log('Initializing chess application...');
  
  // Create the chessboard
  createChessboard();
  
  // Place pieces on the board
  placePieces();
  
  // Initialize the clock
  initClock();
  
  // Initialize game status
  updateGameStatus();
  
  // Initialize move history
  updateMoveHistory();
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('Chess application initialized successfully.');
}

/**
 * Sets up event listeners for the application
 */
function setupEventListeners() {
  // New Game button
  const newGameButton = document.getElementById('new-game-button');
  if (newGameButton) {
    newGameButton.addEventListener('click', resetGame);
  }
  
  // AI toggle
  const aiToggle = document.getElementById('ai-toggle');
  if (aiToggle) {
    aiToggle.addEventListener('change', toggleAI);
  }
  
  // AI difficulty slider
  const aiDifficultySlider = document.getElementById('ai-difficulty');
  if (aiDifficultySlider) {
    aiDifficultySlider.addEventListener('input', updateAIDifficulty);
  }
  
  // AI color selection
  const aiColorSelect = document.getElementById('ai-color');
  if (aiColorSelect) {
    aiColorSelect.addEventListener('change', updateAIColor);
  }
}

/**
 * Resets the game to initial state
 */
function resetGame() {
  // Reset game state
  resetGameState();
  
  // Reset the board (remove all pieces)
  const squares = document.getElementsByClassName('square');
  for (let i = 0; i < squares.length; i++) {
    squares[i].textContent = '';
    squares[i].classList.remove('highlight', 'movelight', 'takelight', 'dangerlight');
  }
  
  // Place pieces in starting position
  placePieces();
  
  // Reset clock
  resetClock();
  
  // Reset game status
  updateGameStatus();
  
  // Reset move history
  updateMoveHistory();
  
  console.log('Game reset to initial state.');
  
  // If AI is active and playing as white, trigger AI move
  if (window.aiActive && window.aiColor === 0) {
    // Wait a bit before AI makes first move
    setTimeout(() => {
      if (typeof window.checkAITurn === 'function') {
        window.checkAITurn();
      }
    }, 500);
  }
}

/**
 * Toggles AI opponent on/off
 */
function toggleAI() {
  const aiToggle = document.getElementById('ai-toggle');
  if (aiToggle) {
    window.aiActive = aiToggle.checked;
    console.log(`AI toggled: ${window.aiActive}`);
    
    // Update UI elements
    const aiControls = document.getElementById('ai-controls');
    if (aiControls) {
      aiControls.style.display = window.aiActive ? 'block' : 'none';
    }
    
    // Initialize engine if toggling on
    if (window.aiActive && typeof window.initEngine === 'function') {
      window.initEngine();
      
      // Check if it's AI's turn already
      if (typeof window.checkAITurn === 'function') {
        window.checkAITurn();
      }
    }
  }
}

/**
 * Updates AI difficulty based on slider value
 */
function updateAIDifficulty() {
  const difficultySlider = document.getElementById('ai-difficulty');
  if (difficultySlider) {
    window.aiDifficulty = parseInt(difficultySlider.value);
    
    // Update difficulty display
    const difficultyDisplay = document.getElementById('difficulty-display');
    if (difficultyDisplay) {
      let difficultyText = 'Medium';
      if (window.aiDifficulty <= 3) {
        difficultyText = 'Easy';
      } else if (window.aiDifficulty >= 12) {
        difficultyText = 'Hard';
      }
      difficultyDisplay.textContent = difficultyText;
    }
    
    // Update engine setting if available
    if (typeof window.setAIDifficulty === 'function') {
      window.setAIDifficulty(window.aiDifficulty);
    }
  }
}

/**
 * Updates AI color based on select value
 */
function updateAIColor() {
  const colorSelect = document.getElementById('ai-color');
  if (colorSelect) {
    window.aiColor = parseInt(colorSelect.value);
    console.log(`AI color set to: ${window.aiColor === 0 ? 'White' : 'Black'}`);
    
    // Check if it's AI's turn now
    if (window.aiActive && typeof window.checkAITurn === 'function') {
      window.checkAITurn();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChess);

// Export functions for potential use in other modules
export {
  initChess,
  resetGame,
  toggleAI,
  updateAIDifficulty,
  updateAIColor
}; 