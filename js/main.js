/**
 * main.js - Main entry point for the chess application
 */

import { createChessboard, placePieces } from './board.js';
import { initClock, resetClock } from './ui/clock.js';
import { updateGameStatus } from './ui/status.js';
import { updateMoveHistory } from './ui/history.js';
import { 
  getState, 
  updateState, 
  resetState,
  PLAYER,
  setupWindowCompatibility
} from './state.js';
import { squareClick } from './moveHandler.js';
import { 
  initEngine, 
  checkAITurn 
} from './ai.js';

// Global settings for AI - these will be managed by state.js via setupWindowCompatibility
// window.aiActive = false;
// window.aiColor = 1; 
// window.aiDifficulty = 10;
// window.aiThinking = false;
// window.waitingForMove = false;
// window.isAIMakingMove = false;

/**
 * Initializes the chess application
 */
function initChess() {
  console.log('Initializing chess application...');
  
  // Setup window compatibility layer first, providing the squareClick handler
  setupWindowCompatibility(squareClick);
  
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
  // Reset game state using our centralized state management
  resetState();
  
  // Reset the board (remove all pieces)
  const state = getState();
  for (let i = 0; i < state.squares.length; i++) {
    state.squares[i].textContent = '';
    state.squares[i].classList.remove('highlight', 'movelight', 'takelight', 'dangerlight');
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
  const { ai } = getState();
  if (ai.active && ai.color === PLAYER.WHITE) {
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
    const aiActive = aiToggle.checked;
    
    // Update state
    updateState({ 'ai.active': aiActive });
    
    console.log(`AI toggled: ${aiActive}`);
    
    // Update UI elements
    const aiControls = document.getElementById('ai-controls');
    if (aiControls) {
      aiControls.style.display = aiActive ? 'block' : 'none';
    }
    
    // Initialize engine if toggling on
    if (aiActive && typeof window.initEngine === 'function') {
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
    const difficulty = parseInt(difficultySlider.value);
    
    // Update state
    updateState({ 'ai.difficulty': difficulty });
    
    // Update difficulty display
    const difficultyDisplay = document.getElementById('difficulty-display');
    if (difficultyDisplay) {
      let difficultyText = 'Medium';
      if (difficulty <= 3) {
        difficultyText = 'Easy';
      } else if (difficulty >= 12) {
        difficultyText = 'Hard';
      }
      difficultyDisplay.textContent = difficultyText;
    }
    
    // Update engine setting if available
    if (typeof window.setAIDifficulty === 'function') {
      window.setAIDifficulty(difficulty);
    }
  }
}

/**
 * Updates AI color based on select value
 */
function updateAIColor() {
  const colorSelect = document.getElementById('ai-color');
  if (colorSelect) {
    const aiColor = parseInt(colorSelect.value);
    
    // Update state
    updateState({ 'ai.color': aiColor });
    
    console.log(`AI color set to: ${aiColor === 0 ? 'White' : 'Black'}`);
    
    // Check if it's AI's turn now
    const state = getState();
    if (state.ai.active && typeof window.checkAITurn === 'function') {
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