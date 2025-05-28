/**
 * state.js - Centralized state management module
 * 
 * This module provides a central store for all game state
 * and functions to access and update it safely
 */

// State change event types
export const StateEvents = {
  TURN_CHANGE: 'turnChange',
  SELECTION_CHANGE: 'selectionChange',
  CHECK_STATUS_CHANGE: 'checkStatusChange',
  GAME_OVER: 'gameOver',
  BOARD_UPDATE: 'boardUpdate',
  AI_STATUS_CHANGE: 'aiStatusChange',
  CLOCK_UPDATE: 'clockUpdate'
};

// Game state constants
export const PLAYER = {
  WHITE: 0,
  BLACK: 1
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

// Create event emitter for state changes
const stateEventEmitter = new EventTarget();

// Private state object
const _state = {
  // Game state
  squares: [],
  selectedSquare: null,
  turn: PLAYER.WHITE,
  invalidOpacity: 0,
  pendingPromotion: null,
  
  // Castling rights
  whiteCanCastleKingside: true,
  whiteCanCastleQueenside: true,
  blackCanCastleKingside: true,
  blackCanCastleQueenside: true,
  
  // Special move tracking
  enPassantTarget: null,
  lastPawnDoubleMove: null,
  
  // Game history and status
  moveHistory: [],
  capturedPieces: {
    white: [],
    black: []
  },
  moveCount: 1,
  
  // Game ending conditions
  gameOver: false,
  check: false,
  checkmate: false,
  stalemate: false,
  fiftyMoveRule: false,
  insufficientMaterial: false,
  threefoldRepetition: false,
  
  // State snapshots
  castlingRightsSnapshot: null,
  
  // Clock state
  clock: {
    initialTime: 600, // 10 minutes in seconds
    whiteTime: 600,
    blackTime: 600,
    timerInterval: null,
    isRunning: false,
    activePlayer: PLAYER.WHITE,
    lowTimeThreshold: 60, // 1 minute in seconds
  },
  
  // AI state
  ai: {
    active: false,
    color: PLAYER.BLACK,
    difficulty: 10,
    thinking: false,
    waitingForMove: false,
    isMakingMove: false,
    isExecutingMove: false
  }
};

/**
 * Subscribe to state changes
 * @param {string} eventType - Event type from StateEvents
 * @param {function} callback - Function to call when event is triggered
 * @returns {function} Unsubscribe function
 */
export function subscribe(eventType, callback) {
  stateEventEmitter.addEventListener(eventType, (e) => callback(e.detail));
  
  // Return unsubscribe function
  return () => stateEventEmitter.removeEventListener(eventType, callback);
}

/**
 * Emit state change event
 * @param {string} eventType - Event type from StateEvents
 * @param {any} data - Event data
 */
function emitEvent(eventType, data) {
  stateEventEmitter.dispatchEvent(new CustomEvent(eventType, { detail: data }));
}

/**
 * Get a copy of the current state or a specific part of it
 * @param {string} [path] - Optional dot notation path to specific state slice
 * @returns {any} Copy of state or state slice
 */
export function getState(path) {
  if (!path) {
    // Return a copy of the entire state, but keep 'squares' as a direct reference
    const stateCopy = JSON.parse(JSON.stringify(_state));
    stateCopy.squares = _state.squares; // Replace copied 'squares' with the original
    return stateCopy;
  }
  
  // If specifically requesting 'squares', return the direct reference
  if (path === 'squares') {
    return _state.squares;
  }
  
  // Navigate to the specific state slice for other paths
  const keys = path.split('.');
  let current = _state;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`State path "${path}" does not exist`);
      return undefined;
    }
    current = current[key];
  }
  
  // Return a copy of the slice to prevent direct mutation,
  // unless it's a part of the state that shouldn't be stringified (though 'squares' is top-level here)
  return current === null ? null : 
         typeof current === 'object' && path !== 'selectedSquare' ? JSON.parse(JSON.stringify(current)) : current;
}

/**
 * Update state with changes and emit events
 * @param {object} changes - Object with changes to apply
 * @param {string} [eventType] - Optional specific event type to emit
 */
export function updateState(changes, eventType) {
  const eventsToEmit = new Set();
  
  // Apply changes
  Object.entries(changes).forEach(([key, value]) => {
    // Handle nested updates with dot notation (e.g., 'ai.active')
    if (key.includes('.')) {
      const path = key.split('.');
      let current = _state;
      
      // Navigate to the correct nesting level
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
          current[path[i]] = {}; // Create parent objects if they don't exist
        }
        current = current[path[i]];
      }
      
      // Update the value
      const finalKey = path[path.length - 1];
      current[finalKey] = value;
      
      // Determine events to emit based on the path
      if (path[0] === 'ai') {
        eventsToEmit.add(StateEvents.AI_STATUS_CHANGE);
      } else if (path[0] === 'clock') {
        eventsToEmit.add(StateEvents.CLOCK_UPDATE);
      }
    } else {
      // Direct property update
      _state[key] = value;
      
      // Add appropriate events based on what changed
      if (key === 'turn') {
        eventsToEmit.add(StateEvents.TURN_CHANGE);
      } else if (key === 'selectedSquare') { 
        // selectedSquare is a DOM element, should not be stringified when getting/setting individually
        eventsToEmit.add(StateEvents.SELECTION_CHANGE);
      } else if (key === 'check' || key === 'checkmate') {
        eventsToEmit.add(StateEvents.CHECK_STATUS_CHANGE);
      } else if (key === 'gameOver' || key === 'stalemate' || key === 'checkmate') {
        eventsToEmit.add(StateEvents.GAME_OVER);
      } else if (key === 'squares') { // 'squares' is an array of DOM elements
        eventsToEmit.add(StateEvents.BOARD_UPDATE);
      }
    }
  });
  
  // Emit specific event if provided
  if (eventType) {
    emitEvent(eventType, changes);
  } else {
    // Otherwise emit all detected events
    eventsToEmit.forEach(event => {
      emitEvent(event, changes);
    });
  }
}

// Make primary state functions globally available for script.js
window.getState = getState;
window.updateState = updateState;

/**
 * Reset the game state to initial values
 */
export function resetState() {
  // Reset game variables
  updateState({
    selectedSquare: null,
    turn: PLAYER.WHITE,
    pendingPromotion: null,
    whiteCanCastleKingside: true,
    whiteCanCastleQueenside: true,
    blackCanCastleKingside: true,
    blackCanCastleQueenside: true,
    enPassantTarget: null,
    lastPawnDoubleMove: null,
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    moveCount: 1,
    gameOver: false,
    check: false,
    checkmate: false,
    stalemate: false,
    fiftyMoveRule: false,
    insufficientMaterial: false,
    threefoldRepetition: false,
    'clock.whiteTime': _state.clock.initialTime,
    'clock.blackTime': _state.clock.initialTime,
    'clock.isRunning': false,
    'clock.activePlayer': PLAYER.WHITE
  });
  
  // Reset pieces' position
  pieces.white.kingRow = 7;
  pieces.white.kingCol = 4;
  pieces.black.kingRow = 0;
  pieces.black.kingCol = 4;
  pieces.white.checked = false;
  pieces.black.checked = false;
  
  // Emit board update event
  emitEvent(StateEvents.BOARD_UPDATE, { reset: true });
}

// For backward compatibility with existing code during transition
// This exposes the most crucial parts of the state to the window object
// but should be phased out as modules are updated
export function setupWindowCompatibility(squareClickHandler) {
  window.turn = _state.turn;
  window.selectedSquare = _state.selectedSquare;
  window.isAIMakingMove = _state.ai.isMakingMove;
  window.PLAYER = PLAYER;
  window.gameState = _state; // Expose the internal _state for compatibility if modules expect it
  window.pieces = pieces;
  window.aiActive = _state.ai.active;
  window.aiColor = _state.ai.color;
  window.aiDifficulty = _state.ai.difficulty;
  window.aiThinking = _state.ai.thinking;
  window.waitingForMove = _state.ai.waitingForMove;

  if (squareClickHandler) {
    window.squareClick = squareClickHandler;
  }
  
  // Update window objects when state changes
  subscribe(StateEvents.TURN_CHANGE, () => {
    window.turn = _state.turn;
  });
  
  subscribe(StateEvents.SELECTION_CHANGE, () => {
    window.selectedSquare = _state.selectedSquare;
  });
  
  subscribe(StateEvents.AI_STATUS_CHANGE, () => {
    window.aiActive = _state.ai.active;
    window.aiColor = _state.ai.color;
    window.aiDifficulty = _state.ai.difficulty;
    window.aiThinking = _state.ai.thinking;
    window.waitingForMove = _state.ai.waitingForMove;
    window.isAIMakingMove = _state.ai.isMakingMove;
  });
}

// Initialize window compatibility on module load
// We remove the direct call here. It will be called from main.js with the handler.
// setupWindowCompatibility(); 