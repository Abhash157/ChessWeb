/**
 * gameState.js - Game state management and definitions
 */

// Game state constants
export const PLAYER = {
  WHITE: 0,
  BLACK: 1
};

// Chess clock state
export const CLOCK = {
  initialTime: 600, // 10 minutes in seconds
  whiteTime: 600,
  blackTime: 600,
  timerInterval: null,
  isRunning: false,
  activePlayer: PLAYER.WHITE, // Matches the initial turn value
  lowTimeThreshold: 60, // 1 minute in seconds
};

// Game state variables
export let selectedSquare = null;
export let turn = PLAYER.WHITE;
export let invalidOpacity = 0;
export let pendingPromotion = null;

// Game state object
export const gameState = {
  squares: [],
  whiteCanCastleKingside: true,
  whiteCanCastleQueenside: true,
  blackCanCastleKingside: true,
  blackCanCastleQueenside: true,
  enPassantTarget: null,
  lastPawnDoubleMove: null,
  moveHistory: [],
  capturedPieces: {
    white: [],
    black: []
  },
  moveCount: 1,
  gameOver: false,
  check: false,
  checkmate: false,
  stalemate: false,
  fiftyMoveRule: false,
  insufficientMaterial: false,
  threefoldRepetition: false,
  castlingRightsSnapshot: null,
  turn: PLAYER.WHITE,
};

// Chess pieces Unicode symbols
export const pieces = {
  white: {
    king: "\u2654",
    queen: "\u2655",
    rook: "\u2656",
    bishop: "\u2657",
    knight: "\u2658",
    pawn: "\u2659",
    checked: false,
    checkSquare: 0,
    kingRow: 7,
    kingCol: 4,
  },
  black: {
    king: "\u265A",
    queen: "\u265B",
    rook: "\u265C",
    bishop: "\u265D",
    knight: "\u265E",
    pawn: "\u265F",
    checked: false,
    checkSquare: 0,
    kingRow: 0,
    kingCol: 4,
  },
};

export const whitePieces = [
  pieces.white.king,
  pieces.white.queen,
  pieces.white.rook,
  pieces.white.bishop,
  pieces.white.knight,
  pieces.white.pawn,
];

export const blackPieces = [
  pieces.black.king,
  pieces.black.queen,
  pieces.black.rook,
  pieces.black.bishop,
  pieces.black.knight,
  pieces.black.pawn,
];

// Function to reset the game state
export function resetGameState() {
  // Reset game variables
  selectedSquare = null;
  turn = PLAYER.WHITE;
  gameState.turn = PLAYER.WHITE;
  window.turn = PLAYER.WHITE;
  pendingPromotion = null;
  
  // Reset pieces' position
  pieces.white.kingRow = 7;
  pieces.white.kingCol = 4;
  pieces.black.kingRow = 0;
  pieces.black.kingCol = 4;
  pieces.white.checked = false;
  pieces.black.checked = false;
  
  // Reset game state object
  gameState.whiteCanCastleKingside = true;
  gameState.whiteCanCastleQueenside = true;
  gameState.blackCanCastleKingside = true;
  gameState.blackCanCastleQueenside = true;
  gameState.enPassantTarget = null;
  gameState.lastPawnDoubleMove = null;
  gameState.moveHistory = [];
  gameState.capturedPieces.white = [];
  gameState.capturedPieces.black = [];
  gameState.moveCount = 1;
  gameState.gameOver = false;
  gameState.check = false;
  gameState.checkmate = false;
  gameState.stalemate = false;
  gameState.fiftyMoveRule = false;
  gameState.insufficientMaterial = false;
  gameState.threefoldRepetition = false;
}

// Export window global properties that the AI module expects
window.turn = turn;
window.selectedSquare = null;
window.isAIMakingMove = false;
window.PLAYER = PLAYER; 
window.gameState = gameState; 
window.pieces = pieces; 