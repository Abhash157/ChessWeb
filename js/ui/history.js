/**
 * history.js - Move history and capture display
 */

import { gameState, PLAYER } from '../gameState.js';

/**
 * Updates the move history display
 */
export function updateMoveHistory() {
  const moveHistoryElement = document.getElementById('move-history');
  if (!moveHistoryElement) return;
  
  // Clear current move history
  moveHistoryElement.innerHTML = '';
  
  // Create header row
  const headerRow = document.createElement('tr');
  const moveNumberHeader = document.createElement('th');
  moveNumberHeader.textContent = '#';
  const whiteHeader = document.createElement('th');
  whiteHeader.textContent = 'White';
  const blackHeader = document.createElement('th');
  blackHeader.textContent = 'Black';
  
  headerRow.appendChild(moveNumberHeader);
  headerRow.appendChild(whiteHeader);
  headerRow.appendChild(blackHeader);
  moveHistoryElement.appendChild(headerRow);
  
  // Group moves by pairs
  for (let i = 0; i < gameState.moveHistory.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = gameState.moveHistory[i] || '';
    const blackMove = gameState.moveHistory[i + 1] || '';
    
    const row = document.createElement('tr');
    
    const moveNumberCell = document.createElement('td');
    moveNumberCell.textContent = moveNumber;
    
    const whiteMoveCell = document.createElement('td');
    whiteMoveCell.textContent = whiteMove;
    whiteMoveCell.classList.add('white-move');
    
    const blackMoveCell = document.createElement('td');
    blackMoveCell.textContent = blackMove;
    blackMoveCell.classList.add('black-move');
    
    row.appendChild(moveNumberCell);
    row.appendChild(whiteMoveCell);
    row.appendChild(blackMoveCell);
    
    moveHistoryElement.appendChild(row);
  }
  
  // Scroll to the bottom of the history
  moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
  
  // Update captured pieces display
  updateCapturedPieces();
}

/**
 * Updates the display of captured pieces
 */
export function updateCapturedPieces() {
  const whiteCapturedElement = document.getElementById('white-captured');
  const blackCapturedElement = document.getElementById('black-captured');
  
  if (!whiteCapturedElement || !blackCapturedElement) return;
  
  // Clear current displays
  whiteCapturedElement.innerHTML = '';
  blackCapturedElement.innerHTML = '';
  
  // Add captured piece elements
  gameState.capturedPieces.white.forEach(piece => {
    const pieceElement = document.createElement('span');
    pieceElement.className = 'captured-piece';
    pieceElement.textContent = piece;
    whiteCapturedElement.appendChild(pieceElement);
  });
  
  gameState.capturedPieces.black.forEach(piece => {
    const pieceElement = document.createElement('span');
    pieceElement.className = 'captured-piece';
    pieceElement.textContent = piece;
    blackCapturedElement.appendChild(pieceElement);
  });
  
  // Calculate and display material advantage
  calculateMaterialAdvantage();
}

/**
 * Calculates and displays material advantage
 */
function calculateMaterialAdvantage() {
  const whiteCapturedElement = document.getElementById('white-captured');
  const blackCapturedElement = document.getElementById('black-captured');
  const whiteMaterialElement = document.getElementById('white-material');
  const blackMaterialElement = document.getElementById('black-material');
  
  if (!whiteMaterialElement || !blackMaterialElement) return;
  
  // Define piece values
  const pieceValues = {
    '♟': 1, // pawn
    '♞': 3, // knight
    '♝': 3, // bishop
    '♜': 5, // rook
    '♛': 9, // queen
    '♙': 1,
    '♘': 3,
    '♗': 3,
    '♖': 5,
    '♕': 9
  };
  
  // Calculate material value for each side
  let whiteCapturedValue = 0;
  let blackCapturedValue = 0;
  
  gameState.capturedPieces.white.forEach(piece => {
    whiteCapturedValue += pieceValues[piece] || 0;
  });
  
  gameState.capturedPieces.black.forEach(piece => {
    blackCapturedValue += pieceValues[piece] || 0;
  });
  
  // Calculate advantage
  const whiteAdvantage = blackCapturedValue - whiteCapturedValue;
  
  // Display advantage
  if (whiteAdvantage > 0) {
    whiteMaterialElement.textContent = `+${whiteAdvantage}`;
    whiteMaterialElement.classList.add('advantage');
    blackMaterialElement.textContent = '';
    blackMaterialElement.classList.remove('advantage');
  } else if (whiteAdvantage < 0) {
    blackMaterialElement.textContent = `+${Math.abs(whiteAdvantage)}`;
    blackMaterialElement.classList.add('advantage');
    whiteMaterialElement.textContent = '';
    whiteMaterialElement.classList.remove('advantage');
  } else {
    whiteMaterialElement.textContent = '';
    blackMaterialElement.textContent = '';
    whiteMaterialElement.classList.remove('advantage');
    blackMaterialElement.classList.remove('advantage');
  }
} 