/**
 * board.js - Chess board creation and management
 */

import { PLAYER, pieces, gameState } from './gameState.js';
import { squareClick } from './moves/moveHandler.js';

/**
 * Creates the chessboard grid with event listeners
 */
export function createChessboard() {
  const board = document.getElementById("chessboard");
  gameState.squares = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("click", () => squareClick(square));
      board.appendChild(square);
      gameState.squares.push(square);
    }
  }
}

/**
 * Places the initial pieces on the board
 */
export function placePieces() {
  const allSquares = gameState.squares;
  
  const initialSetup = [
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
    Array(8).fill("pawn"),
    ...Array(4).fill(Array(8).fill(null)),
    Array(8).fill("pawn"),
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"],
  ];

  initialSetup.forEach((row, rowIndex) => {
    row.forEach((pieceType, colIndex) => {
      if (pieceType) {
        const square = allSquares[rowIndex * 8 + colIndex];
        const color = rowIndex < 4 ? "black" : "white";
        square.textContent = pieces[color][pieceType];
      }
    });
  });
}

/**
 * Creates an animated piece element that can be moved
 * @param {string} pieceText - The Unicode character for the piece
 * @param {HTMLElement} square - The square element to place the piece in
 * @returns {HTMLElement} The created piece element
 */
export function createPieceElement(pieceText, square) {
  const piece = document.createElement('div');
  piece.className = 'piece';
  piece.textContent = pieceText;
  square.appendChild(piece);
  return piece;
}

/**
 * Animates a piece's movement from one square to another
 * @param {HTMLElement} fromSquare - Starting square
 * @param {HTMLElement} toSquare - Destination square
 * @param {string} pieceText - The piece being moved
 * @returns {Promise} Resolves when animation is complete
 */
export function animatePieceMovement(fromSquare, toSquare, pieceText) {
  return new Promise(resolve => {
    // Create piece element for animation
    const piece = createPieceElement(pieceText, fromSquare);
    piece.classList.add('moving');

    // Calculate the movement distance
    const fromRect = fromSquare.getBoundingClientRect();
    const toRect = toSquare.getBoundingClientRect();
    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;

    // Start animation
    requestAnimationFrame(() => {
      piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });

    // Clean up after animation
    piece.addEventListener('transitionend', () => {
      piece.remove();
      resolve();
    }, { once: true });
  });
}

/**
 * Highlights an invalid move temporarily
 * @param {HTMLElement} square - The square to highlight
 */
export function highlightInvalidMove(square) {
  square.classList.add("invalidSquare");
  setTimeout(() => {
    square.classList.remove("invalidSquare");
  }, 150);
}

/**
 * Cleans up after a move is made
 */
export function cleanupAfterMove() {
  if (!window.selectedSquare) return;
  
  window.selectedSquare.classList.remove("highlight");
  for (let i = 0; i < 64; i++) {
    gameState.squares[i].classList.remove("movelight");
    gameState.squares[i].classList.remove("takelight");
  }
  
  // Remove dangerlight from both kings if they are no longer in check
  if (!pieces.white.checked) {
    const whiteKingSquare = gameState.squares[pieces.white.kingRow * 8 + pieces.white.kingCol];
    whiteKingSquare.classList.remove("dangerlight");
  }
  if (!pieces.black.checked) {
    const blackKingSquare = gameState.squares[pieces.black.kingRow * 8 + pieces.black.kingCol];
    blackKingSquare.classList.remove("dangerlight");
  }
  
  window.selectedSquare = null;
} 