/**
 * moveValidator.js - Chess move validation
 */

import { getState, pieces, PLAYER } from '../state.js';
import { isKingInCheck } from './checkDetection.js';

/**
 * Gets all valid moves for a specific square
 * @param {number} row - Row of the square
 * @param {number} col - Column of the square
 * @returns {Array} Array of valid move coordinates
 */
export function getValidMovesForSquare(row, col) {
  const state = getState();
  const squares = state.squares;
  const square = squares[row * 8 + col];
  const piece = square.textContent;
  
  // If square is empty, no valid moves
  if (!piece) {
    return [];
  }
  
  // Determine piece color and type
  const isWhitePiece = piece.charCodeAt(0) < 9900;
  const currentTurn = state.turn;
  
  // Can only move pieces of the current player's color
  if ((isWhitePiece && currentTurn !== PLAYER.WHITE) ||
      (!isWhitePiece && currentTurn !== PLAYER.BLACK)) {
    return [];
  }
  
  // Get the possible pseudo-legal moves based on piece type
  let moves = [];
  const color = isWhitePiece ? 'white' : 'black';
  
  if (piece === pieces[color].pawn) {
    moves = getPawnMoves(row, col, color);
  } else if (piece === pieces[color].knight) {
    moves = getKnightMoves(row, col, color);
  } else if (piece === pieces[color].bishop) {
    moves = getBishopMoves(row, col, color);
  } else if (piece === pieces[color].rook) {
    moves = getRookMoves(row, col, color);
  } else if (piece === pieces[color].queen) {
    moves = getQueenMoves(row, col, color);
  } else if (piece === pieces[color].king) {
    moves = getKingMoves(row, col, color);
  }
  
  // Filter out moves that would leave the king in check
  return filterLegalMoves(row, col, moves, color);
}

/**
 * Filters out moves that would leave the king in check
 * @param {number} fromRow - Starting row
 * @param {number} fromCol - Starting column
 * @param {Array} moves - Array of possible moves
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of legal moves
 */
function filterLegalMoves(fromRow, fromCol, moves, color) {
  const state = getState();
  const squares = state.squares;
  const piece = squares[fromRow * 8 + fromCol].textContent;
  const king = pieces[color];
  
  // Store original king position if the piece is a king
  const isKing = piece === pieces[color].king;
  const originalKingRow = king.kingRow;
  const originalKingCol = king.kingCol;
  
  // Filter out moves that would leave the king in check
  const legalMoves = moves.filter(move => {
    const toRow = move.row;
    const toCol = move.col;
    
    // Save the target square's original content
    const targetSquare = squares[toRow * 8 + toCol];
    const originalTargetContent = targetSquare.textContent;
    
    // Save the original square's content
    const originalSquare = squares[fromRow * 8 + fromCol];
    
    // Temporarily make the move
    originalSquare.textContent = '';
    targetSquare.textContent = piece;
    
    // If the king moved, update its position temporarily
    if (isKing) {
      king.kingRow = toRow;
      king.kingCol = toCol;
    }
    
    // Check if the king is in check after the move
    const inCheck = isKingInCheck(king.kingRow, king.kingCol, color);
    
    // Restore the original board state
    originalSquare.textContent = piece;
    targetSquare.textContent = originalTargetContent;
    
    // Restore original king position if needed
    if (isKing) {
      king.kingRow = originalKingRow;
      king.kingCol = originalKingCol;
    }
    
    // The move is legal if it doesn't leave the king in check
    return !inCheck;
  });
  
  return legalMoves;
}

/**
 * Gets all possible pawn moves
 * @param {number} row - Row of the pawn
 * @param {number} col - Column of the pawn
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of possible moves
 */
function getPawnMoves(row, col, color) {
  const state = getState();
  const squares = state.squares;
  const moves = [];
  
  // Direction depends on pawn color
  const direction = color === 'white' ? -1 : 1;
  const startingRow = color === 'white' ? 6 : 1;
  
  // Forward move (one square)
  const forward1Row = row + direction;
  if (forward1Row >= 0 && forward1Row <= 7) {
    const forward1Square = squares[forward1Row * 8 + col];
    if (forward1Square.textContent === '') {
      moves.push({ row: forward1Row, col: col });
      
      // Two squares forward from starting position
      if (row === startingRow) {
        const forward2Row = row + 2 * direction;
        const forward2Square = squares[forward2Row * 8 + col];
        if (forward2Square.textContent === '') {
          moves.push({ row: forward2Row, col: col });
        }
      }
    }
  }
  
  // Captures (diagonal moves)
  const captureRows = [row + direction];
  const captureCols = [col - 1, col + 1];
  
  captureRows.forEach(captureRow => {
    if (captureRow >= 0 && captureRow <= 7) {
      captureCols.forEach(captureCol => {
        if (captureCol >= 0 && captureCol <= 7) {
          const captureSquare = squares[captureRow * 8 + captureCol];
          const targetPiece = captureSquare.textContent;
          
          // Regular capture
          if (targetPiece !== '') {
            const isTargetWhite = targetPiece.charCodeAt(0) < 9900;
            if ((color === 'white' && !isTargetWhite) || (color === 'black' && isTargetWhite)) {
              moves.push({ row: captureRow, col: captureCol });
            }
          } 
          // En passant capture
          else if (state.enPassantTarget && 
                   state.enPassantTarget.row === captureRow && 
                   state.enPassantTarget.col === captureCol) {
            moves.push({ row: captureRow, col: captureCol });
          }
        }
      });
    }
  });
  
  return moves;
}

/**
 * Gets all possible knight moves
 * @param {number} row - Row of the knight
 * @param {number} col - Column of the knight
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of possible moves
 */
function getKnightMoves(row, col, color) {
  const state = getState();
  const squares = state.squares;
  const moves = [];
  
  // Knight moves in L-shape
  const knightOffsets = [
    [-2, -1], [-2, 1], 
    [-1, -2], [-1, 2], 
    [1, -2], [1, 2], 
    [2, -1], [2, 1]
  ];
  
  knightOffsets.forEach(([rowOffset, colOffset]) => {
    const targetRow = row + rowOffset;
    const targetCol = col + colOffset;
    
    if (targetRow >= 0 && targetRow <= 7 && targetCol >= 0 && targetCol <= 7) {
      const targetSquare = squares[targetRow * 8 + targetCol];
      const targetPiece = targetSquare.textContent;
      
      // Empty square or enemy piece
      if (targetPiece === '' || 
         (color === 'white' && targetPiece.charCodeAt(0) >= 9900) ||
         (color === 'black' && targetPiece.charCodeAt(0) < 9900)) {
        moves.push({ row: targetRow, col: targetCol });
      }
    }
  });
  
  return moves;
}

/**
 * Gets all possible bishop moves
 * @param {number} row - Row of the bishop
 * @param {number} col - Column of the bishop
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of possible moves
 */
function getBishopMoves(row, col, color) {
  const state = getState();
  const squares = state.squares;
  const moves = [];
  
  // Direction offsets for diagonal moves
  const directions = [
    [-1, -1], // Up-left
    [-1, 1],  // Up-right
    [1, -1],  // Down-left
    [1, 1]    // Down-right
  ];
  
  directions.forEach(([rowDir, colDir]) => {
    let targetRow = row + rowDir;
    let targetCol = col + colDir;
    
    while (targetRow >= 0 && targetRow <= 7 && targetCol >= 0 && targetCol <= 7) {
      const targetSquare = squares[targetRow * 8 + targetCol];
      const targetPiece = targetSquare.textContent;
      
      if (targetPiece === '') {
        // Empty square, can move
        moves.push({ row: targetRow, col: targetCol });
      } else {
        // Occupied square
        const isTargetWhite = targetPiece.charCodeAt(0) < 9900;
        
        if ((color === 'white' && !isTargetWhite) || (color === 'black' && isTargetWhite)) {
          // Enemy piece, can capture
          moves.push({ row: targetRow, col: targetCol });
        }
        
        // Stop after encountering any piece
        break;
      }
      
      targetRow += rowDir;
      targetCol += colDir;
    }
  });
  
  return moves;
}

/**
 * Gets all possible rook moves
 * @param {number} row - Row of the rook
 * @param {number} col - Column of the rook
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of possible moves
 */
function getRookMoves(row, col, color) {
  const state = getState();
  const squares = state.squares;
  const moves = [];
  
  // Direction offsets for horizontal and vertical moves
  const directions = [
    [-1, 0],  // Up
    [0, 1],   // Right
    [1, 0],   // Down
    [0, -1]   // Left
  ];
  
  directions.forEach(([rowDir, colDir]) => {
    let targetRow = row + rowDir;
    let targetCol = col + colDir;
    
    while (targetRow >= 0 && targetRow <= 7 && targetCol >= 0 && targetCol <= 7) {
      const targetSquare = squares[targetRow * 8 + targetCol];
      const targetPiece = targetSquare.textContent;
      
      if (targetPiece === '') {
        // Empty square, can move
        moves.push({ row: targetRow, col: targetCol });
      } else {
        // Occupied square
        const isTargetWhite = targetPiece.charCodeAt(0) < 9900;
        
        if ((color === 'white' && !isTargetWhite) || (color === 'black' && isTargetWhite)) {
          // Enemy piece, can capture
          moves.push({ row: targetRow, col: targetCol });
        }
        
        // Stop after encountering any piece
        break;
      }
      
      targetRow += rowDir;
      targetCol += colDir;
    }
  });
  
  return moves;
}

/**
 * Gets all possible queen moves (combines bishop and rook moves)
 * @param {number} row - Row of the queen
 * @param {number} col - Column of the queen
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of possible moves
 */
function getQueenMoves(row, col, color) {
  // Queen moves like a bishop and a rook combined
  const bishopMoves = getBishopMoves(row, col, color);
  const rookMoves = getRookMoves(row, col, color);
  return [...bishopMoves, ...rookMoves];
}

/**
 * Gets all possible king moves
 * @param {number} row - Row of the king
 * @param {number} col - Column of the king
 * @param {string} color - Player color ('white' or 'black')
 * @returns {Array} Array of possible moves
 */
function getKingMoves(row, col, color) {
  const state = getState();
  const squares = state.squares;
  const moves = [];
  
  // Direction offsets for all 8 surrounding squares
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  // Regular king moves
  directions.forEach(([rowDir, colDir]) => {
    const targetRow = row + rowDir;
    const targetCol = col + colDir;
    
    if (targetRow >= 0 && targetRow <= 7 && targetCol >= 0 && targetCol <= 7) {
      const targetSquare = squares[targetRow * 8 + targetCol];
      const targetPiece = targetSquare.textContent;
      
      if (targetPiece === '') {
        // Empty square, can move
        moves.push({ row: targetRow, col: targetCol });
      } else {
        // Occupied square
        const isTargetWhite = targetPiece.charCodeAt(0) < 9900;
        
        if ((color === 'white' && !isTargetWhite) || (color === 'black' && isTargetWhite)) {
          // Enemy piece, can capture
          moves.push({ row: targetRow, col: targetCol });
        }
      }
    }
  });
  
  // Castling moves
  addCastlingMoves(row, col, color, moves);
  
  return moves;
}

/**
 * Adds castling moves if they're legal
 * @param {number} row - Row of the king
 * @param {number} col - Column of the king
 * @param {string} color - Player color ('white' or 'black')
 * @param {Array} moves - Array of moves to add to
 */
function addCastlingMoves(row, col, color, moves) {
  const state = getState();
  const squares = state.squares;
  
  // Check if the king is in the correct starting position
  if ((color === 'white' && (row !== 7 || col !== 4)) ||
      (color === 'black' && (row !== 0 || col !== 4))) {
    return;
  }
  
  // Check if the king is in check (can't castle out of check)
  if (pieces[color].checked) {
    return;
  }
  
  // Check kingside castling
  if ((color === 'white' && state.whiteCanCastleKingside) ||
      (color === 'black' && state.blackCanCastleKingside)) {
    
    // Check if squares between king and rook are empty
    if (squares[row * 8 + 5].textContent === '' && 
        squares[row * 8 + 6].textContent === '') {
      
      // Check if the king would pass through check
      let canCastle = true;
      const kingClone = {...pieces[color]};
      
      // Check if king would be in check on f1/f8
      kingClone.kingRow = row;
      kingClone.kingCol = 5;
      if (isKingInCheck(kingClone.kingRow, kingClone.kingCol, color)) {
        canCastle = false;
      }
      
      // Check if king would be in check on g1/g8
      kingClone.kingCol = 6;
      if (isKingInCheck(kingClone.kingRow, kingClone.kingCol, color)) {
        canCastle = false;
      }
      
      if (canCastle) {
        moves.push({ row: row, col: 6 });
      }
    }
  }
  
  // Check queenside castling
  if ((color === 'white' && state.whiteCanCastleQueenside) ||
      (color === 'black' && state.blackCanCastleQueenside)) {
    
    // Check if squares between king and rook are empty
    if (squares[row * 8 + 3].textContent === '' && 
        squares[row * 8 + 2].textContent === '' && 
        squares[row * 8 + 1].textContent === '') {
      
      // Check if the king would pass through check
      let canCastle = true;
      const kingClone = {...pieces[color]};
      
      // Check if king would be in check on d1/d8
      kingClone.kingRow = row;
      kingClone.kingCol = 3;
      if (isKingInCheck(kingClone.kingRow, kingClone.kingCol, color)) {
        canCastle = false;
      }
      
      // Check if king would be in check on c1/c8
      kingClone.kingCol = 2;
      if (isKingInCheck(kingClone.kingRow, kingClone.kingCol, color)) {
        canCastle = false;
      }
      
      if (canCastle) {
        moves.push({ row: row, col: 2 });
      }
    }
  }
} 