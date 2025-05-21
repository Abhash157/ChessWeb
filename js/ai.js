/**
 * Chess AI Module
 * Integrates Stockfish chess engine for AI opponent
 */

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
    console.log(`getCurrentFEN: Accessing window.gameState.turn, value is: ${window.gameState.turn === window.PLAYER.WHITE ? 'White' : 'Black'} (raw: ${window.gameState.turn})`);
    
    // Board position (8 ranks)
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        
        for (let col = 0; col < 8; col++) {
            const piece = window.gameState.squares[row * 8 + col].textContent;
            
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
    const activeColorFEN = window.gameState.turn === window.PLAYER.WHITE ? ' w ' : ' b ';
    fen += activeColorFEN;
    console.log(`getCurrentFEN: Active color in FEN: '${activeColorFEN.trim()}'`);
    
    // Castling availability: KQkq or - if no castling is possible
    let castling = '';
    if (window.gameState.whiteCanCastleKingside) castling += 'K';
    if (window.gameState.whiteCanCastleQueenside) castling += 'Q';
    if (window.gameState.blackCanCastleKingside) castling += 'k';
    if (window.gameState.blackCanCastleQueenside) castling += 'q';
    fen += castling || '-';
    
    // En passant target square in algebraic notation
    fen += ' ';
    if (window.gameState.enPassantTarget) {
        const file = 'abcdefgh'[window.gameState.enPassantTarget.col];
        const rank = 8 - window.gameState.enPassantTarget.row;
        fen += file + rank;
    } else {
        fen += '-';
    }
    
    // Halfmove clock: number of halfmoves since the last capture or pawn advance
    fen += ' 0 '; // We don't track this yet, so assume 0
    
    // Fullmove number: incremented after Black's move
    const fullMoveCount = Math.floor((window.gameState.moveHistory.length + 1) / 2);
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
    if (piece === window.pieces.white.pawn) return 'P';
    if (piece === window.pieces.white.knight) return 'N';
    if (piece === window.pieces.white.bishop) return 'B';
    if (piece === window.pieces.white.rook) return 'R';
    if (piece === window.pieces.white.queen) return 'Q';
    if (piece === window.pieces.white.king) return 'K';
    
    // Black pieces
    if (piece === window.pieces.black.pawn) return 'p';
    if (piece === window.pieces.black.knight) return 'n';
    if (piece === window.pieces.black.bishop) return 'b';
    if (piece === window.pieces.black.rook) return 'r';
    if (piece === window.pieces.black.queen) return 'q';
    if (piece === window.pieces.black.king) return 'k';
    
    return '';
}

/**
 * Request a move from the AI engine
 */
function requestAIMove() {
    console.log('requestAIMove called, engineReady:', engineReady, 'aiThinking:', aiThinking, 'gameOver:', window.gameState.gameOver, 'current window.gameState.turn:', window.gameState.turn === window.PLAYER.WHITE ? 'White' : 'Black');
    
    if (!engineReady || !engine || aiThinking || window.gameState.gameOver) {
        console.log('Skipping AI move request - not ready or already thinking or game over');
        return;
    }
    
    console.log('Starting AI thinking process...');
    console.log(`requestAIMove: Using aiDifficulty = ${aiDifficulty} for this move calculation.`);
    
    aiThinking = true;
    waitingForMove = true;
    
    const fen = getCurrentFEN();
    
    sendToEngine('ucinewgame');
    sendToEngine(`position fen ${fen}`);
    
    // Calculate and set Stockfish Skill Level based on aiDifficulty (slider 1-15)
    // Skill Level (Stockfish 0-20)
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

    window.isAIMakingMove = true; // Set flag before simulating clicks
    console.log('window.isAIMakingMove set to true');

    // Parse the UCI move (e.g., "e2e4" to {fromCol: 4, fromRow: 6, toCol: 4, toRow: 4})
    const fromCol = uciMove.charCodeAt(0) - 97; // 'a' is 97 in ASCII
    const fromRow = 8 - parseInt(uciMove[1]); // Invert since our board is 0-indexed from top
    const toCol = uciMove.charCodeAt(2) - 97;
    const toRow = 8 - parseInt(uciMove[3]);

    console.log(`Parsed AI move: from (${fromRow},${fromCol}) to (${toRow},${toCol})`);

    // Get the squares
    const fromSquare = window.gameState.squares[fromRow * 8 + fromCol];
    const toSquare = window.gameState.squares[toRow * 8 + toCol];

    if (!fromSquare || !toSquare) {
        console.error('Could not find fromSquare or toSquare for AI move.');
        aiThinking = false;
        window.isAIMakingMove = false;
        return;
    }

    console.log('Simulating click on fromSquare:', fromSquare);
    await window.squareClick(fromSquare); // Use await if squareClick is async
    
    // Add a small delay if needed, or check selection state
    // if (!selectedSquare || selectedSquare !== fromSquare) {
    //     console.warn('fromSquare was not selected after click, AI move might fail.');
    // }

    console.log('Simulating click on toSquare:', toSquare);
    await window.squareClick(toSquare); // Use await if squareClick is async

    // Handle promotion if applicable
    if (uciMove.length > 4) {
        const promotionPieceChar = uciMove[4];
        console.log(`AI promotion detected. Piece: ${promotionPieceChar}`);
        // Ensure promotion modal handling in script.js can be triggered programmatically if needed
        // For now, assuming squareClick handles promotion selection if it's AI's turn
        // This might require a more direct way to select the promotion piece if squareClick
        // doesn't automatically open and allow selection for AI.
        
        // Find the correct promotion piece element and click it
        // This part needs to be robust and might need adjustment based on how promotionModal works
        const promotionPiecesElements = document.querySelectorAll('.promotion-piece');
        let pieceType;
        switch (promotionPieceChar) {
            case 'q': pieceType = 'queen'; break;
            case 'r': pieceType = 'rook'; break;
            case 'b': pieceType = 'bishop'; break;
            case 'n': pieceType = 'knight'; break;
            default: pieceType = 'queen'; // Default to queen
        }

        console.log(`Looking for promotion piece type: ${pieceType} for color: ${window.PLAYER[window.aiColor]}`);
        
        // Determine the color of the promoting player (which is aiColor)
        const promotingPlayerColorName = window.aiColor === window.PLAYER.WHITE ? 'white' : 'black';

        for (const pieceElement of promotionPiecesElements) {
            // Check if the piece is for the correct color and type
            if (pieceElement.classList.contains(`${promotingPlayerColorName}-promotion`) && 
                pieceElement.getAttribute('data-piece') === pieceType) {
                console.log('Found promotion piece element, simulating click:', pieceElement);
                pieceElement.click(); // This should trigger the promotion finalization
                break;
            }
        }
    }
    
    console.log('AI move simulation complete.');
    aiThinking = false; // Reset thinking flag
    window.isAIMakingMove = false; // Clear flag after move attempt
    console.log('window.isAIMakingMove set to false');
}

/**
 * Set the AI difficulty level
 * @param {number} level - Difficulty level (1-15)
 */
function setAIDifficulty(level) {
    aiDifficulty = Math.max(1, Math.min(15, level));
    console.log(`AI difficulty set to ${aiDifficulty}`);
}

/**
 * Toggle AI on/off
 * @param {boolean} active - Whether AI should be active
 */
function toggleAI(active) {
    window.aiActive = !!active; // Update global
    console.log(`AI Toggled: ${window.aiActive}`);
    
    if (window.aiActive) {
        if (!engineReady && !engine) {
            console.log('Initializing engine for the first time...');
            initEngine().then(ready => {
                console.log('Engine initialization result:', ready);
                if (ready && window.gameState.turn === window.aiColor) {
                    console.log('AI active and it is AI\'s turn, requesting move.');
                    requestAIMove();
                }
            }).catch(error => {
                console.error('Failed to initialize engine:', error);
                alert('Failed to initialize the chess engine. Please try refreshing the page or check console for errors.');
            });
        } else if (engineReady && window.gameState.turn === window.aiColor) {
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
    window.aiColor = color; // Update global
    console.log(`AI color set to: ${color === window.PLAYER.WHITE ? 'White' : 'Black'}`);
    
    // If it's already AI's turn, make a move
    if (window.aiActive && engineReady && window.gameState.turn === window.aiColor && !window.gameState.gameOver) {
        console.log('AI color changed, and it is now AI\'s turn. Requesting move.');
        requestAIMove();
    }
}

/**
 * Check if it's AI's turn and request a move if needed
 * This should be called after a human makes a move
 */
function checkAITurn() {
    console.log(`checkAITurn called. AI Active: ${window.aiActive}, Engine Ready: ${engineReady}, Current Turn: ${window.gameState.turn}, AI Color: ${window.aiColor}, Game Over: ${window.gameState.gameOver}`);
    if (window.aiActive && engineReady && window.gameState.turn === window.aiColor && !window.gameState.gameOver) {
        console.log('It is AI\'s turn. Requesting move with a delay...');
        // Add a small delay to make the AI move feel more natural
        setTimeout(requestAIMove, 300);
    }
} 