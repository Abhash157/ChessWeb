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
  
  // Always remove any existing dangerlight first
  for (let i = 0; i < 64; i++) {
    state.squares[i].classList.remove("dangerlight");
  }
  
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
  }

  // Add dangerlight class if the king is in check
  if (king.checked && squares && squares[king.kingRow * 8 + king.kingCol]) {
    squares[king.kingRow * 8 + king.kingCol].classList.add("dangerlight");
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
 
  try {
    console.log(`Checking if ${color} has legal moves...`);
    
    // Import modules for move validation
    const playerPieces = color === 'white' 
      ? [pieces.white.pawn, pieces.white.knight, pieces.white.bishop, pieces.white.rook, pieces.white.queen, pieces.white.king] 
      : [pieces.black.pawn, pieces.black.knight, pieces.black.bishop, pieces.black.rook, pieces.black.queen, pieces.black.king];
    
    // For each square on the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = squares[row * 8 + col];
        if (!square) continue;
        
        const piece = square.textContent;
        
        // If the square contains a piece of the player's color
        if (playerPieces.includes(piece)) {
          // Get all possible moves for this piece
          const possibleMoves = getPossibleMoves(row, col, color);
          
          // Check if any of these moves are legal (don't leave the king in check)
          for (const move of possibleMoves) {
            // Simulate the move
            const isLegal = testMove(row, col, move.row, move.col, color);
            
            // If there's at least one legal move, the player has legal moves
            if (isLegal) {
              console.log(`Legal move found for ${color} from (${row},${col}) to (${move.row},${move.col})`);
              return true;
            }
          }
        }
      }
    }
    
    console.log(`No legal moves found for ${color}`);
    return false; // No legal moves found
    
  } catch (error) {
    console.error('Error in hasLegalMoves:', error);
    return false; // In case of error, assume no legal moves (will trigger checkmate or stalemate)
  }
}

/**
 * Get all possible moves for a piece without checking if they leave the king in check
 * @param {number} row - The row of the piece
 * @param {number} col - The column of the piece
 * @param {string} color - The color of the piece
 * @returns {Array} Array of possible move coordinates {row, col}
 */
function getPossibleMoves(row, col, color) {
  const state = getState();
  const squares = state.squares;
  const piece = squares[row * 8 + col].textContent;
  const moves = [];
  
  // Handle moves based on piece type
  if (piece === pieces[color].pawn) {
    // Pawn moves: forward and diagonal captures
    const direction = color === 'white' ? -1 : 1;
    const startingRow = color === 'white' ? 6 : 1;
    
    // Forward one square
    const forwardRow = row + direction;
    if (forwardRow >= 0 && forwardRow <= 7 && !squares[forwardRow * 8 + col].textContent) {
      moves.push({row: forwardRow, col});
      
      // Forward two squares from starting position
      if (row === startingRow) {
        const twoForwardRow = row + 2 * direction;
        if (!squares[twoForwardRow * 8 + col].textContent) {
          moves.push({row: twoForwardRow, col});
        }
      }
    }
    
    // Diagonal captures
    const targetRows = [row + direction];
    const targetCols = [col - 1, col + 1];
    
    targetRows.forEach(targetRow => {
      if (targetRow >= 0 && targetRow <= 7) {
        targetCols.forEach(targetCol => {
          if (targetCol >= 0 && targetCol <= 7) {
            const target = squares[targetRow * 8 + targetCol].textContent;
            const oppositeColor = color === 'white' ? 'black' : 'white';
            
            // Regular capture
            if (target && Object.values(pieces[oppositeColor]).includes(target)) {
              moves.push({row: targetRow, col: targetCol});
            }
            // En passant
            else if (state.enPassantTarget && 
                    state.enPassantTarget.row === targetRow && 
                    state.enPassantTarget.col === targetCol) {
              moves.push({row: targetRow, col: targetCol});
            }
          }
        });
      }
    });
  } 
  else if (piece === pieces[color].knight) {
    // Knight moves (L-shapes)
    const knightMoves = [
      {row: row-2, col: col-1}, {row: row-2, col: col+1},
      {row: row-1, col: col-2}, {row: row-1, col: col+2},
      {row: row+1, col: col-2}, {row: row+1, col: col+2},
      {row: row+2, col: col-1}, {row: row+2, col: col+1}
    ];
    
    knightMoves.forEach(move => {
      if (move.row >= 0 && move.row <= 7 && move.col >= 0 && move.col <= 7) {
        const target = squares[move.row * 8 + move.col].textContent;
        if (!target || !Object.values(pieces[color]).includes(target)) {
          moves.push(move);
        }
      }
    });
  }
  else if (piece === pieces[color].bishop || piece === pieces[color].queen) {
    // Bishop/Queen moves (diagonals)
    const directions = [
      {rowDir: -1, colDir: -1}, // Upper-left
      {rowDir: -1, colDir: 1},  // Upper-right
      {rowDir: 1, colDir: -1},  // Lower-left
      {rowDir: 1, colDir: 1}    // Lower-right
    ];
    
    directions.forEach(dir => {
      let r = row + dir.rowDir;
      let c = col + dir.colDir;
      
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = squares[r * 8 + c].textContent;
        
        if (!target) {
          // Empty square
          moves.push({row: r, col: c});
        } else if (!Object.values(pieces[color]).includes(target)) {
          // Opponent's piece
          moves.push({row: r, col: c});
          break;
        } else {
          // Own piece
          break;
        }
        
        r += dir.rowDir;
        c += dir.colDir;
      }
    });
  }
  
  if (piece === pieces[color].rook || piece === pieces[color].queen) {
    // Rook/Queen moves (horizontals and verticals)
    const directions = [
      {rowDir: -1, colDir: 0}, // Up
      {rowDir: 1, colDir: 0},  // Down
      {rowDir: 0, colDir: -1}, // Left
      {rowDir: 0, colDir: 1}   // Right
    ];
    
    directions.forEach(dir => {
      let r = row + dir.rowDir;
      let c = col + dir.colDir;
      
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = squares[r * 8 + c].textContent;
        
        if (!target) {
          // Empty square
          moves.push({row: r, col: c});
        } else if (!Object.values(pieces[color]).includes(target)) {
          // Opponent's piece
          moves.push({row: r, col: c});
          break;
        } else {
          // Own piece
          break;
        }
        
        r += dir.rowDir;
        c += dir.colDir;
      }
    });
  }
  
  if (piece === pieces[color].king) {
    // King moves (one square in any direction)
    const kingMoves = [
      {row: row-1, col: col-1}, {row: row-1, col: col}, {row: row-1, col: col+1},
      {row: row, col: col-1},                           {row: row, col: col+1},
      {row: row+1, col: col-1}, {row: row+1, col: col}, {row: row+1, col: col+1}
    ];
    
    kingMoves.forEach(move => {
      if (move.row >= 0 && move.row <= 7 && move.col >= 0 && move.col <= 7) {
        const target = squares[move.row * 8 + move.col].textContent;
        if (!target || !Object.values(pieces[color]).includes(target)) {
          moves.push(move);
        }
      }
    });
    
    // Castling
    if (color === 'white') {
      if (state.whiteCanCastleKingside && 
          !squares[7 * 8 + 5].textContent && 
          !squares[7 * 8 + 6].textContent) {
        moves.push({row: 7, col: 6});
      }
      if (state.whiteCanCastleQueenside && 
          !squares[7 * 8 + 3].textContent && 
          !squares[7 * 8 + 2].textContent &&
          !squares[7 * 8 + 1].textContent) {
        moves.push({row: 7, col: 2});
      }
    } else {
      if (state.blackCanCastleKingside && 
          !squares[0 * 8 + 5].textContent && 
          !squares[0 * 8 + 6].textContent) {
        moves.push({row: 0, col: 6});
      }
      if (state.blackCanCastleQueenside && 
          !squares[0 * 8 + 3].textContent && 
          !squares[0 * 8 + 2].textContent &&
          !squares[0 * 8 + 1].textContent) {
        moves.push({row: 0, col: 2});
      }
    }
  }
  
  return moves;
}

/**
 * Test if a move would leave the king in check
 * @param {number} fromRow - Starting row
 * @param {number} fromCol - Starting column
 * @param {number} toRow - Destination row
 * @param {number} toCol - Destination column
 * @param {string} color - Player color
 * @returns {boolean} Whether the move is legal
 */
function testMove(fromRow, fromCol, toRow, toCol, color) {
  const state = getState();
  const squares = state.squares;
  
  // Save original state
  const fromPiece = squares[fromRow * 8 + fromCol].textContent;
  const toPiece = squares[toRow * 8 + toCol].textContent;
  const originalKingRow = pieces[color].kingRow;
  const originalKingCol = pieces[color].kingCol;
  
  // Simulate the move
  squares[toRow * 8 + toCol].textContent = fromPiece;
  squares[fromRow * 8 + fromCol].textContent = '';
  
  // Update king position if moving the king
  if (fromPiece === pieces[color].king) {
    pieces[color].kingRow = toRow;
    pieces[color].kingCol = toCol;
  }
  
  // Check if the king is in check after the move
  const isInCheck = isKingInCheck(pieces[color].kingRow, pieces[color].kingCol, color);
  
  // Restore the original position
  squares[fromRow * 8 + fromCol].textContent = fromPiece;
  squares[toRow * 8 + toCol].textContent = toPiece;
  pieces[color].kingRow = originalKingRow;
  pieces[color].kingCol = originalKingCol;
  
  // If the king is in check after the move, it's not legal
  return !isInCheck;
}

/**
 * Checks if a pawn is putting the white king in check
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 */
export function analyzeCheckPawnWhite(piece, opp) {
  const state = getState();
  const squares = state.squares;
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (
    kingRow > 0 &&
    ((kingCol > 0 && squares[(kingRow - 1) * 8 + (kingCol - 1)].textContent === opp.pawn) ||
     (kingCol < 7 && squares[(kingRow - 1) * 8 + (kingCol + 1)].textContent === opp.pawn))
  ) {
    piece.checked = true;
  }
}

/**
 * Checks if a pawn is putting the black king in check
 * @param {Object} piece - The player's king piece
 * @param {Object} opp - The opponent's pieces
 */
export function analyzeCheckPawnBlack(piece, opp) {
  const state = getState();
  const squares = state.squares;
  const kingRow = piece.kingRow;
  const kingCol = piece.kingCol;
  
  if (
    kingRow < 7 &&
    ((kingCol > 0 && squares[(kingRow + 1) * 8 + (kingCol - 1)].textContent === opp.pawn) ||
     (kingCol < 7 && squares[(kingRow + 1) * 8 + (kingCol + 1)].textContent === opp.pawn))
  ) {
    piece.checked = true;
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
    }
    if (target !== "") {
      break;
    }
  }
} 