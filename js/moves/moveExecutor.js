/**
 * moveExecutor.js - Executes and records chess moves
 */

import { getState, updateState, pieces } from '../state.js';
import { updateCapturedPieces } from '../ui/capturedPieces.js';
import { animatePieceMovement } from '../board.js';

/**
 * Makes a chess move from one square to another
 * @param {HTMLElement} fromSquare - The square to move from
 * @param {HTMLElement} toSquare - The square to move to
 * @param {number} fromRow - Starting row
 * @param {number} fromCol - Starting column
 * @param {number} toRow - Destination row
 * @param {number} toCol - Destination column
 */
export async function makeMove(fromSquare, toSquare, fromRow, fromCol, toRow, toCol) {
  const state = getState();
  const pieceText = fromSquare.textContent;
  const capturedPieceText = toSquare.textContent;
  
  // Determine move type and player color
  const isWhitePiece = pieceText.charCodeAt(0) < 9900;
  const playerColor = isWhitePiece ? 'white' : 'black';
  const opponentColor = isWhitePiece ? 'black' : 'white';
  
  // Record move in history
  recordMove(fromRow, fromCol, toRow, toCol, pieceText, capturedPieceText, playerColor);
  
  // Handle castling
  if (pieceText === pieces[playerColor].king && Math.abs(fromCol - toCol) === 2) {
    await handleCastling(fromSquare, toSquare, fromRow, fromCol, toRow, toCol, playerColor);
  } 
  // Handle en passant
  else if (pieceText === pieces[playerColor].pawn && fromCol !== toCol && toSquare.textContent === '') {
    await handleEnPassant(fromSquare, toSquare, fromRow, fromCol, toRow, toCol, playerColor);
  }
  // Handle promotion
  else if (pieceText === pieces[playerColor].pawn && (toRow === 0 || toRow === 7)) {
    await handlePromotion(fromSquare, toSquare, pieceText, playerColor);
  }
  // Regular move
  else {
    await executeRegularMove(fromSquare, toSquare, pieceText);
  }
  
  // Update king position if the king moved
  if (pieceText === pieces[playerColor].king) {
    pieces[playerColor].kingRow = toRow;
    pieces[playerColor].kingCol = toCol;
  }
  
  // Update castling rights
  updateCastlingRights(pieceText, playerColor, fromRow, fromCol);
  
  // Handle captured piece
  if (capturedPieceText && capturedPieceText !== '') {
    recordCapture(capturedPieceText, playerColor);
  }
  
  // Clear any en passant target from previous move
  updateState({ enPassantTarget: null });
  
  // Set en passant target if pawn moved two squares
  if (pieceText === pieces[playerColor].pawn && Math.abs(fromRow - toRow) === 2) {
    updateState({ 
      enPassantTarget: { 
        row: (fromRow + toRow) / 2, 
        col: fromCol 
      },
      lastPawnDoubleMove: {
        row: toRow,
        col: toCol
      }
    });
  }
  
  // Increment move count
  updateState({ moveCount: state.moveCount + (playerColor === 'black' ? 1 : 0) });
}

/**
 * Records a move in the move history
 */
function recordMove(fromRow, fromCol, toRow, toCol, pieceText, capturedPieceText, playerColor) {
  const state = getState();
  const moveNotation = generateMoveNotation(fromRow, fromCol, toRow, toCol, pieceText, capturedPieceText);
  
  const moveRecord = {
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol },
    piece: pieceText,
    captured: capturedPieceText,
    playerColor: playerColor,
    notation: moveNotation,
    timestamp: new Date().getTime()
  };
  
  // Deep clone the current history and add the new move
  const moveHistory = [...state.moveHistory, moveRecord];
  updateState({ moveHistory });
}

/**
 * Generates algebraic notation for a move
 */
function generateMoveNotation(fromRow, fromCol, toRow, toCol, pieceText, capturedPieceText) {
  // This is a simplified implementation
  const files = 'abcdefgh';
  const ranks = '87654321';
  
  const fromSquareName = files[fromCol] + ranks[fromRow];
  const toSquareName = files[toCol] + ranks[toRow];
  
  // Determine piece letter (empty for pawns)
  let pieceSymbol = '';
  if (pieceText === pieces.white.king || pieceText === pieces.black.king) pieceSymbol = 'K';
  else if (pieceText === pieces.white.queen || pieceText === pieces.black.queen) pieceSymbol = 'Q';
  else if (pieceText === pieces.white.rook || pieceText === pieces.black.rook) pieceSymbol = 'R';
  else if (pieceText === pieces.white.bishop || pieceText === pieces.black.bishop) pieceSymbol = 'B';
  else if (pieceText === pieces.white.knight || pieceText === pieces.black.knight) pieceSymbol = 'N';
  
  // Check if it's a capture
  const isCapture = capturedPieceText && capturedPieceText !== '';
  const captureSymbol = isCapture ? 'x' : '';
  
  // Special cases like castling will need to be handled separately
  if (pieceSymbol === 'K' && Math.abs(fromCol - toCol) === 2) {
    return toCol > fromCol ? 'O-O' : 'O-O-O';  // Kingside or queenside castling
  }
  
  return `${pieceSymbol}${fromSquareName}${captureSymbol}${toSquareName}`;
}

/**
 * Records a piece capture
 */
function recordCapture(capturedPieceText, playerColor) {
  const state = getState();
  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  
  // Add the captured piece to the appropriate array
  const capturedPieces = { ...state.capturedPieces };
  capturedPieces[playerColor].push(capturedPieceText);
  
  updateState({ capturedPieces });
}

/**
 * Handles castling move
 */
async function handleCastling(fromSquare, toSquare, fromRow, fromCol, toRow, toCol, playerColor) {
  const state = getState();
  const squares = state.squares;
  const kingPiece = pieces[playerColor].king;
  
  // Determine if it's kingside or queenside castling
  const isKingside = toCol > fromCol;
  const rookCol = isKingside ? 7 : 0;
  const rookNewCol = isKingside ? toCol - 1 : toCol + 1;
  
  // Get the rook square
  const rookSquare = squares[fromRow * 8 + rookCol];
  const rookNewSquare = squares[fromRow * 8 + rookNewCol];
  
  // Animate the king
  await animatePieceMovement(fromSquare, toSquare, kingPiece);
  
  // Animate the rook
  await animatePieceMovement(rookSquare, rookNewSquare, pieces[playerColor].rook);
  
  // Update the board
  fromSquare.textContent = '';
  toSquare.textContent = kingPiece;
  rookSquare.textContent = '';
  rookNewSquare.textContent = pieces[playerColor].rook;
}

/**
 * Handles en passant capture
 */
async function handleEnPassant(fromSquare, toSquare, fromRow, fromCol, toRow, toCol, playerColor) {
  const state = getState();
  const squares = state.squares;
  const pawnPiece = pieces[playerColor].pawn;
  
  // Find the captured pawn square
  const capturedRow = fromRow;
  const capturedCol = toCol;
  const capturedSquare = squares[capturedRow * 8 + capturedCol];
  const capturedPiece = capturedSquare.textContent;
  
  // Animate the pawn movement
  await animatePieceMovement(fromSquare, toSquare, pawnPiece);
  
  // Update the board
  fromSquare.textContent = '';
  toSquare.textContent = pawnPiece;
  capturedSquare.textContent = '';
  
  // Record the capture
  recordCapture(capturedPiece, playerColor);
}

/**
 * Handles pawn promotion
 */
async function handlePromotion(fromSquare, toSquare, pieceText, playerColor) {
  const promotionPiece = pieces[playerColor].queen; // Default promote to queen
  
  // Animate the pawn movement
  await animatePieceMovement(fromSquare, toSquare, pieceText);
  
  // Update the board
  fromSquare.textContent = '';
  toSquare.textContent = promotionPiece;
  
  // In a real implementation, you would show a dialog to let the player choose the promotion piece
}

/**
 * Handles regular move (not castling, en passant, or promotion)
 */
async function executeRegularMove(fromSquare, toSquare, pieceText) {
  // Animate the piece movement
  await animatePieceMovement(fromSquare, toSquare, pieceText);
  
  // Update the board
  fromSquare.textContent = '';
  toSquare.textContent = pieceText;
}

/**
 * Updates castling rights based on piece movement
 */
function updateCastlingRights(pieceText, playerColor, fromRow, fromCol) {
  const state = getState();
  
  // King moved - lose all castling rights
  if (pieceText === pieces[playerColor].king) {
    if (playerColor === 'white') {
      updateState({
        whiteCanCastleKingside: false,
        whiteCanCastleQueenside: false
      });
    } else {
      updateState({
        blackCanCastleKingside: false,
        blackCanCastleQueenside: false
      });
    }
  }
  
  // Rook moved - lose castling rights on that side
  if (pieceText === pieces[playerColor].rook) {
    if (playerColor === 'white') {
      if (fromRow === 7 && fromCol === 0) {
        updateState({ whiteCanCastleQueenside: false });
      } else if (fromRow === 7 && fromCol === 7) {
        updateState({ whiteCanCastleKingside: false });
      }
    } else {
      if (fromRow === 0 && fromCol === 0) {
        updateState({ blackCanCastleQueenside: false });
      } else if (fromRow === 0 && fromCol === 7) {
        updateState({ blackCanCastleKingside: false });
      }
    }
  }
} 