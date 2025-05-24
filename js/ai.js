/**
 * Chess AI Module
 * Integrates Stockfish chess engine for AI opponent
 */

import { getState, updateState, PLAYER, pieces } from './state.js';

// Game mode constants
const GAME_MODE = {
  LOCAL: 'local',   // Local 2-player
  AI: 'ai',         // Playing against AI
  ONLINE: 'online'  // Playing online against another player
};

// Make GAME_MODE available globally
window.GAME_MODE = GAME_MODE;

let engine = null;
let engineReady = false;
let waitingForMove = false;
// Initialize with a default difficulty if not set
let aiDifficulty = window.aiDifficulty || 10; // Default: search depth 10
let aiThinking = false;
window.aiActive = false; // Expose to global scope
window.aiColor = 1; // Default to Black (corresponds to PLAYER.BLACK)
window.isAIMakingMove = false; // Flag for AI-driven moves

/**
 * Initialize the Stockfish engine
 */
async function initEngine() {
    try {
        console.log('AI_LOG: initEngine - Initializing Stockfish engine as a Web Worker...');
        
        return new Promise((resolve, reject) => {
            try {
                // Create a web worker from the Stockfish script
                engine = new Worker('./js/stockfish/stockfish-nnue-16-single.js');
                
                // Set up message handlers
                engine.onmessage = function(event) {
                    handleEngineMessage(event.data);
                };
                
                engine.onerror = function(error) {
                    console.error('Stockfish worker error:', error);
                    reject(error);
                };
                
                // Override the sendToEngine function for Web Worker usage
                sendToEngine = function(command) {
                    if (engine) {
                        // console.log('To Engine:', command); // Reduced verbosity
                        engine.postMessage(command);
                    } else {
                        console.error('Engine not initialized');
                    }
                };
                
                // Initialize engine with standard settings
                sendToEngine('uci');
                sendToEngine('isready');
                
                // Resolve after a small delay to ensure engine had time to initialize
                setTimeout(() => {
                    console.log('AI_LOG: initEngine - Stockfish engine initialized as Web Worker');
                    engineReady = true;
                    resolve(true);
                }, 500);
                
            } catch (error) {
                console.error('Failed to create Stockfish worker:', error);
                reject(error);
            }
        });
    } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        return false;
    }
}

/**
 * Handle messages from the Stockfish engine
 * @param {string} message - Message from the engine
 */
function handleEngineMessage(message) {
    // console.log('Engine:', message); // Reduced verbosity, enable for deep debugging
    
    if (message === 'readyok') {
        engineReady = true;
        console.log('AI_LOG: handleEngineMessage - Stockfish engine ready');
    }
    
    // Handle best move response
    if (message.startsWith('bestmove')) {
        console.log('AI_LOG: handleEngineMessage - Engine response (bestmove):', message);
        if (waitingForMove && aiThinking) {
            const moveStr = message.split(' ')[1];
            waitingForMove = false;
            aiThinking = false;
            console.log(`AI_LOG: handleEngineMessage - AI decided on move: ${moveStr}`);
            makeAIMove(moveStr);
        }
    }
}

/**
 * Send a command to the Stockfish engine
 * @param {string} command - Command to send
 */
function sendToEngine(command) {
    if (engine) {
        console.log('To Engine:', command);
        engine.postMessage(command);
    } else {
        console.error('Engine not initialized');
    }
}

/**
 * Convert current board position to FEN notation
 * @returns {string} FEN string representing current board position
 */
function getCurrentFEN() {
    let fen = '';
    const state = getState();
    console.log(`getCurrentFEN: Current turn is: ${state.turn === PLAYER.WHITE ? 'White' : 'Black'} (raw: ${state.turn})`);
    
    // Board position (8 ranks)
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        
        for (let col = 0; col < 8; col++) {
            const piece = state.squares[row * 8 + col].textContent;
            
            if (piece === '') {
                emptyCount++;
            } else {
                // If there were empty squares before this piece, add the count
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                
                // Add the piece symbol (uppercase for white, lowercase for black)
                const pieceSymbol = getFENSymbol(piece);
                fen += pieceSymbol;
            }
        }
        
        // Add any remaining empty squares for this rank
        if (emptyCount > 0) {
            fen += emptyCount;
        }
        
        // Add rank separator (except after the last rank)
        if (row < 7) {
            fen += '/';
        }
    }
    
    // Active color: w or b
    const activeColorFEN = state.turn === PLAYER.WHITE ? ' w ' : ' b ';
    fen += activeColorFEN;
    console.log(`getCurrentFEN: Active color in FEN: '${activeColorFEN.trim()}'`);
    
    // Castling availability: KQkq or - if no castling is possible
    let castling = '';
    if (state.whiteCanCastleKingside) castling += 'K';
    if (state.whiteCanCastleQueenside) castling += 'Q';
    if (state.blackCanCastleKingside) castling += 'k';
    if (state.blackCanCastleQueenside) castling += 'q';
    fen += castling || '-';
    
    // En passant target square in algebraic notation
    fen += ' ';
    if (state.enPassantTarget) {
        const file = 'abcdefgh'[state.enPassantTarget.col];
        const rank = 8 - state.enPassantTarget.row;
        fen += file + rank;
    } else {
        fen += '-';
    }
    
    // Halfmove clock: number of halfmoves since the last capture or pawn advance
    fen += ' 0 '; // We don't track this yet, so assume 0
    
    // Fullmove number: incremented after Black's move
    const fullMoveCount = Math.floor((state.moveHistory.length + 1) / 2);
    fen += fullMoveCount;
    
    console.log(`getCurrentFEN: Generated FEN: ${fen}`);
    return fen;
}

/**
 * Convert a Unicode chess piece to FEN symbol
 * @param {string} piece - Unicode chess piece character
 * @returns {string} FEN symbol (P,N,B,R,Q,K for white; p,n,b,r,q,k for black)
 */
function getFENSymbol(piece) {
    // White pieces
    if (piece === pieces.white.pawn) return 'P';
    if (piece === pieces.white.knight) return 'N';
    if (piece === pieces.white.bishop) return 'B';
    if (piece === pieces.white.rook) return 'R';
    if (piece === pieces.white.queen) return 'Q';
    if (piece === pieces.white.king) return 'K';
    
    // Black pieces
    if (piece === pieces.black.pawn) return 'p';
    if (piece === pieces.black.knight) return 'n';
    if (piece === pieces.black.bishop) return 'b';
    if (piece === pieces.black.rook) return 'r';
    if (piece === pieces.black.queen) return 'q';
    if (piece === pieces.black.king) return 'k';
    
    return '';
}

/**
 * Request a move from the AI engine
 */
function requestAIMove() {
    console.log("AI_LOG: requestAIMove - Entered function."); // New log
    const state = getState();
    console.log('AI_LOG: requestAIMove - engineReady:', engineReady, 'aiThinking:', aiThinking, 'gameOver:', state.gameOver, 'current turn:', state.turn === PLAYER.WHITE ? 'White' : 'Black');
    
    if (!engineReady || !engine || aiThinking || state.gameOver) {
        console.log('Skipping AI move request - not ready or already thinking or game over');
        return;
    }
    
    console.log('Starting AI thinking process...');
    console.log(`requestAIMove: Using aiDifficulty = ${state.ai.difficulty} for this move calculation.`);

    aiThinking = true;
    waitingForMove = true;

    const fen = getCurrentFEN();
    sendToEngine('ucinewgame');
    sendToEngine(`position fen ${fen}`);

    // Calculate and set Stockfish Skill Level based on aiDifficulty (slider 1-15)
    const currentState = getState();
    // Ensure we have a valid difficulty level
    const currentAiDifficulty = typeof currentState.ai?.difficulty === 'number' ? 
        currentState.ai.difficulty : 
        (typeof window.aiDifficulty === 'number' ? window.aiDifficulty : 10);

    const calculatedSkillLevel = Math.max(0, Math.min(20, Math.round((currentAiDifficulty - 1) / 14 * 20)));
    console.log(`Mapping AI Difficulty (slider ${currentAiDifficulty}) to Stockfish Skill Level ${calculatedSkillLevel}`);
    sendToEngine(`setoption name Skill Level value ${calculatedSkillLevel}`);

    // Set search parameters (depth or movetime) based on aiDifficulty
    if (currentAiDifficulty <= 5) {
        // Lower difficulty (slider 1-5) uses lower depth
        const engineDepth = Math.max(1, Math.min(5, currentAiDifficulty));
        console.log(`Engine: go depth ${engineDepth} (Skill Level: ${calculatedSkillLevel})`);
        sendToEngine(`go depth ${engineDepth}`);
    } else {
        // Higher difficulty (slider 6-15) uses movetime. Skill Level also scales up.
        // Thinking time increases from 0.5s (for slider level 6) to 5s (for slider level 15).
        const thinkTime = (aiDifficulty - 5) * 500; 
        console.log(`Engine: go movetime ${thinkTime}ms (Skill Level: ${calculatedSkillLevel})`);
        sendToEngine(`go movetime ${thinkTime}`);
    }
}

/**
 * Executes the move chosen by the AI
 * @param {string} uciMove - Move in UCI format (e.g., "e2e4")
 */
async function makeAIMove(uciMove) {
    console.log(`AI_LOG: makeAIMove - Attempting to make AI move: ${uciMove}`);
    window.isAIMakingMove = true; // Set flag before AI interacts with board

    if (!uciMove || uciMove.length < 4) {
        console.error('Invalid AI move string:', uciMove);
        aiThinking = false; // Reset thinking flag
        return;
    }

    try {
        // Update state to indicate AI is making a move
        updateState({ 
            'ai.isMakingMove': true,
            'ai.isExecutingMove': true
        });
        console.log('AI isMakingMove and isExecutingMove set to true');

        // Parse the UCI move (e.g., "e2e4" to {fromCol: 4, fromRow: 6, toCol: 4, toRow: 4})
        const fromCol = uciMove.charCodeAt(0) - 97; // 'a' is 97 in ASCII
        const fromRow = 8 - parseInt(uciMove[1]); // Invert since our board is 0-indexed from top
        const toCol = uciMove.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(uciMove[3]);

        console.log(`Parsed AI move: from (${fromRow},${fromCol}) to (${toRow},${toCol})`);

        // Get current state
        const state = getState();
        const fromSquare = state.squares[fromRow * 8 + fromCol];
        const toSquare = state.squares[toRow * 8 + toCol];

        console.log(`AI_LOG: makeAIMove - Identified fromSquare:`, fromSquare, `toSquare:`, toSquare);

        if (!fromSquare || !toSquare) {
            console.error(`AI_LOG: makeAIMove - ERROR: Could not find squares for move: ${uciMove}`);
            window.isAIMakingMove = false;
            aiThinking = false; // Reset thinking flag
            return;
        }

        // Get the piece from the source square
        const piece = fromSquare.textContent;
        if (!piece) {
            console.error('No piece on source square');
            return;
        }

        // Make the move directly instead of simulating clicks
        // First, store the current turn
        const currentTurn = state.turn;
        
        // Force turn to match AI color to avoid move validation issues
        updateState({ turn: state.ai.color });
        
        const { squares } = state;
        const fromIndex = fromRow * 8 + fromCol;
        const toIndex = toRow * 8 + toCol;
        
        // Import needed modules directly
        const { makeMove } = await import('./moves/moveExecutor.js');
        const { cleanupAfterMove } = await import('./board.js');
        
        // Execute the move directly
        console.log('AI about to execute move:', { from: `${fromRow},${fromCol}`, to: `${toRow},${toCol}`, piece });
        
        await makeMove(fromSquare, toSquare, fromRow, fromCol, toRow, toCol);
        console.log('Move executed, cleaning up');

        // Clean up after move
        cleanupAfterMove();
        
        // Update turn - switch to the other player
        const newTurn = state.ai.color === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
        console.log(`AI move completed. Updating turn from ${state.ai.color} to ${newTurn}`);
        
        // Important: Update window.turn directly to ensure it's immediately available
        window.turn = newTurn;
        
        updateState({ 
            turn: newTurn,
            'ai.isMakingMove': false,
            'ai.isExecutingMove': false
        }, 'TURN_CHANGE');
        
        // Verify turn was updated correctly
        console.log(`AI_LOG: makeAIMove - Turn updated. window.turn is now ${window.turn}`);
        
        aiThinking = false; // Reset thinking flag immediately after turn change
        
        // Update UI and check game status
        const { updateGameStatus } = await import('./ui/status.js');
        const { updateMoveHistory } = await import('./ui/history.js');
        const { updateCapturedPieces } = await import('./ui/capturedPieces.js');
        const { isKingInCheck, isCheckmate } = await import('./moves/checkDetection.js');

        // Custom game status check that doesn't check for stalemate
        // This avoids the issues with the hasLegalMoves function
        function customCheckGameStatus() {
            const state = getState();
            const { turn } = state;
            
            // Check if the opponent's king is in check
            const opponentColor = turn === PLAYER.WHITE ? 'black' : 'white';
            const kingInCheck = isKingInCheck(pieces[opponentColor].kingRow, pieces[opponentColor].kingCol, opponentColor);
            
            if (kingInCheck) {
                // Update check status
                updateState({ check: true });
                
                // Check for checkmate
                if (isCheckmate(opponentColor)) {
                    console.log(`Checkmate! ${turn === PLAYER.WHITE ? 'White' : 'Black'} wins!`);
                    updateState({ 
                        gameOver: true, 
                        checkmate: true 
                    });
                }
            } else {
                // Clear previous check status
                updateState({ check: false });
                
                // We skip stalemate check here
            }
            
            // If game is over, stop the clock
            if (state.gameOver) {
                clearInterval(state.clock.timerInterval);
                updateState({ 'clock.isRunning': false });
            }
        }

        // Use our custom function instead of importing checkGameStatus
        customCheckGameStatus();
        
        // Update UI
        updateGameStatus();
        updateMoveHistory();
        
        // Check if a piece was captured
        const capturedPiece = state.capturedPieces.white.length > 0 || state.capturedPieces.black.length > 0;
        if (capturedPiece) {
            updateCapturedPieces();
        }
        
        console.log('AI move execution completed successfully');
    } catch (error) {
        console.error('Error during AI move execution:', error);
        // In case of error, ensure we reset all flags
        aiThinking = false;
        window.isAIMakingMove = false;
        updateState({
            'ai.isMakingMove': false,
            'ai.isExecutingMove': false,
            'turn': window.aiColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        }, 'TURN_CHANGE');
    }
}

/**
 * Set the AI difficulty level
 * @param {number} level - Difficulty level (1-15)
 */
function setAIDifficulty(level) {
    console.log(`AI_LOG: setAIDifficulty - Setting AI difficulty to: ${level}`);
    aiDifficulty = parseInt(level);
    updateState({ ai: { difficulty: aiDifficulty } });
}

/**
 * Toggle AI on/off
 * @param {boolean} active - Whether AI should be active
 */
function toggleAI(active) {
    console.log(`AI_LOG: toggleAI - Called with active: ${active}`);
    window.aiActive = active;
    
    // Set the game mode based on AI activation
    if (active) {
        // Set game mode to AI when activating AI
        window.currentGameMode = window.GAME_MODE.AI;
        console.log("AI_LOG: toggleAI - Game mode set to AI");
    } else {
        // Set game mode back to LOCAL when deactivating AI
        window.currentGameMode = window.GAME_MODE.LOCAL;
        console.log("AI_LOG: toggleAI - Game mode set to LOCAL");
    }
    
    updateState({ 
        ai: { active: active },
        gameMode: active ? 'ai' : 'local'
    });

    if (active && !engineReady) {
        console.log("AI_LOG: toggleAI - AI activated, engine not ready. Initializing engine.");
        initEngine().then(ready => {
            if (ready) {
                console.log("AI_LOG: toggleAI - Engine initialized successfully after toggle.");
                checkAITurn(); // Check if AI should move immediately
            } else {
                console.error("AI_LOG: toggleAI - Engine failed to initialize after toggle.");
                window.aiActive = false; // Revert state if engine fails
                window.currentGameMode = window.GAME_MODE.LOCAL;
                updateState({ 
                    ai: { active: false },
                    gameMode: 'local'
                });
            }
        });
    } else if (active && engineReady) {
        console.log("AI_LOG: toggleAI - AI activated, engine already ready.");
        checkAITurn();
    } else {
        console.log("AI_LOG: toggleAI - AI deactivated.");
        
        // If AI is turned off while AI is thinking, send stop command
        if (aiThinking) {
            sendToEngine('stop');
            console.log("AI_LOG: toggleAI - Sent 'stop' to engine.");
            aiThinking = false;
            waitingForMove = false;
        }
    }
}

/**
 * Set the color that the AI plays as
 * @param {number} color - PLAYER.WHITE or PLAYER.BLACK
 */
function setAIColor(color) {
    console.log(`AI_LOG: setAIColor - Setting AI color to: ${color === PLAYER.WHITE ? 'White' : 'Black'}`);
    window.aiColor = color;
    updateState({ ai: { color: color } });
    // If AI is active, check if it's now its turn with the new color
    if (window.aiActive) {
        console.log("AI_LOG: setAIColor - AI is active, calling checkAITurn.");
        checkAITurn();
    }
}

/**
 * Check if it's AI's turn and request a move if needed
 * This should be called after a human makes a move
 */
function checkAITurn() {
    const state = getState(); // Get current game state from state.js
    console.log(`AI_LOG: checkAITurn - Called. aiActive: ${window.aiActive}, Current Turn: ${state.turn === PLAYER.WHITE ? 'White' : 'Black'} (raw: ${state.turn}), AI Color: ${window.aiColor === PLAYER.WHITE ? 'White' : 'Black'}, Game Over: ${state.gameOver}`);
    
    if (window.aiActive && state.turn === window.aiColor && !state.gameOver && !aiThinking) {
        console.log("AI_LOG: checkAITurn - Conditions met. Requesting AI move.");
        requestAIMove();
    } else {
        let reasons = [];
        if (!window.aiActive) reasons.push("AI not active");
        if (state.turn !== window.aiColor) reasons.push("Not AI's turn");
        if (state.gameOver) reasons.push("Game is over");
        if (aiThinking) reasons.push("AI is already thinking");
        console.log(`AI_LOG: checkAITurn - Conditions not met for AI move. Reasons: ${reasons.join('; ')}`);
    }
}

// Export functions for use in other modules
export {
  initEngine,
  requestAIMove,
  setAIDifficulty,
  toggleAI,
  setAIColor,
  checkAITurn
};

// Expose functions to window for backward compatibility
window.initEngine = initEngine;
window.requestAIMove = requestAIMove;
window.setAIDifficulty = setAIDifficulty;
window.toggleAI = toggleAI;
window.setAIColor = setAIColor;
window.checkAITurn = checkAITurn;