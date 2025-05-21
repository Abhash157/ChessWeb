/**
 * checkDetection.js - Check detection logic
 */

import { gameState } from '../gameState.js';

/**
 * Checks if a pawn is putting the white king in check
 * @param {Object} piece - The player's king piece
 * @param {Array} opp - The opponent's pieces
 */
export function analyzeCheckPawnWhite(piece, opp) {
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (
    kingRow > 0 &&
    ((gameState.squares[(kingRow - 1) * 8 + (kingCol - 1)].textContent === opp.pawn &&
      kingCol > 0) ||
      (gameState.squares[(kingRow - 1) * 8 + (kingCol + 1)].textContent === opp.pawn &&
        kingCol < 7))
  ) {
    piece.checked = true;
    gameState.squares[kingRow * 8 + kingCol].classList.add("dangerlight");
  } else {
    piece.checked = false;
  }
}

/**
 * Checks if a pawn is putting the black king in check
 * @param {Object} piece - The player's king piece
 * @param {Array} opp - The opponent's pieces
 */
export function analyzeCheckPawnBlack(piece, opp) {
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (
    (kingRow < 7 &&
      gameState.squares[(kingRow + 1) * 8 + (kingCol - 1)].textContent === opp.pawn &&
      kingCol > 0) ||
    (gameState.squares[(kingRow + 1) * 8 + (kingCol + 1)].textContent === opp.pawn &&
      kingCol < 7)
  ) {
    piece.checked = true;
    gameState.squares[kingRow * 8 + kingCol].classList.add("dangerlight");
  } else {
    piece.checked = false;
  }
}

/**
 * Analyzes if a king is in check from any piece
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 */
export function analyzeCheck(piece, opp) {
  const row = piece.kingRow;
  const col = piece.kingCol;
  piece.checked = false;
  
  // Check for rook or queen attacks (horizontal/vertical)
  checkRookAttacks(piece, opp, row, col);
  
  // Check for knight attacks
  checkKnightAttacks(piece, opp, row, col);
  
  // Check for bishop or queen attacks (diagonal)
  checkBishopAttacks(piece, opp, row, col);
}

/**
 * Check if a rook or queen is attacking the king horizontally/vertically
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 * @param {number} row - King's row
 * @param {number} col - King's column
 */
export function checkRookAttacks(piece, opp, row, col) {
  // Check upwards
  for (let i = 1; i <= row; i++) {
    if (gameState.squares[(row - i) * 8 + col].textContent === opp.rook ||
        gameState.squares[(row - i) * 8 + col].textContent === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (gameState.squares[(row - i) * 8 + col].textContent !== "") {
      break;
    }
  }
  
  // Check downwards
  for (let i = row + 1; i <= 7; i++) {
    if (gameState.squares[i * 8 + col].textContent === opp.rook ||
        gameState.squares[i * 8 + col].textContent === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (gameState.squares[i * 8 + col].textContent !== "") {
      break;
    }
  }
  
  // Check left
  for (let i = 1; i <= col; i++) {
    if (gameState.squares[row * 8 + (col - i)].textContent === opp.rook ||
        gameState.squares[row * 8 + (col - i)].textContent === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (gameState.squares[row * 8 + (col - i)].textContent !== "") {
      break;
    }
  }
  
  // Check right
  for (let i = col + 1; i <= 7; i++) {
    if (gameState.squares[row * 8 + i].textContent === opp.rook ||
        gameState.squares[row * 8 + i].textContent === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (gameState.squares[row * 8 + i].textContent !== "") {
      break;
    }
  }
}

/**
 * Check if a knight is attacking the king
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 * @param {number} row - King's row
 * @param {number} col - King's column
 */
export function checkKnightAttacks(piece, opp, row, col) {
  const nRow = [row - 1, row + 1];
  const nRow2 = [row - 2, row + 2];
  const nCol = [col - 1, col + 1];
  const nCol2 = [col - 2, col + 2];

  // Check all knight move patterns
  nRow.forEach((knightRow) => {
    nCol2.forEach((knightCol) => {
      if (
        knightRow * 8 + knightCol < 64 &&
        knightRow * 8 + knightCol >= 0 &&
        knightCol <= 7 &&
        knightCol >= 0 &&
        gameState.squares[knightRow * 8 + knightCol].textContent === opp.knight
      ) {
        piece.checked = true;
        gameState.squares[row * 8 + col].classList.add("dangerlight");
      }
    });
  });
  
  nRow2.forEach((knightRow) => {
    nCol.forEach((knightCol) => {
      if (
        knightRow * 8 + knightCol <= 63 &&
        knightRow * 8 + knightCol >= 0 &&
        knightCol <= 7 &&
        knightCol >= 0 &&
        gameState.squares[knightRow * 8 + knightCol].textContent === opp.knight
      ) {
        piece.checked = true;
        gameState.squares[row * 8 + col].classList.add("dangerlight");
      }
    });
  });
}

/**
 * Check if a bishop or queen is attacking the king diagonally
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 * @param {number} row - King's row
 * @param {number} col - King's column
 */
export function checkBishopAttacks(piece, opp, row, col) {
  // Check upper-left diagonal
  for (let i = 1; i <= Math.min(row, col); i++) {
    const targetRow = row - i;
    const targetCol = col - i;
    const target = gameState.squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check upper-right diagonal
  for (let i = 1; i <= Math.min(row, 7 - col); i++) {
    const targetRow = row - i;
    const targetCol = col + i;
    const target = gameState.squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check lower-left diagonal
  for (let i = 1; i <= Math.min(7 - row, col); i++) {
    const targetRow = row + i;
    const targetCol = col - i;
    const target = gameState.squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check lower-right diagonal
  for (let i = 1; i <= Math.min(7 - row, 7 - col); i++) {
    const targetRow = row + i;
    const targetCol = col + i;
    const target = gameState.squares[targetRow * 8 + targetCol].textContent;
    
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      gameState.squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
} 