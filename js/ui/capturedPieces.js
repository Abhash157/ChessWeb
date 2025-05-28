/**
 * capturedPieces.js - UI for displaying captured pieces
 */

import { getState } from '../state.js';

/**
 * Updates the captured pieces display
 */
export function updateCapturedPieces() {
  const state = getState();
  const { capturedPieces } = state;
  
  // Get container elements
  const whiteCapturedContainer = document.getElementById('white-captured-pieces');
  const blackCapturedContainer = document.getElementById('black-captured-pieces');
  
  if (!whiteCapturedContainer || !blackCapturedContainer) {
    createCapturedPiecesContainers();
    updateCapturedPieces(); // Call again after creating containers
    return;
  }
  
  // Clear existing displays
  whiteCapturedContainer.innerHTML = '';
  blackCapturedContainer.innerHTML = '';
  
  // Add captured pieces to the appropriate container
  capturedPieces.white.forEach(piece => {
    const pieceElement = document.createElement('span');
    pieceElement.textContent = piece;
    pieceElement.classList.add('captured-piece');
    whiteCapturedContainer.appendChild(pieceElement);
  });
  
  capturedPieces.black.forEach(piece => {
    const pieceElement = document.createElement('span');
    pieceElement.textContent = piece;
    pieceElement.classList.add('captured-piece');
    blackCapturedContainer.appendChild(pieceElement);
  });
  
  // Update the material advantage display
  updateMaterialAdvantage(capturedPieces);
}

/**
 * Creates the containers for displaying captured pieces if they don't exist
 */
function createCapturedPiecesContainers() {
  const gameInfo = document.querySelector('.game-info');
  
  if (!gameInfo) {
    console.error('Game info container not found');
    return;
  }
  
  // Create container for white captured pieces
  if (!document.getElementById('white-captured-pieces')) {
    const whiteContainer = document.createElement('div');
    whiteContainer.id = 'white-captured-pieces';
    whiteContainer.className = 'captured-pieces white-captured';
    
    const whiteLabel = document.createElement('div');
    whiteLabel.className = 'captured-label';
    whiteLabel.textContent = 'Captured by White:';
    
    const whiteWrapper = document.createElement('div');
    whiteWrapper.className = 'captured-wrapper';
    whiteWrapper.appendChild(whiteLabel);
    whiteWrapper.appendChild(whiteContainer);
    
    gameInfo.appendChild(whiteWrapper);
  }
  
  // Create container for black captured pieces
  if (!document.getElementById('black-captured-pieces')) {
    const blackContainer = document.createElement('div');
    blackContainer.id = 'black-captured-pieces';
    blackContainer.className = 'captured-pieces black-captured';
    
    const blackLabel = document.createElement('div');
    blackLabel.className = 'captured-label';
    blackLabel.textContent = 'Captured by Black:';
    
    const blackWrapper = document.createElement('div');
    blackWrapper.className = 'captured-wrapper';
    blackWrapper.appendChild(blackLabel);
    blackWrapper.appendChild(blackContainer);
    
    gameInfo.appendChild(blackWrapper);
  }
  
  // Create container for material advantage
  if (!document.getElementById('material-advantage')) {
    const advantageContainer = document.createElement('div');
    advantageContainer.id = 'material-advantage';
    advantageContainer.className = 'material-advantage';
    gameInfo.appendChild(advantageContainer);
  }
  
  // Add CSS for captured pieces
  addCapturedPiecesCSS();
}

/**
 * Adds CSS rules for captured pieces display
 */
function addCapturedPiecesCSS() {
  const styleId = 'captured-pieces-style';
  
  // Don't add styles if they already exist
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .captured-wrapper {
      margin: 10px 0;
    }
    
    .captured-label {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .captured-pieces {
      display: flex;
      flex-wrap: wrap;
      min-height: 30px;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .captured-piece {
      font-size: 20px;
      padding: 2px;
    }
    
    .material-advantage {
      font-weight: bold;
      text-align: center;
      margin: 10px 0;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Calculates and displays the material advantage
 * @param {Object} capturedPieces - Object containing captured pieces
 */
function updateMaterialAdvantage(capturedPieces) {
  const advantageContainer = document.getElementById('material-advantage');
  
  if (!advantageContainer) {
    return;
  }
  
  // Calculate material value (approximate)
  const whiteMaterial = calculateMaterialValue(capturedPieces.white);
  const blackMaterial = calculateMaterialValue(capturedPieces.black);
  const advantage = blackMaterial - whiteMaterial;
  
  if (advantage > 0) {
    advantageContainer.textContent = `White is ahead by ${advantage}`;
    advantageContainer.style.color = '#0066cc';
  } else if (advantage < 0) {
    advantageContainer.textContent = `Black is ahead by ${Math.abs(advantage)}`;
    advantageContainer.style.color = '#cc0000';
  } else {
    advantageContainer.textContent = 'Material is even';
    advantageContainer.style.color = '#000000';
  }
}

/**
 * Calculates the material value of captured pieces
 * @param {Array} pieces - Array of captured pieces
 * @returns {number} Total material value
 */
function calculateMaterialValue(pieces) {
  let value = 0;
  
  pieces.forEach(piece => {
    // Piece values: pawn = 1, knight/bishop = 3, rook = 5, queen = 9
    const pieceType = piece.charCodeAt(0);
    
    // Check for white pieces
    if (pieceType < 9820) {
      if (pieceType === 9817) value += 1;      // Pawn
      else if (pieceType === 9816) value += 3; // Knight
      else if (pieceType === 9815) value += 3; // Bishop
      else if (pieceType === 9814) value += 5; // Rook
      else if (pieceType === 9813) value += 9; // Queen
    } else {
      // Black pieces
      if (pieceType === 9823) value += 1;      // Pawn
      else if (pieceType === 9822) value += 3; // Knight
      else if (pieceType === 9821) value += 3; // Bishop
      else if (pieceType === 9820) value += 5; // Rook
      else if (pieceType === 9819) value += 9; // Queen
    }
  });
  
  return value;
} 