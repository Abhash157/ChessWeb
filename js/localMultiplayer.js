/**
 * Local Multiplayer Fallback Module
 * Provides multiplayer functionality using localStorage for cross-tab communication
 * Used as a fallback when WebSocket connection fails
 */

// Local Multiplayer State
const LMP = {
  playerId: null,
  roomId: null,
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
 * Initialize the local multiplayer module
 */
function initLocalMultiplayer() {
  console.log('Initializing local multiplayer mode...');
  
  // Create a unique ID for this player/tab
  LMP.playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  LMP.onlineModeActive = true;
  
  // Set up event listeners for localStorage changes
  setupLocalStorageListeners();
  
  // Show local multiplayer UI
  showLocalMultiplayerUI();
  
  console.log('Local multiplayer initialized with player ID:', LMP.playerId);
}

/**
 * Set up localStorage event listeners for cross-tab communication
 */
function setupLocalStorageListeners() {
  // Listen for storage events (this is how tabs communicate)
  window.addEventListener('storage', (event) => {
    console.log('Storage event:', event.key, event.newValue);
    
    // Handle join notifications
    if (event.key && event.key.startsWith('chessRoomJoin_') && 
        event.key.includes(LMP.roomId)) {
      if (LMP.isHost && LMP.waitingForOpponent) {
        console.log('Host received join notification');
        
        // Get the join data
        try {
          const joinInfo = JSON.parse(event.newValue);
          handleLocalOpponentJoined({
            playerId: joinInfo.joinerId,
            name: joinInfo.joinerName || 'Opponent'
          });
        } catch (e) {
          console.error('Error parsing join data:', e);
        }
      }
    }
    
    // Handle move notifications
    if (event.key === `moveNotify_${LMP.roomId}` && LMP.gameStarted) {
      const moveKey = event.newValue;
      if (moveKey) {
        // Get the actual move
        const moveString = localStorage.getItem(moveKey);
        if (moveString) {
          console.log('Received move notification:', moveKey, moveString);
          handleLocalOpponentMove(moveString);
        }
      }
    }
  });
}

/**
 * Create a new game room
 */
function createLocalRoom() {
  // Generate a room ID
  const roomId = 'local_' + Math.random().toString(36).substring(2, 7);
  LMP.roomId = roomId;
  LMP.isHost = true;
  LMP.playerColor = PLAYER.WHITE; // Host plays as white
  LMP.waitingForOpponent = true;
  
  // Store room info in localStorage
  localStorage.setItem('chessRoom_' + roomId, JSON.stringify({
    hostId: LMP.playerId,
    hostName: LMP.playerName,
    created: new Date().getTime()
  }));
  
  console.log('Local room created with ID:', roomId);
  updateMultiplayerStatus(`Waiting for opponent... Room Code: ${LMP.roomId}`);
  showRoomCodeDisplay(LMP.roomId);
}

/**
 * Join an existing game room
 * @param {string} roomId - The ID of the room to join
 */
function joinLocalRoom(roomId) {
  if (!roomId) {
    showConnectionError('Please enter a valid room code');
    return;
  }
  
  // Check if the room exists
  const roomData = localStorage.getItem('chessRoom_' + roomId);
  if (!roomData) {
    showConnectionError('Room not found');
    return;
  }
  
  try {
    const roomInfo = JSON.parse(roomData);
    LMP.roomId = roomId;
    LMP.isHost = false;
    LMP.playerColor = PLAYER.BLACK; // Joiner plays as black
    LMP.opponentConnected = true;
    
    // Store player join info for the host to see
    const joinKey = 'chessRoomJoin_' + roomId;
    const joinData = {
      joinerId: LMP.playerId,
      joinerName: LMP.playerName,
      timestamp: new Date().getTime()
    };
    
    // First clear existing data to ensure the event triggers
    localStorage.removeItem(joinKey);
    
    // Then set the new data - this triggers storage event in other tabs
    localStorage.setItem(joinKey, JSON.stringify(joinData));
    
    console.log('Joined local room:', roomId);
    
    // Handle joining the room
    handleLocalRoomJoined({
      hostId: roomInfo.hostId,
      hostName: roomInfo.hostName || 'Host'
    });
  } catch (e) {
    console.error('Error joining room:', e);
    showConnectionError('Failed to join room');
  }
}

/**
 * Send a move to the opponent
 * @param {Object} moveData - Data about the move
 */
function sendLocalMove(moveData) {
  if (!LMP.roomId || !LMP.gameStarted) return;
  
  console.log('Sending move to opponent locally:', moveData);
  
  // Create a simple move format: piece,fromRow,fromCol,toRow,toCol
  const { from, to, piece } = moveData;
  const fromRow = from.row;
  const fromCol = from.col;
  const toRow = to.row;
  const toCol = to.col;
  
  // Create a simple move string that's easy to parse
  const moveString = `${piece},${fromRow},${fromCol},${toRow},${toCol}`;
  
  // Add a unique timestamp to ensure event triggers
  const timestamp = new Date().getTime();
  
  // Set the move in localStorage
  const moveKey = `moveFrom_${LMP.roomId}_${timestamp}`;
  localStorage.setItem(moveKey, moveString);
  
  // Set a notification flag with the move key to ensure the event triggers
  localStorage.setItem(`moveNotify_${LMP.roomId}`, moveKey);
  
  console.log(`Move sent locally: ${moveString}`);
  
  // Update local turn status - switch to opponent's turn
  window.turn = LMP.playerColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  disableBoardInteraction(); // Disable board until opponent moves
  
  // Update UI to show waiting for opponent
  updateMultiplayerStatus(`Waiting for ${LMP.opponentName} to make a move...`);
}

/**
 * Handle opponent joining our room
 * @param {Object} data - Data about the opponent
 */
function handleLocalOpponentJoined(data) {
  LMP.opponentConnected = true;
  LMP.waitingForOpponent = false;
  LMP.opponentName = data.name || 'Opponent';
  
  console.log('Opponent joined locally:', data);
  updateMultiplayerStatus(`${LMP.opponentName} has joined the game!`);
  
  // Hide the multiplayer overlay
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
  }
  
  // Start the game after a short delay
  setTimeout(startLocalMultiplayerGame, 1500);
}

/**
 * Handle joining another player's room
 * @param {Object} data - Data about the host
 */
function handleLocalRoomJoined(data) {
  LMP.opponentConnected = true;
  LMP.opponentName = data.hostName || 'Host';
  
  console.log('Joined host\'s room locally:', data);
  updateMultiplayerStatus(`Connected to ${LMP.opponentName}'s game!`);
  
  // Hide the multiplayer overlay immediately
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
  }
  
  // Start the game after a short delay
  setTimeout(startLocalMultiplayerGame, 1500);
}

/**
 * Handle receiving a move from the opponent
 * @param {string} moveString - Move in format 'piece,fromRow,fromCol,toRow,toCol'
 */
function handleLocalOpponentMove(moveString) {
  if (!LMP.gameStarted) return;
  
  console.log('Received move from opponent locally:', moveString);
  
  try {
    // Parse the move string
    const [piece, fromRow, fromCol, toRow, toCol] = moveString.split(',');
    
    // Convert to numbers
    const moveData = {
      piece: piece,
      from: { row: parseInt(fromRow), col: parseInt(fromCol) },
      to: { row: parseInt(toRow), col: parseInt(toCol) }
    };
    
    console.log('Parsed opponent move:', moveData);
    
    // Save the move for reference
    LMP.lastReceivedMove = moveData;
    
    // Apply the opponent's move to the local board
    applyOpponentMove(moveData);
    
    // Update turn status to player's turn
    window.turn = LMP.playerColor;
    enableBoardInteraction();
    
    // Update UI
    updateMultiplayerStatus(`Your turn`);
  } catch (e) {
    console.error('Error processing opponent move:', e);
  }
}

/**
 * Start a local multiplayer game
 */
function startLocalMultiplayerGame() {
  console.log('Starting local multiplayer game');
  
  // Set game started flag
  LMP.gameStarted = true;
  
  // Reset and initialize the board
  resetBoard();
  
  // Set the starting player (white goes first)
  window.turn = PLAYER.WHITE;
  
  // Update UI based on player color
  if (LMP.playerColor === PLAYER.WHITE) {
    enableBoardInteraction();
    updateMultiplayerStatus('Game started! Your turn (White)');
  } else {
    disableBoardInteraction();
    updateMultiplayerStatus('Game started! Waiting for opponent (White) to move');
  }
  
  // Hide multiplayer overlay for both players
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
  }
  
  console.log('Local multiplayer game started');
}

/**
 * Show the local multiplayer UI
 */
function showLocalMultiplayerUI() {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;
  
  // Create multiplayer overlay if it doesn't exist
  let mpOverlay = document.getElementById('mp-overlay');
  if (!mpOverlay) {
    mpOverlay = document.createElement('div');
    mpOverlay.id = 'mp-overlay';
    mpOverlay.className = 'multiplayer-overlay';
    gameContainer.appendChild(mpOverlay);
  }
  
  // Set the overlay content
  mpOverlay.innerHTML = `
    <div class="mp-container">
      <h2>Local Multiplayer Mode</h2>
      <p class="mp-info">Play across different browser tabs on the same device</p>
      
      <div class="mp-status" id="mp-status">
        Enter your name and create or join a room
      </div>
      
      <div class="mp-form">
        <div class="mp-input-group">
          <label for="mp-name">Your Name:</label>
          <input type="text" id="mp-name" placeholder="Enter your name" value="${LMP.playerName}">
        </div>
        
        <button id="mp-create-btn" class="mp-btn">Create Room</button>
        
        <div class="mp-divider">OR</div>
        
        <div class="mp-input-group">
          <label for="mp-room">Room Code:</label>
          <input type="text" id="mp-room" placeholder="Enter room code">
        </div>
        
        <button id="mp-join-btn" class="mp-btn">Join Room</button>
      </div>
      
      <div id="room-code-display" class="room-code-display" style="display:none;">
        <p>Share this code with your opponent:</p>
        <div class="room-code" id="room-code"></div>
      </div>
      
      <button id="mp-back-btn" class="mp-btn mp-back-btn">Back to Menu</button>
    </div>
  `;
  
  // Show the overlay
  mpOverlay.style.display = 'flex';
  
  // Add event listeners
  document.getElementById('mp-name').addEventListener('input', (e) => {
    LMP.playerName = e.target.value || 'Player';
  });
  
  document.getElementById('mp-create-btn').addEventListener('click', () => {
    createLocalRoom();
  });
  
  document.getElementById('mp-join-btn').addEventListener('click', () => {
    const roomCode = document.getElementById('mp-room').value;
    joinLocalRoom(roomCode);
  });
  
  document.getElementById('mp-back-btn').addEventListener('click', () => {
    leaveLocalMultiplayerMode();
  });
}

/**
 * Show the room code display
 * @param {string} roomId - The room ID to display
 */
function showRoomCodeDisplay(roomId) {
  const roomCodeDisplay = document.getElementById('room-code-display');
  const roomCodeElement = document.getElementById('room-code');
  
  if (roomCodeDisplay && roomCodeElement) {
    roomCodeElement.textContent = roomId;
    roomCodeDisplay.style.display = 'block';
  }
}

/**
 * Leave local multiplayer mode
 */
function leaveLocalMultiplayerMode() {
  // Clean up any room data if this was the host
  if (LMP.isHost && LMP.roomId) {
    localStorage.removeItem('chessRoom_' + LMP.roomId);
  }
  
  // Reset all LMP state
  LMP.roomId = null;
  LMP.playerId = null;
  LMP.isHost = false;
  LMP.playerColor = null;
  LMP.opponentConnected = false;
  LMP.waitingForOpponent = false;
  LMP.gameStarted = false;
  LMP.onlineModeActive = false;
  
  // Hide multiplayer UI
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
  }
  
  // Reset board
  resetBoard();
  
  console.log('Left local multiplayer mode');
}
