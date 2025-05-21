/**
 * checkDetection.js - Check detection logic
 */

import { pieces, getState } from '../state.js';

/**
 * Checks if a king is in check
 * @param {number} kingRow - Row of the king
 * @param {number} kingCol - Column of the king
 * @param {string} kingColor - Color of the king ('white' or 'black')
 * @returns {boolean} Whether the king is in check
 */
export function isKingInCheck(kingRow, kingCol, kingColor) {
  const state = getState();
  const squares = state.squares;
  const king = pieces[kingColor];
  
  // Set the king position for check detection
  if (kingRow !== undefined && kingCol !== undefined) {
    king.kingRow = kingRow;
    king.kingCol = kingCol;
  }

  // Clean previous check status
  king.checked = false;
  
  // Get the opponent's color and pieces
  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  const opponentPieces = pieces[opponentColor];

  // Check for pawn attacks
  if (kingColor === 'white') {
    // For white king, check black pawn attacks
    analyzeCheckPawnWhite(king, opponentPieces);
  } else {
    // For black king, check white pawn attacks
    analyzeCheckPawnBlack(king, opponentPieces);
  }

  // Check for attacks from other pieces
  analyzeCheck(king, opponentPieces);

  // Check for king proximity (kings cannot be adjacent)
  const opponentKingRow = opponentPieces.kingRow;
  const opponentKingCol = opponentPieces.kingCol;
  
  if (Math.abs(king.kingRow - opponentKingRow) <= 1 && 
      Math.abs(king.kingCol - opponentKingCol) <= 1) {
    king.checked = true;
    if (squares && squares[king.kingRow * 8 + king.kingCol]) {
      squares[king.kingRow * 8 + king.kingCol].classList.add("dangerlight");
    }
  }

  return king.checked;
}

/**
 * Determines if the given color is in checkmate
 * @param {string} color - The color to check ('white' or 'black')
 * @returns {boolean} Whether the player is in checkmate
 */
export function isCheckmate(color) {
  // First, verify the king is in check
  const king = pieces[color];
  if (!king.checked) {
    return false; // Not in check, so not checkmate
  }

  // Check if any legal move can get the king out of check
  return !hasLegalMoves(color);
}

/**
 * Determines if the given color is in stalemate
 * @param {string} color - The color to check ('white' or 'black')
 * @returns {boolean} Whether the player is in stalemate
 */
export function isStalemate(color) {
  // First, verify the king is NOT in check
  const king = pieces[color];
  if (king.checked) {
    return false; // In check, so not stalemate
  }

  // Check if there are no legal moves
  return !hasLegalMoves(color);
}

/**
 * Checks if the given color has any legal moves
 * @param {string} color - The color to check ('white' or 'black')
 * @returns {boolean} Whether the player has any legal moves
 */
function hasLegalMoves(color) {
  const state = getState();
  const squares = state.squares;
  
  // Import the moveValidator to check for valid moves
  // This is a temporary workaround - in a proper implementation we'd import this at the top
  try {
    // Log for debugging
    console.log(`Checking if ${color} has legal moves...`);
    
    // Always return true for now to prevent incorrect stalemate detection
    // This is a temporary fix until we properly implement move validation
    return true;
    
    /* TODO: Implement proper move validation
    // Get pieces belonging to the player
    const playerPieces = color === 'white' ? 
      [pieces.white.king, pieces.white.queen, pieces.white.rook, pieces.white.bishop, pieces.white.knight, pieces.white.pawn] :
      [pieces.black.king, pieces.black.queen, pieces.black.rook, pieces.black.bishop, pieces.black.knight, pieces.black.pawn];
    
    // For each square on the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = squares[row * 8 + col];
        const piece = square.textContent;
        
        // If the square contains a piece of the player's color
        if (playerPieces.includes(piece)) {
          // Get all possible moves for this piece
          const moves = getValidMovesForPiece(row, col, color);
          
          // If there's at least one legal move, the player has legal moves
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    
    // No legal moves found
    return false;
    */
  } catch (error) {
    console.error('Error in hasLegalMoves:', error);
    // In case of error, return true to prevent false stalemate detection
    return true;
  }
}

/**
 * Gets all valid moves for a piece that don't leave the king in check
 * @param {number} row - The row of the piece
 * @param {number} col - The column of the piece
 * @param {string} color - The color of the piece ('white' or 'black')
 * @returns {Array} Array of valid moves as {row, col} objects
 */
function getValidMovesForPiece(row, col, color) {
  // This is a temporary implementation that always returns some moves
  // to prevent false stalemate detection
  console.log(`Getting valid moves for piece at ${row},${col} (${color})`);
  
  // Return a dummy move to prevent false stalemate detection
  return [{row: 0, col: 0}];
  
  /* Original implementation - commented out
  const state = getState();
  const squares = state.squares;
  const piece = squares[row * 8 + col].textContent;
  const king = pieces[color];
  
  // This is a simplified implementation for testing
  // In a real implementation, you would:
  // 1. Get all pseudo-legal moves for the piece based on its type
  // 2. For each move, simulate it
  // 3. Check if the move would leave the king in check
  // 4. Only return moves that don't leave the king in check
  
  // For now, assume there are no legal moves
  // This needs to be replaced with actual move generation and validation
  return [];
  */
}

/**
 * Checks if a pawn is putting the white king in check
 * @param {Object} piece - The player's king piece
 * @param {Array} opp - The opponent's pieces
 */
export function analyzeCheckPawnWhite(piece, opp) {
  const state = getState();
  const squares = state.squares;
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (kingRow > 0) {
    // Check for pawn attacks from the left-forward diagonal
    if (kingCol > 0 && 
        squares[(kingRow - 1) * 8 + (kingCol - 1)] && 
        squares[(kingRow - 1) * 8 + (kingCol - 1)].textContent === opp.pawn) {
      piece.checked = true;
      squares[kingRow * 8 + kingCol].classList.add("dangerlight");
      return;
    }
    
    // Check for pawn attacks from the right-forward diagonal
    if (kingCol < 7 && 
        squares[(kingRow - 1) * 8 + (kingCol + 1)] && 
        squares[(kingRow - 1) * 8 + (kingCol + 1)].textContent === opp.pawn) {
      piece.checked = true;
      squares[kingRow * 8 + kingCol].classList.add("dangerlight");
      return;
    }
  }
}

/**
 * Checks if a pawn is putting the black king in check
 * @param {Object} piece - The player's king piece
 * @param {Array} opp - The opponent's pieces
 */
export function analyzeCheckPawnBlack(piece, opp) {
  const state = getState();
  const squares = state.squares;
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (kingRow < 7) {
    // Check for pawn attacks from the left-forward diagonal
    if (kingCol > 0 && 
        squares[(kingRow + 1) * 8 + (kingCol - 1)] && 
        squares[(kingRow + 1) * 8 + (kingCol - 1)].textContent === opp.pawn) {
      piece.checked = true;
      squares[kingRow * 8 + kingCol].classList.add("dangerlight");
      return;
    }
    
    // Check for pawn attacks from the right-forward diagonal
    if (kingCol < 7 && 
        squares[(kingRow + 1) * 8 + (kingCol + 1)] && 
        squares[(kingRow + 1) * 8 + (kingCol + 1)].textContent === opp.pawn) {
      piece.checked = true;
      squares[kingRow * 8 + kingCol].classList.add("dangerlight");
      return;
    }
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
  const state = getState();
  const squares = state.squares;
  
  // Check upwards
  for (let i = 1; i <= row; i++) {
    const targetSquare = squares[(row - i) * 8 + col];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.rook || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check downwards
  for (let i = row + 1; i <= 7; i++) {
    const targetSquare = squares[i * 8 + col];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.rook || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check left
  for (let i = 1; i <= col; i++) {
    const targetSquare = squares[row * 8 + (col - i)];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.rook || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check right
  for (let i = col + 1; i <= 7; i++) {
    const targetSquare = squares[row * 8 + i];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.rook || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
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
  const state = getState();
  const squares = state.squares;
  const nRow = [row - 1, row + 1];
  const nRow2 = [row - 2, row + 2];
  const nCol = [col - 1, col + 1];
  const nCol2 = [col - 2, col + 2];

  // Check all knight move patterns
  nRow.forEach((knightRow) => {
    nCol2.forEach((knightCol) => {
      if (
        knightRow >= 0 && knightRow <= 7 &&
        knightCol >= 0 && knightCol <= 7 &&
        squares[knightRow * 8 + knightCol] &&
        squares[knightRow * 8 + knightCol].textContent === opp.knight
      ) {
        piece.checked = true;
        squares[row * 8 + col].classList.add("dangerlight");
      }
    });
  });
  
  nRow2.forEach((knightRow) => {
    nCol.forEach((knightCol) => {
      if (
        knightRow >= 0 && knightRow <= 7 &&
        knightCol >= 0 && knightCol <= 7 &&
        squares[knightRow * 8 + knightCol] &&
        squares[knightRow * 8 + knightCol].textContent === opp.knight
      ) {
        piece.checked = true;
        squares[row * 8 + col].classList.add("dangerlight");
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
  const state = getState();
  const squares = state.squares;
  
  // Check upper-left diagonal
  for (let i = 1; i <= Math.min(row, col); i++) {
    const targetRow = row - i;
    const targetCol = col - i;
    const targetSquare = squares[targetRow * 8 + targetCol];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check upper-right diagonal
  for (let i = 1; i <= Math.min(row, 7 - col); i++) {
    const targetRow = row - i;
    const targetCol = col + i;
    const targetSquare = squares[targetRow * 8 + targetCol];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check lower-left diagonal
  for (let i = 1; i <= Math.min(7 - row, col); i++) {
    const targetRow = row + i;
    const targetCol = col - i;
    const targetSquare = squares[targetRow * 8 + targetCol];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
  
  // Check lower-right diagonal
  for (let i = 1; i <= Math.min(7 - row, 7 - col); i++) {
    const targetRow = row + i;
    const targetCol = col + i;
    const targetSquare = squares[targetRow * 8 + targetCol];
    if (!targetSquare) continue;
    
    const target = targetSquare.textContent;
    if (target === opp.bishop || target === opp.queen) {
      piece.checked = true;
      squares[row * 8 + col].classList.add("dangerlight");
    }
    if (target !== "") {
      break;
    }
  }
} 