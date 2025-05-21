/**
 * promotion.js - Pawn promotion UI functionality
 */

import { PLAYER, pieces } from '../gameState.js';

/**
 * Shows the pawn promotion dialog and returns the selected piece
 * @param {number} player - The player promoting a pawn (PLAYER.WHITE or PLAYER.BLACK)
 * @returns {Promise<string>} A promise that resolves to the selected piece unicode
 */
export function showPawnPromotionDialog(player) {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'promotion-overlay';
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
    
    // Create container
    const container = document.createElement('div');
    container.id = 'promotion-container';
    overlay.appendChild(container);
    
    // Style the container
    container.style.backgroundColor = 'white';
    container.style.padding = '1rem';
    container.style.borderRadius = '8px';
    container.style.textAlign = 'center';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Promote pawn to:';
    container.appendChild(title);
    
    // Add options
    const options = document.createElement('div');
    options.style.display = 'flex';
    options.style.justifyContent = 'space-around';
    options.style.marginTop = '1rem';
    container.appendChild(options);
    
    // Define the pieces to show
    const promotionPieces = player === PLAYER.WHITE
      ? [pieces.white.queen, pieces.white.rook, pieces.white.bishop, pieces.white.knight]
      : [pieces.black.queen, pieces.black.rook, pieces.black.bishop, pieces.black.knight];
    
    // Create buttons for each piece
    promotionPieces.forEach(piece => {
      const pieceButton = document.createElement('div');
      pieceButton.className = 'promotion-piece';
      pieceButton.textContent = piece;
      pieceButton.style.fontSize = '3rem';
      pieceButton.style.width = '4rem';
      pieceButton.style.height = '4rem';
      pieceButton.style.display = 'flex';
      pieceButton.style.justifyContent = 'center';
      pieceButton.style.alignItems = 'center';
      pieceButton.style.cursor = 'pointer';
      pieceButton.style.border = '1px solid #ccc';
      pieceButton.style.borderRadius = '4px';
      pieceButton.style.margin = '0 0.5rem';
      
      // Add hover effect
      pieceButton.addEventListener('mouseover', () => {
        pieceButton.style.backgroundColor = '#f0f0f0';
      });
      
      pieceButton.addEventListener('mouseout', () => {
        pieceButton.style.backgroundColor = 'white';
      });
      
      // Add click handler
      pieceButton.addEventListener('click', () => {
        // Clean up and resolve
        document.body.removeChild(overlay);
        resolve(piece);
      });
      
      options.appendChild(pieceButton);
    });
  });
} 