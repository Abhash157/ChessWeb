/**
 * gameState.js - Game state compatibility layer
 * 
 * This file provides backward compatibility by re-exporting from state.js
 * and providing the gameState proxy.
 */

import { getState, updateState, resetState, PLAYER, pieces, whitePieces, blackPieces } from './state.js';

// Re-export constants and objects from state.js for backward compatibility
export { PLAYER, pieces, whitePieces, blackPieces, resetState as resetGameState };

// Re-export the clock state (as a snapshot for compatibility)
// Modules should ideally get dynamic clock state from getState('clock')
export const CLOCK = getState('clock');

// Recreate gameState as a proxy to the centralized state
// This allows old code using gameState.someProp to still work.
export const gameState = new Proxy({}, {
  get: (target, prop) => {
    return getState(prop);
  },
  set: (target, prop, value) => {
    const update = {};
    update[prop] = value;
    updateState(update);
    return true;
  }
});

// Note: The individual mutable exports like 'turn' or 'selectedSquare' that were
// previously attempted via Object.defineProperty(exports, ...) are removed.
// Modules needing these must be updated to use:
// - getState('turn'), updateState({ turn: newTurn })
// - getState('selectedSquare'), updateState({ selectedSquare: newSelection })
// etc., from './state.js'.

// Window global properties are now exclusively handled by setupWindowCompatibility() in state.js.
// This ensures a single source of truth for window globals and avoids redundancy. 