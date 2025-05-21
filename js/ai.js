/**
 * Chess AI Module
 * Integrates Stockfish chess engine for AI opponent
 */

import { getState, updateState, PLAYER, pieces } from './state.js';

let engine = null;
let engineReady = false;
let waitingForMove = false;
let aiDifficulty = 10; // Default: search depth 10
let aiThinking = false;
window.aiActive = false; // Expose to global scope
window.aiColor = 1; // Default to Black (corresponds to PLAYER.BLACK)
window.isAIMakingMove = false; // Flag for AI-driven moves

/**
 * Initialize the Stockfish engine
 */
async function initEngine() {
    try {
        console.log('Initializing Stockfish engine as a Web Worker...');
        
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
                    console.log('Stockfish engine initialized as Web Worker');
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
        console.log('Stockfish engine ready');
    }
    
    // Handle best move response
    if (message.startsWith('bestmove')) {
        console.log('Engine response:', message);
        if (waitingForMove && aiThinking) {
            const moveStr = message.split(' ')[1];
            waitingForMove = false;
            aiThinking = false;
            console.log(`AI decided on move: ${moveStr}`);
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
    const state = getState();
    console.log('requestAIMove called, engineReady:', engineReady, 'aiThinking:', aiThinking, 'gameOver:', state.gameOver, 'current turn:', state.turn === PLAYER.WHITE ? 'White' : 'Black');
    
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
    // Skill Level (Stockfish 0-20)
    const aiDifficulty = state.ai.difficulty;
    const calculatedSkillLevel = Math.round(((aiDifficulty - 1) / 14) * 20);
    console.log(`Mapping AI Difficulty (slider ${aiDifficulty}) to Stockfish Skill Level ${calculatedSkillLevel}`);
    sendToEngine(`setoption name Skill Level value ${calculatedSkillLevel}`);
    
    // Set search parameters (depth or movetime) based on aiDifficulty
    if (aiDifficulty <= 5) {
        // Lower difficulty (slider 1-5) also implies lower depth. Skill Level will make it play weaker.
        let engineDepth = aiDifficulty; // Depth 1 to 5
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
    console.log(`Attempting to make AI move: ${uciMove}`);
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

        if (!fromSquare || !toSquare) {
            console.error('Could not find fromSquare or toSquare for AI move.');
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
        
        // Update turn
        const newTurn = state.ai.color === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
        console.log(`Updating turn from ${state.ai.color} to ${newTurn}`);
        updateState({ turn: newTurn });
        
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
                pieces[opponentColor].checked = true;
                updateState({ check: true });
                
                // Highlight the king in check
                const kingSquare = state.squares[pieces[opponentColor].kingRow * 8 + pieces[opponentColor].kingCol];
                kingSquare.classList.add("dangerlight");
                
                // Check for checkmate
                if (isCheckmate(opponentColor)) {
                    console.log(`Checkmate! ${turn === PLAYER.WHITE ? 'Black' : 'White'} wins!`);
                    updateState({ 
                        gameOver: true, 
                        checkmate: true 
                    });
                }
            } else {
                // Clear previous check status
                pieces.white.checked = false;
                pieces.black.checked = false;
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
    } finally {
        // Always clean up flags
        aiThinking = false;
        updateState({ 
            'ai.isMakingMove': false,
            'ai.isExecutingMove': false
        });
        console.log('AI isMakingMove and isExecutingMove set to false');
    }
}

/**
 * Set the AI difficulty level
 * @param {number} level - Difficulty level (1-15)
 */
function setAIDifficulty(level) {
    const difficulty = Math.max(1, Math.min(15, level));
    updateState({ 'ai.difficulty': difficulty });
    console.log(`AI difficulty set to ${difficulty}`);
}

/**
 * Toggle AI on/off
 * @param {boolean} active - Whether AI should be active
 */
function toggleAI(active) {
    updateState({ 'ai.active': !!active });
    const state = getState();
    console.log(`AI Toggled: ${state.ai.active}`);
    
    if (state.ai.active) {
        if (!engineReady && !engine) {
            console.log('Initializing engine for the first time...');
            initEngine().then(ready => {
                console.log('Engine initialization result:', ready);
                const currentState = getState();
                if (ready && currentState.turn === currentState.ai.color) {
                    console.log('AI active and it is AI\'s turn, requesting move.');
                    requestAIMove();
                }
            }).catch(error => {
                console.error('Failed to initialize engine:', error);
                alert('Failed to initialize the chess engine. Please try refreshing the page or check console for errors.');
            });
        } else if (engineReady && state.turn === state.ai.color) {
            console.log('Engine already ready and it is AI\'s turn, requesting AI move...');
            requestAIMove();
        }
    } else if (engine) {
        console.log('AI deactivated. Engine remains loaded.');
        // Optionally, you could send 'stop' or 'quit' to the engine if desired
    }
}

/**
 * Set the color that the AI plays as
 * @param {number} color - PLAYER.WHITE or PLAYER.BLACK
 */
function setAIColor(color) {
    updateState({ 'ai.color': color });
    const state = getState();
    console.log(`AI color set to: ${state.ai.color === PLAYER.WHITE ? 'White' : 'Black'}`);
    
    // If it's already AI's turn, make a move
    if (state.ai.active && engineReady && state.turn === state.ai.color && !state.gameOver) {
        console.log('AI color changed, and it is now AI\'s turn. Requesting move.');
        requestAIMove();
    }
}

/**
 * Check if it's AI's turn and request a move if needed
 * This should be called after a human makes a move
 */
function checkAITurn() {
    // Get current state from state management
    const state = getState();
    console.log(`checkAITurn called. AI Active: ${state.ai.active}, Engine Ready: ${engineReady}, Current Turn: ${state.turn}, AI Color: ${state.ai.color}, Game Over: ${state.gameOver}`);
    
    if (state.ai.active && engineReady && state.turn === state.ai.color && !state.gameOver) {
        console.log('It is AI\'s turn. Requesting move with a delay...');
        // Add a small delay to make the AI move feel more natural
        setTimeout(requestAIMove, 300);
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