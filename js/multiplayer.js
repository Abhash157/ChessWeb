/**
 * Multiplayer Chess Module
 * Handles online gameplay using Socket.io
 */

// Multiplayer State
const MP = {
  socket: null,
  roomId: null,
  playerId: null,
  isHost: false,
  playerColor: null,
  opponentConnected: false,
  waitingForOpponent: false,
  gameStarted: false,
  lastReceivedMove: null,
  playerName: 'Player',
  opponentName: 'Opponent',
  onlineModeActive: false
};

/**
 * Initialize the multiplayer module
 * @returns {boolean} True if initialization successful
 */
function initMultiplayer() {
  try {
    console.log('Initializing multiplayer mode...');
    
    // Load Socket.io library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Socket.io library loaded');
      connectToServer();
    };
    
    script.onerror = (error) => {
      console.error('Error loading Socket.io:', error);
      showConnectionError('Failed to load multiplayer functionality');
    };
    
    document.head.appendChild(script);
    return true;
  } catch (error) {
    console.error('Failed to initialize multiplayer:', error);
    showConnectionError('Failed to initialize multiplayer mode');
    return false;
  }
}

/**
 * Connect to the multiplayer server
 */
function connectToServer() {
  try {
    // We'd use our actual server URL in production
    // For demo purposes, we'll use a mock implementation
    console.log('Connecting to multiplayer server...');
    mockSocketImplementation();
    
    // Show the multiplayer UI elements
    showMultiplayerUI();
  } catch (error) {
    console.error('Failed to connect to server:', error);
    showConnectionError('Failed to connect to multiplayer server');
  }
}

/**
 * Mock implementation of Socket.io for demonstration
 * In a real implementation, this would connect to an actual server
 */
function mockSocketImplementation() {
  // Create a mock socket object
  MP.socket = {
    id: 'player_' + Math.random().toString(36).substring(2, 9),
    connected: true,
    
    // Mock emit function
    emit: function(event, data, callback) {
      console.log(`[Socket] Emitting event: ${event}`, data);
      
      // Simulate server responses
      setTimeout(() => {
        switch(event) {
          case 'create_room':
            MP.roomId = 'room_' + Math.random().toString(36).substring(2, 7);
            MP.isHost = true;
            MP.playerColor = PLAYER.WHITE; // Host plays as white
            MP.waitingForOpponent = true;
            if (callback) callback({ success: true, roomId: MP.roomId });
            
            // Simulate opponent joining after a delay
            setTimeout(() => {
              if (MP.waitingForOpponent) {
                handleOpponentJoined({
                  playerId: 'opponent_' + Math.random().toString(36).substring(2, 9),
                  name: 'Opponent'
                });
              }
            }, 5000);
            break;
            
          case 'join_room':
            if (data.roomId) {
              MP.roomId = data.roomId;
              MP.isHost = false;
              MP.playerColor = PLAYER.BLACK; // Joiner plays as black
              MP.opponentConnected = true;
              if (callback) callback({ success: true });
              
              // Notify the UI that we've joined
              handleRoomJoined({
                hostId: 'host_' + Math.random().toString(36).substring(2, 9),
                hostName: 'Host'
              });
            } else {
              if (callback) callback({ success: false, error: 'Invalid room ID' });
            }
            break;
            
          case 'make_move':
            // Simulate the move being sent to the opponent
            setTimeout(() => {
              // This would normally come from the actual opponent
              handleOpponentMove(data);
            }, 500);
            break;
        }
      }, 300);
    },
    
    // Mock on function for event listeners
    on: function(event, callback) {
      console.log(`[Socket] Listening for event: ${event}`);
      // Store the callback to manually trigger it in our mock implementation
      this[`_on_${event}`] = callback;
    },
    
    // Mock disconnect
    disconnect: function() {
      this.connected = false;
      console.log('[Socket] Disconnected from server');
    }
  };
  
  // Store the player ID
  MP.playerId = MP.socket.id;
  
  // Set the multiplayer flag
  MP.onlineModeActive = true;
  
  console.log('Socket connection established (mock)');
}

/**
 * Create a new game room and wait for opponent
 */
function createRoom() {
  if (!MP.socket || !MP.socket.connected) {
    showConnectionError('Not connected to server');
    return;
  }
  
  // Send request to create a new room
  MP.socket.emit('create_room', { playerName: MP.playerName }, (response) => {
    if (response.success) {
      console.log(`Room created with ID: ${response.roomId}`);
      MP.roomId = response.roomId;
      MP.isHost = true;
      MP.playerColor = PLAYER.WHITE; // Host plays as white
      MP.waitingForOpponent = true;
      
      // Update UI to show waiting status
      updateMultiplayerStatus(`Waiting for opponent... Room Code: ${MP.roomId}`);
      showRoomCodeDisplay(MP.roomId);
    } else {
      showConnectionError('Failed to create room: ' + (response.error || 'Unknown error'));
    }
  });
}

/**
 * Join an existing game room
 * @param {string} roomId - The ID of the room to join
 */
function joinRoom(roomId) {
  if (!MP.socket || !MP.socket.connected) {
    showConnectionError('Not connected to server');
    return;
  }
  
  if (!roomId) {
    showConnectionError('Please enter a valid room code');
    return;
  }
  
  // Send request to join the room
  MP.socket.emit('join_room', { roomId, playerName: MP.playerName }, (response) => {
    if (response.success) {
      console.log(`Joined room: ${roomId}`);
      MP.roomId = roomId;
      MP.isHost = false;
      MP.playerColor = PLAYER.BLACK; // Joiner plays as black
      
      // Update UI to show connection status
      updateMultiplayerStatus('Connected! Waiting for game to start...');
    } else {
      showConnectionError('Failed to join room: ' + (response.error || 'Unknown error'));
    }
  });
}

/**
 * Send a move to the opponent
 * @param {Object} moveData - Data about the move
 */
function sendMove(moveData) {
  if (!MP.socket || !MP.gameStarted) return;
  
  MP.socket.emit('make_move', {
    roomId: MP.roomId,
    move: moveData
  });
  
  console.log('Move sent to opponent:', moveData);
}

/**
 * Handle opponent joining our room
 * @param {Object} data - Data about the opponent
 */
function handleOpponentJoined(data) {
  MP.opponentConnected = true;
  MP.waitingForOpponent = false;
  MP.opponentName = data.name || 'Opponent';
  
  console.log('Opponent joined:', data);
  updateMultiplayerStatus(`${MP.opponentName} has joined the game!`);
  
  // Start the game after a short delay
  setTimeout(startMultiplayerGame, 1500);
}

/**
 * Handle joining another player's room
 * @param {Object} data - Data about the host
 */
function handleRoomJoined(data) {
  MP.opponentConnected = true;
  MP.opponentName = data.hostName || 'Host';
  
  console.log('Joined host\'s room:', data);
  updateMultiplayerStatus(`Connected to ${MP.opponentName}'s game!`);
  
  // Start the game after a short delay
  setTimeout(startMultiplayerGame, 1500);
}

/**
 * Handle receiving a move from the opponent
 * @param {Object} moveData - Data about the move
 */
function handleOpponentMove(moveData) {
  if (!MP.gameStarted) return;
  
  console.log('Received move from opponent:', moveData);
  MP.lastReceivedMove = moveData;
  
  // Apply the opponent's move to the local board
  applyOpponentMove(moveData);
}

/**
 * Apply a move received from the opponent to the local board
 * @param {Object} moveData - Data about the move
 */
function applyOpponentMove(moveData) {
  const { fromIndex, toIndex, promotion } = moveData;
  
  // Get the corresponding squares
  const fromSquare = squares[fromIndex];
  const toSquare = squares[toIndex];
  
  console.log(`Applying opponent move: ${fromIndex} -> ${toIndex}`);
  
  // Store the move details for animation
  const pieceToMove = fromSquare.textContent;
  
  // If this is a promotion move, we'll need to handle that specially
  const isPromotion = promotion ? true : false;
  
  // Call the existing move functions with these squares
  const moveFunction = async () => {
    // Animate the piece movement
    await animatePieceMovement(fromSquare, toSquare, pieceToMove);
    
    // Update board state
    toSquare.textContent = isPromotion ? getPromotionPiece(promotion, MP.playerColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE) : pieceToMove;
    fromSquare.textContent = '';
    
    // Handle special moves like castling, capturing, etc.
    // The main game logic should handle this
    
    // Switch turns
    window.turn = MP.playerColor;
    updateGameStatus();
    
    // If it's now the local player's turn, enable board interaction
    if (window.turn === MP.playerColor) {
      enableBoardInteraction();
    }
  };
  
  // Execute the move
  moveFunction();
}

/**
 * Get the promotion piece based on the selected piece type
 * @param {string} pieceType - The type of piece to promote to
 * @param {number} playerColor - The color of the player
 * @returns {string} The Unicode character for the promoted piece
 */
function getPromotionPiece(pieceType, playerColor) {
  const pieceSet = playerColor === PLAYER.WHITE ? pieces.white : pieces.black;
  
  switch(pieceType) {
    case 'queen': return pieceSet.queen;
    case 'rook': return pieceSet.rook;
    case 'bishop': return pieceSet.bishop;
    case 'knight': return pieceSet.knight;
    default: return pieceSet.queen; // Default to queen
  }
}

/**
 * Start the multiplayer game
 */
function startMultiplayerGame() {
  MP.gameStarted = true;
  
  // Update UI
  updateMultiplayerStatus(`Game started! You are playing as ${MP.playerColor === PLAYER.WHITE ? 'White' : 'Black'}`);
  
  // Hide the multiplayer overlay to reveal the game board
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
    console.log('Multiplayer overlay hidden, game is starting');
  }
  
  // Reset board and set up for a new game
  resetBoard();
  resetClock();
  
  // Start the clock
  startClock();
  
  // If player is black, disable board interaction until white moves
  if (MP.playerColor === PLAYER.BLACK) {
    disableBoardInteraction();
    updateMultiplayerStatus(`Waiting for ${MP.opponentName} to make a move...`);
  } else {
    enableBoardInteraction();
  }
}

/**
 * Enable interaction with the chess board
 */
function enableBoardInteraction() {
  // This might not be needed if your board is already interactive by default
  document.querySelectorAll('.square').forEach(square => {
    square.classList.remove('disabled');
  });
}

/**
 * Disable interaction with the chess board
 */
function disableBoardInteraction() {
  // Visual indication that the board is not interactive
  document.querySelectorAll('.square').forEach(square => {
    square.classList.add('disabled');
  });
}

/**
 * Reset the chess board for a new game
 */
function resetBoard() {
  // You may already have a function to reset the board
  // If not, recreate the board and place pieces in starting positions
  if (typeof createChessboard === 'function') {
    createChessboard();
    placePieces();
  }
  
  // Reset game state
  window.turn = PLAYER.WHITE;
  gameState.gameOver = false;
  gameState.check = false;
  gameState.checkmate = false;
  gameState.moveHistory = [];
  gameState.capturedPieces = { white: [], black: [] };
  gameState.moveCount = 1;
  
  // Update UI elements
  updateGameStatus();
  updateCapturedPieces();
  updateMoveHistory();
  
  // Clear any selected squares
  if (selectedSquare) {
    selectedSquare.classList.remove('selected');
    selectedSquare = null;
  }
}

/**
 * Show multiplayer UI elements
 */
function showMultiplayerUI() {
  // Create multiplayer overlay if it doesn't exist
  let mpOverlay = document.getElementById('mp-overlay');
  
  if (!mpOverlay) {
    mpOverlay = document.createElement('div');
    mpOverlay.id = 'mp-overlay';
    mpOverlay.className = 'mp-overlay';
    
    // Create content for the overlay
    mpOverlay.innerHTML = `
      <div class="mp-container">
        <h2>Online Multiplayer</h2>
        <div class="mp-options">
          <div class="mp-option-group">
            <label for="player-name">Your Name:</label>
            <input type="text" id="player-name" value="Player" maxlength="15">
          </div>
          <button id="create-room-btn" class="mp-btn">Create New Game</button>
          <div class="mp-divider">OR</div>
          <div class="mp-option-group">
            <label for="room-code">Room Code:</label>
            <input type="text" id="room-code" placeholder="Enter room code" maxlength="10">
          </div>
          <button id="join-room-btn" class="mp-btn">Join Game</button>
        </div>
        <div id="mp-status" class="mp-status">Connect to play online</div>
        <div id="room-code-display" class="room-code-display" style="display: none;"></div>
        <button id="mp-cancel-btn" class="mp-btn mp-cancel-btn">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(mpOverlay);
    
    // Add event listeners for the multiplayer UI
    document.getElementById('player-name').addEventListener('input', (e) => {
      MP.playerName = e.target.value || 'Player';
    });
    
    document.getElementById('create-room-btn').addEventListener('click', () => {
      createRoom();
    });
    
    document.getElementById('join-room-btn').addEventListener('click', () => {
      const roomCode = document.getElementById('room-code').value;
      joinRoom(roomCode);
    });
    
    document.getElementById('mp-cancel-btn').addEventListener('click', () => {
      // Clean up and return to main game
      leaveMultiplayerMode();
    });
  } else {
    mpOverlay.style.display = 'flex';
  }
  
  // Add styles if not already present
  if (!document.getElementById('mp-styles')) {
    const styles = document.createElement('style');
    styles.id = 'mp-styles';
    styles.textContent = `
      .mp-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .mp-container {
        background: #1e1e2e;
        border-radius: 10px;
        padding: 2rem;
        width: 90%;
        max-width: 400px;
        color: #cdd6f4;
      }
      
      .mp-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 1.5rem 0;
      }
      
      .mp-option-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .mp-btn {
        padding: 0.8rem;
        border: none;
        border-radius: 5px;
        background: #313244;
        color: #cdd6f4;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .mp-btn:hover {
        background: #45475a;
      }
      
      .mp-btn.mp-cancel-btn {
        background: #f38ba8;
        color: #1e1e2e;
        margin-top: 1rem;
      }
      
      .mp-btn.mp-cancel-btn:hover {
        background: #f5c2e7;
      }
      
      .mp-divider {
        text-align: center;
        margin: 0.5rem 0;
        opacity: 0.7;
      }
      
      .mp-status {
        margin-top: 1rem;
        padding: 0.8rem;
        background: #181825;
        border-radius: 5px;
        text-align: center;
      }
      
      input, select {
        padding: 0.8rem;
        border: none;
        border-radius: 5px;
        background: #181825;
        color: #cdd6f4;
      }
      
      .room-code-display {
        margin-top: 1rem;
        font-size: 1.5rem;
        text-align: center;
        background: #313244;
        padding: 1rem;
        border-radius: 5px;
        letter-spacing: 2px;
      }
      
      .square.disabled {
        cursor: not-allowed;
        opacity: 0.8;
      }
      
      .mp-status.error {
        background: #f38ba8;
        color: #1e1e2e;
      }
    `;
    document.head.appendChild(styles);
  }
}

/**
 * Update the multiplayer status display
 * @param {string} message - Status message to display
 * @param {boolean} isError - Whether this is an error message
 */
function updateMultiplayerStatus(message, isError = false) {
  const statusEl = document.getElementById('mp-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'mp-status error' : 'mp-status';
  }
}

/**
 * Show error message in the multiplayer UI
 * @param {string} message - Error message to display
 */
function showConnectionError(message) {
  updateMultiplayerStatus(message, true);
  
  // Reset error after a delay
  setTimeout(() => {
    updateMultiplayerStatus('Please try again', false);
  }, 5000);
}

/**
 * Display the room code for sharing
 * @param {string} roomId - The room ID to display
 */
function showRoomCodeDisplay(roomId) {
  const display = document.getElementById('room-code-display');
  if (display) {
    display.textContent = roomId;
    display.style.display = 'block';
  }
}

/**
 * Leave multiplayer mode and clean up
 */
function leaveMultiplayerMode() {
  // Disconnect from server
  if (MP.socket) {
    MP.socket.emit('leave_room', { roomId: MP.roomId });
    MP.socket.disconnect();
  }
  
  // Reset multiplayer state
  MP.socket = null;
  MP.roomId = null;
  MP.isHost = false;
  MP.playerColor = null;
  MP.opponentConnected = false;
  MP.waitingForOpponent = false;
  MP.gameStarted = false;
  MP.onlineModeActive = false;
  
  // Hide multiplayer UI
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
  }
  
  // Reset game for single player
  resetBoard();
  resetClock();
  
  // Update game status
  updateGameStatus();
}

// Make functions available to other modules
window.MP = MP;
window.initMultiplayer = initMultiplayer;
window.leaveMultiplayerMode = leaveMultiplayerMode;
window.sendMove = sendMove; 