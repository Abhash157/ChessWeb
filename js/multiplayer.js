/**
 * Multiplayer Chess Module
 * Handles online gameplay using Socket.io
 */

// Socket.io server URL - can be overridden by custom settings
const DEFAULT_SOCKET_SERVER_URL = 'https://chessweb-server-emdhd5geftgbbser.southeastasia-01.azurewebsites.net/';

// Function to get the current server URL (custom or default)
function getServerUrl() {
  return localStorage.getItem('chessServerUrl') || DEFAULT_SOCKET_SERVER_URL;
}

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
  onlineModeActive: false,
  clockSyncInterval: null
};

/**
 * Initialize the multiplayer module
 * @returns {boolean} True if initialization successful
 */
function initMultiplayer() {
  try {
    console.log('Initializing multiplayer mode...');
    
    // Make multiplayer functions globally available to script.js
    window.sendMove = sendMove;
    console.log('Exposed sendMove function globally');
    
    // Show multiplayer UI once Socket.io is loaded
    showMultiplayerUI();
    
    // Load Socket.io library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Socket.io library loaded');
      // Auto-connect to the default server
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
 * Connect to the WebSocket server
 * @param {string} customServerUrl - Optional custom server URL
 */
function connectToServer(customServerUrl) {
  try {
    // Allow custom server URL or use stored preference, fallback to default
    let serverUrl = customServerUrl || getServerUrl();
    
    console.log(`Connecting to WebSocket server at ${serverUrl}...`);
    updateMultiplayerStatus(`Connecting to server at ${serverUrl}...`);
    
    // Store the server URL for future use
    if (customServerUrl) {
      localStorage.setItem('chessServerUrl', customServerUrl);
    }
    
    MP.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 20000, // Increased timeout
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    
    // Set up connection event handlers
    setupSocketListeners();
    
    return true;
  } catch (error) {
    console.error('Error connecting to server:', error);
    showConnectionError(`Failed to connect to multiplayer server: ${error.message}`);
    return false;
  }
}

/**
 * Set up Socket.IO event listeners
 */
function setupSocketListeners() {
  if (!MP.socket) return;
  
  // Connection events
  MP.socket.on('connect', () => {
    console.log('Connected to Socket.IO server with ID:', MP.socket.id);
    MP.playerId = MP.socket.id;
    MP.onlineModeActive = true;
  });
  
  MP.socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
    showConnectionError('Disconnected from server');
  });
  
  MP.socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    showConnectionError('Connection error: ' + error.message);
    
    // Add a fallback option for users experiencing connection issues
    const mpStatus = document.getElementById('mp-status');
    if (mpStatus) {
      mpStatus.innerHTML += `
        <div class="warning-message" style="margin-top: 15px;">
          <p>Having trouble connecting? Your browser might be blocking WebSockets.</p>
          <p>You can:</p>
          <ul style="text-align: left; margin-left: 20px;">
            <li>Check your server address in Server Settings</li>
            <li>Make sure both devices are on the same network</li>
            <li>Disable ad blockers for this page</li>
            <li>Try a different browser</li>
            <li>Use the local multiplayer option below</li>
          </ul>
          <button id="mp-local-fallback" class="mp-btn">Use Local Multiplayer</button>
        </div>
      `;
      
      // Add event listener for the local fallback button
      document.getElementById('mp-local-fallback').addEventListener('click', () => {
        useLocalMultiplayerFallback();
      });
    }
  });
  
  // Game events
  MP.socket.on('opponent_joined', (data) => {
    console.log('Opponent joined:', data);
    handleOpponentJoined(data);
  });
  
  // Listen for game end events
  MP.socket.on('game_end', (data) => {
    console.log('Received game_end event:', data);
    handleGameEnd(data);
  });
  
  // Listen for clock synchronization events
  MP.socket.on('clock_sync', (data) => {
    console.log('Received clock_sync event:', data);
    if (data && data.clockState) {
      syncClockWithServer(data.clockState);
    }
  });
  
  // Listen for timeout events
  MP.socket.on('player_timeout', (data) => {
    console.log('Received player_timeout event:', data);
    // Stop the clock
    if (window.CLOCK) {
      if (typeof window.stopClock === 'function') {
        window.stopClock();
      } else if (typeof stopClock === 'function') {
        stopClock();
      }
    }
    
    // Update game state
    if (window.gameState) {
      window.gameState.gameOver = true;
    }
    
    // Show who won by timeout
    const winner = data.player === 'white' ? 'Black' : 'White';
    updateMultiplayerStatus(`Game over: ${winner} wins by timeout!`);
  });
  
  /**
   * Switch to local multiplayer fallback when Socket.IO connection fails
   */
  window.useLocalMultiplayerFallback = function() {
    console.log('Switching to local multiplayer fallback');
    
    // Clean up socket connection if it exists
    if (MP.socket) {
      MP.socket.disconnect();
      MP.socket = null;
    }
    
    // Reset multiplayer state
    MP.roomId = null;
    MP.playerId = null;
    MP.isHost = false;
    MP.playerColor = null;
    MP.opponentConnected = false;
    MP.waitingForOpponent = false;
    MP.gameStarted = false;
    MP.onlineModeActive = false;
    
    // Load the local multiplayer script if not already loaded
    if (!window.LMP) {
      const script = document.createElement('script');
      script.src = 'js/localMultiplayer.js';
      script.onload = () => {
        console.log('Local multiplayer script loaded');
        initLocalMultiplayer();
      };
      script.onerror = (error) => {
        console.error('Error loading local multiplayer script:', error);
        showConnectionError('Failed to load local multiplayer functionality');
      };
      document.head.appendChild(script);
    } else {
      // If script is already loaded, just initialize
      initLocalMultiplayer();
    }
  };
  
  // Listen for opponent's move
  MP.socket.on('opponent_move', (data) => {
    console.log('Received opponent_move event from server:', data);
    
    // Make sure game is marked as started - may be redundant but provides a safeguard
    if (!MP.gameStarted) {
      console.log('Game not marked as started, but move received - forcing game start');
      MP.gameStarted = true;
      MP.onlineModeActive = true;
      
      // Set game mode to online
      window.currentGameMode = window.GAME_MODE ? window.GAME_MODE.ONLINE : 'online';
      console.log('Forced game mode to:', window.currentGameMode);
      
      // Initialize the board if needed
      if (document.querySelectorAll('#chessboard .square').length === 0) {
        console.log('Board not initialized, initializing now');
        resetBoard();
      }
    }
    
    // Handle clock synchronization if provided by the server
    const moveInfo = data.move || data;
    const clockInfo = data.clockState;
    
    if (clockInfo) {
      console.log('Received clock synchronization data:', clockInfo);
      syncClockWithServer(clockInfo);
    }
    
    // Process the move
    const moveString = typeof moveInfo === 'string' ? moveInfo : moveInfo.move;
    handleOpponentMove(moveString);
  });
  
  MP.socket.on('opponent_disconnected', (data) => {
    console.log('Opponent disconnected:', data);
    showConnectionError(data.message || 'Opponent disconnected');
    
    // Reset game state
    MP.opponentConnected = false;
    MP.gameStarted = false;
    
    // Show a reconnect button
    const mpStatus = document.getElementById('mp-status');
    if (mpStatus) {
      mpStatus.innerHTML = `
        <div class="error-message">${data.message || 'Opponent disconnected'}</div>
        <button id="mp-reconnect-btn" class="mp-btn">Return to Menu</button>
      `;
      
      // Add event listener to reconnect button
      document.getElementById('mp-reconnect-btn').addEventListener('click', () => {
        leaveMultiplayerMode();
        showMultiplayerUI();
      });
    }
  });
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
      MP.opponentName = response.hostName || 'Host';
      MP.opponentConnected = true;
      
      // CRITICAL: Set game to started state immediately
      MP.gameStarted = true;
      MP.onlineModeActive = true;
      
      // Set game mode to online 
      if (window.GAME_MODE && typeof window.GAME_MODE.ONLINE !== 'undefined') {
        console.log('Setting game mode to ONLINE for joiner');
        window.currentGameMode = window.GAME_MODE.ONLINE;
      } else {
        console.log('Setting game mode to "online" string for joiner');
        window.currentGameMode = 'online';
      }
      
      // Update UI to show connection status
      updateMultiplayerStatus(`Connected to ${MP.opponentName}'s game! You are playing as Black`);
      
      // Hide the multiplayer overlay immediately
      const mpOverlay = document.getElementById('mp-overlay');
      if (mpOverlay) {
        mpOverlay.style.display = 'none';
      }
      
      // Initialize the game board
      console.log('Initializing game board for joiner');
      resetBoard(); // This will also initialize and start the timer
      
      // Flip the board since joiner plays as black
      flipBoardForBlackPlayer();
      
      // Disable board interaction since White goes first
      disableBoardInteraction();
      
      // Show a game status indicator
      const gameInfo = document.querySelector('.game-info');
      if (gameInfo) {
        const mpStatus = document.createElement('div');
        mpStatus.id = 'in-game-mp-status';
        mpStatus.className = 'mp-game-status';
        mpStatus.innerHTML = `<span>Online Match vs ${MP.opponentName}</span>`;
        gameInfo.prepend(mpStatus);
      }
      
      // Make clocks more visible
      if (!document.getElementById('mp-game-styles')) {
        const styles = document.createElement('style');
        styles.id = 'mp-game-styles';
        styles.textContent = `
          .mp-game-status {
            background-color: #3498db;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-weight: bold;
            text-align: center;
          }
          
          /* Make clocks more visible in multiplayer mode */
          .clocks-container {
            border: 2px solid #3498db;
            padding: 2px;
            margin-bottom: 10px;
          }
          
          .active-clock {
            background-color: #3498db33 !important;
          }
        `;
        document.head.appendChild(styles);
      }
    } else {
      showConnectionError('Failed to join room: ' + (response.error || 'Unknown error'));
    }
  });
}

/**
 * Send a move to the opponent via the server
 * @param {Object} moveData - Data about the move
 */
function sendMove(moveData) {
  if (!MP.roomId || !MP.gameStarted || !MP.socket) {
    console.error('Cannot send move: multiplayer not ready', {
      roomId: MP.roomId,
      gameStarted: MP.gameStarted,
      socketConnected: MP.socket ? MP.socket.connected : false
    });
    return;
  }
  
  console.log('Sending move to opponent:', moveData);
  
  // Create a simple move format: piece,fromRow,fromCol,toRow,toCol
  const { from, to, piece } = moveData;
  const fromRow = from.row;
  const fromCol = from.col;
  const toRow = to.row;
  const toCol = to.col;
  
  // Create a simple move string that's easy to parse
  let moveString = `${piece},${fromRow},${fromCol},${toRow},${toCol}`;
  
  // Add promotion data if present
  if (moveData.promotion) {
    moveString += `,promotion,${moveData.promotion}`;
  }
  
  // Get current clock times to send to the server for synchronization
  const whiteTime = window.CLOCK ? window.CLOCK.whiteTime : 
                    (typeof window.getState === 'function' ? window.getState('clock').whiteTime : 600);
  const blackTime = window.CLOCK ? window.CLOCK.blackTime : 
                    (typeof window.getState === 'function' ? window.getState('clock').blackTime : 600);
  
  // Send the move to the server along with clock times
  MP.socket.emit('make_move', {
    roomId: MP.roomId,
    move: moveString,
    clockState: {
      whiteTime: whiteTime,
      blackTime: blackTime,
      moveTimestamp: Date.now()
    }
  });
  
  console.log(`Move sent to server: ${moveString} with clock times: white=${whiteTime}, black=${blackTime}`);
  
  // Update local turn status - switch to opponent's turn
  const newTurn = MP.playerColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  window.turn = newTurn;
  
  // Ensure the clock is switched to the opponent's turn
  console.log('Switching clock to opponent after sending move');
  
  // Use updateState if available (most reliable)
  if (typeof window.updateState === 'function') {
    window.updateState({ 
      'clock.activePlayer': newTurn 
    });
    
    // Make sure the clock is running
    if (window.getState && !window.getState('clock').isRunning) {
      window.updateState({ 'clock.isRunning': true });
    }
  } 
  // Fall back to direct modification of CLOCK if needed
  else if (window.CLOCK) {
    window.CLOCK.activePlayer = newTurn;
    
    // Ensure the clock is running
    if (!window.CLOCK.isRunning) {
      console.log('Clock is not running, starting it now after player move');
      if (typeof window.startClock === 'function') {
        window.startClock();
      } else if (typeof startClock === 'function') {
        startClock();
      }
    }
  }
    
  // Update the clock display
  if (typeof window.updateClockDisplay === 'function') {
    window.updateClockDisplay();
  } else {
    // Direct DOM update if function not available
    const whiteTimeDisplay = document.getElementById("white-time");
    const blackTimeDisplay = document.getElementById("black-time");
    const whiteClockElement = document.querySelector(".white-clock");
    const blackClockElement = document.querySelector(".black-clock");
    
    if (whiteClockElement && blackClockElement) {
      whiteClockElement.classList.toggle('active-clock', newTurn === PLAYER.WHITE);
      blackClockElement.classList.toggle('active-clock', newTurn === PLAYER.BLACK);
    }
  }
  
  disableBoardInteraction(); // Disable board until opponent moves
  
  // Update UI to show waiting for opponent
  updateMultiplayerStatus(`Waiting for ${MP.opponentName} to make a move...`);
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
  
  // Hide the multiplayer overlay immediately for the host
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    mpOverlay.style.display = 'none';
  }
  
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
 * @param {string} moveString - Move in format 'piece,fromRow,fromCol,toRow,toCol'
 */
function handleOpponentMove(moveString) {
  if (!MP.gameStarted) {
    console.error('Received opponent move but game not started!');
    return;
  }
  
  console.log('Received move from opponent:', moveString);
  
  try {
    // Parse the move string
    const parts = moveString.split(',');
    // The basic move always has the first 5 parts
    const [piece, fromRow, fromCol, toRow, toCol] = parts;
    
    // Convert to numbers
    const moveData = {
      piece: piece,
      from: { row: parseInt(fromRow), col: parseInt(fromCol) },
      to: { row: parseInt(toRow), col: parseInt(toCol) }
    };
    
    // Check for promotion - format would be: piece,fromRow,fromCol,toRow,toCol,promotion,pieceType
    const isPromotion = parts.length > 5 && parts[5] === 'promotion';
    if (isPromotion) {
      moveData.promotion = parts[6]; // The promotion piece type (queen, rook, etc.)
      console.log('Move includes promotion to:', moveData.promotion);
    }
    
    console.log('Parsed opponent move:', moveData);
    
    // Save the move for reference
    MP.lastReceivedMove = moveData;
    
    // Get the chessboard
    const board = document.getElementById('chessboard');
    if (!board) {
      console.error('Chessboard not found in DOM');
      return;
    }
    
    // Get the squares from the DOM
    const fromSquare = board.querySelector(`.square[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const toSquare = board.querySelector(`.square[data-row="${toRow}"][data-col="${toCol}"]`);
    
    console.log('Opponent move squares:', {
      from: fromSquare,
      to: toSquare,
      fromCoords: `${fromRow},${fromCol}`,
      toCoords: `${toRow},${toCol}`
    });
    
    if (!fromSquare || !toSquare) {
      console.error('Could not find squares for opponent move:', {
        fromRow, fromCol, toRow, toCol,
        fromSquare, toSquare
      });
      return;
    }
    
    // Determine the opponent's color (opposite of player's color)
    const opponentColor = MP.playerColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    console.log(`Applying opponent move with color: ${opponentColor}`);
    
    // Disable board interaction while move is processing
    disableBoardInteraction();
    
    // Ensure the clock is updated with the correct active player
    // The active player on the clock should be the opponent during their move
    if (window.CLOCK) {
      console.log('Updating clock for opponent move');
      
      // Use updateState if available (most reliable method)
      if (typeof window.updateState === 'function') {
        // Set the active player to the opponent
        window.updateState({
          'clock.activePlayer': opponentColor
        });
        
        // Start the clock if it's not running
        if (window.getState && !window.getState('clock').isRunning) {
          console.log('Clock is not running, starting it via updateState');
          window.updateState({ 'clock.isRunning': true });
        }
      } 
      // Fall back to direct CLOCK manipulation if updateState is not available
      else {
        // Force set the active player to the opponent
        window.CLOCK.activePlayer = opponentColor;
        
        // Start the clock if it's not running
        if (!window.CLOCK.isRunning) {
          console.log('Clock is not running, starting it now');
          if (typeof window.startClock === 'function') {
            window.startClock();
          } else if (typeof startClock === 'function') {
            startClock();
          }
        }
      }
      
      // Update the clock display
      if (typeof window.updateClockDisplay === 'function') {
        window.updateClockDisplay();
      } else {
        // Direct DOM update if function not available
        const whiteClockElement = document.querySelector(".white-clock");
        const blackClockElement = document.querySelector(".black-clock");
        
        if (whiteClockElement && blackClockElement) {
          whiteClockElement.classList.toggle('active-clock', opponentColor === PLAYER.WHITE);
          blackClockElement.classList.toggle('active-clock', opponentColor === PLAYER.BLACK);
        }
      }
    }
    
    // If this is a promotion move and we already know the promoted piece,
    // we need to prepare the pendingPromotion state
    if (isPromotion) {
      const promotedPiece = moveData.promotion;
      // Check if this is a pawn promotion (pawn reaching the end of the board)
      const isPawnAtEndRow = (
        (opponentColor === PLAYER.WHITE && parseInt(toRow) === 0) || 
        (opponentColor === PLAYER.BLACK && parseInt(toRow) === 7)
      );
      
      if (isPawnAtEndRow) {
        console.log('Setting up pendingPromotion for opponent promotion move');
        // Get all squares if window.squares is not available
        const allSquares = window.squares || document.querySelectorAll('.square');
        
        window.pendingPromotion = {
          fromSquare: fromSquare,
          toSquare: toSquare,
          playerColor: opponentColor,
          fromIndex: Array.from(allSquares).indexOf(fromSquare),
          toIndex: Array.from(allSquares).indexOf(toSquare),
          moveData: {
            from: { row: parseInt(fromRow), col: parseInt(fromCol) },
            to: { row: parseInt(toRow), col: parseInt(toCol) },
            pieceMovedOriginal: piece,
            wasPromotion: true,
            playerColor: opponentColor,
            promotedToPieceType: moveData.promotion // Add the promotion piece type to the move data
          }
        };
      }
    }
    
    // Use the global handlePieceMove function
    window.handlePieceMove(fromSquare, toSquare, opponentColor)
      .then((result) => {
        console.log('Opponent move applied successfully!');
        
        // Check if the game is over after this move
        if (window.gameState && window.gameState.gameOver) {
          console.log('Game is over after opponent move:', {
            checkmate: window.gameState.checkmate,
            stalemate: window.gameState.stalemate,
            insufficientMaterial: window.gameState.insufficientMaterial,
            threefoldRepetition: window.gameState.threefoldRepetition,
            fiftyMoveRule: window.gameState.fiftyMoveRule
          });
          
          // Stop the clock if game is over
          if (window.CLOCK) {
            console.log('Stopping clock at game end');
            if (typeof window.stopClock === 'function') {
              window.stopClock();
            } else if (typeof stopClock === 'function') {
              stopClock();
            } else {
              // Direct approach if function isn't available
              if (window.CLOCK.timerInterval) {
                clearInterval(window.CLOCK.timerInterval);
                window.CLOCK.timerInterval = null;
                window.CLOCK.isRunning = false;
              }
            }
          }
          
          // Show appropriate message based on game end reason
          let endReason = 'Unknown reason';
          if (window.gameState.checkmate) {
            const winner = MP.playerColor === PLAYER.WHITE ? 'Black' : 'White';
            endReason = `Checkmate! ${winner} wins!`;
          } else if (window.gameState.stalemate) {
            endReason = 'Stalemate! Game drawn.';
          } else if (window.gameState.insufficientMaterial) {
            endReason = 'Draw by insufficient material.';
          } else if (window.gameState.threefoldRepetition) {
            endReason = 'Draw by threefold repetition.';
          } else if (window.gameState.fiftyMoveRule) {
            endReason = 'Draw by fifty-move rule.';
          }
          
          // Handle game end
          handleGameEnd({ reason: endReason });
          return;
        }
        
        // If this is a promotion move, wait for the promotion to complete
        if (isPromotion) {
          // Immediately update the piece on the board to the promoted piece
          if (moveData.promotion) {
            // Make sure we have access to the piece symbols, either from global window.pieces or fallback to Unicode values
            const pieceSymbols = window.pieces || {
              white: {
                queen: '\u2655',
                rook: '\u2656',
                bishop: '\u2657',
                knight: '\u2658',
                pawn: '\u2659'
              },
              black: {
                queen: '\u265B',
                rook: '\u265C',
                bishop: '\u265D',
                knight: '\u265E',
                pawn: '\u265F'
              }
            };
            
            const pieceSet = opponentColor === PLAYER.WHITE ? pieceSymbols.white : pieceSymbols.black;
            let promotedPieceSymbol;
            
            switch(moveData.promotion) {
              case 'queen': promotedPieceSymbol = pieceSet.queen; break;
              case 'rook': promotedPieceSymbol = pieceSet.rook; break;
              case 'bishop': promotedPieceSymbol = pieceSet.bishop; break;
              case 'knight': promotedPieceSymbol = pieceSet.knight; break;
              default: promotedPieceSymbol = pieceSet.queen; // Default to queen
            }
            
            // Update the piece on the board
            toSquare.textContent = promotedPieceSymbol;
            console.log('Updated pawn to promoted piece:', promotedPieceSymbol);
            
            // Add move to game history with promotion information
            const fromIndex = parseInt(fromRow) * 8 + parseInt(fromCol);
            const toIndex = parseInt(toRow) * 8 + parseInt(toCol);
            const promotionMoveData = {
              from: { row: parseInt(fromRow), col: parseInt(fromCol) },
              to: { row: parseInt(toRow), col: parseInt(toCol) },
              pieceMovedOriginal: piece,
              wasPromotion: true,
              promotedToPieceType: moveData.promotion,
              playerColor: opponentColor
            };
            
            // Add the promotion move to the game history
            if (window.gameState && window.gameState.moveHistory) {
              window.gameState.moveHistory.push(promotionMoveData);
              
              // Update the move history display if function exists
              if (typeof window.updateMoveHistory === 'function') {
                window.updateMoveHistory();
              }
            }
            
            // Now that we've updated the piece, enable the board
            window.turn = MP.playerColor;
            
            // Ensure the clock is switched to the player's turn
            console.log('Ensuring clock switches to player after opponent move');
            const whiteTimeDisplay = document.getElementById("white-time");
            const blackTimeDisplay = document.getElementById("black-time");
            const whiteClockElement = document.querySelector(".white-clock");
            const blackClockElement = document.querySelector(".black-clock");
            
            // First try to update using central state (most reliable)
            if (typeof window.updateState === 'function') {
              window.updateState({ 
                'clock.activePlayer': MP.playerColor
              });
            } 
            // Fall back to direct CLOCK manipulation
            else if (window.CLOCK) {
              window.CLOCK.activePlayer = MP.playerColor;
            }
            
            // Visual indicators for active player
            if (whiteClockElement && blackClockElement) {
              whiteClockElement.classList.toggle('active-clock', MP.playerColor === PLAYER.WHITE);
              blackClockElement.classList.toggle('active-clock', MP.playerColor === PLAYER.BLACK);
            }
            
            // Ensure the clock is running
            if ((window.CLOCK && !window.CLOCK.isRunning) || 
                (typeof window.getState === 'function' && !window.getState('clock').isRunning)) {
              
              console.log('Clock is not running, starting it after opponent move');
              
              if (typeof window.startClock === 'function') {
                window.startClock();
              } else if (typeof startClock === 'function') {
                startClock();
              } else if (window.CLOCK) {
                // Last resort - create a new interval
                if (window.CLOCK.timerInterval) clearInterval(window.CLOCK.timerInterval);
                
                window.CLOCK.isRunning = true;
                window.CLOCK.timerInterval = setInterval(() => {
                  if (window.CLOCK.activePlayer === PLAYER.WHITE) {
                    window.CLOCK.whiteTime--;
                  } else {
                    window.CLOCK.blackTime--;
                  }
                  
                  if (typeof window.updateClockDisplay === 'function') {
                    window.updateClockDisplay();
                  } else if (whiteTimeDisplay && blackTimeDisplay) {
                    // Manual display update
                    const whiteMinutes = Math.floor(window.CLOCK.whiteTime / 60);
                    const whiteSecs = window.CLOCK.whiteTime % 60;
                    const blackMinutes = Math.floor(window.CLOCK.blackTime / 60);
                    const blackSecs = window.CLOCK.blackTime % 60;
                    
                    whiteTimeDisplay.textContent = `${whiteMinutes.toString().padStart(2, '0')}:${whiteSecs.toString().padStart(2, '0')}`;
                    blackTimeDisplay.textContent = `${blackMinutes.toString().padStart(2, '0')}:${blackSecs.toString().padStart(2, '0')}`;
                  }
                  
                }, 1000);
                
                if (typeof window.updateState === 'function') {
                  window.updateState({ 
                    'clock.isRunning': true,
                    'clock.timerInterval': window.CLOCK.timerInterval
                  });
                }
              }
            }
            
            // Ensure the clock display is updated
            if (typeof window.updateClockDisplay === 'function') {
              window.updateClockDisplay();
            }
            
            // Enable interaction so the player can make their move
            enableBoardInteraction();
            
            // Update UI
            updateMultiplayerStatus(`Your turn`);
          }
        } else {
          // Update turn status to player's turn
          window.turn = MP.playerColor;
          
          // Ensure the clock is properly switched to the player's turn
          console.log('Ensuring clock switches to player after opponent move');
          const whiteTimeDisplay = document.getElementById("white-time");
          const blackTimeDisplay = document.getElementById("black-time");
          const whiteClockElement = document.querySelector(".white-clock");
          const blackClockElement = document.querySelector(".black-clock");
          
          // First try to update using central state (most reliable)
          if (typeof window.updateState === 'function') {
            window.updateState({ 
              'clock.activePlayer': MP.playerColor
            });
          } 
          // Fall back to direct CLOCK manipulation
          else if (window.CLOCK) {
            window.CLOCK.activePlayer = MP.playerColor;
          }
          
          // Visual indicators for active player
          if (whiteClockElement && blackClockElement) {
            whiteClockElement.classList.toggle('active-clock', MP.playerColor === PLAYER.WHITE);
            blackClockElement.classList.toggle('active-clock', MP.playerColor === PLAYER.BLACK);
          }
          
          // Ensure the clock is running
          if ((window.CLOCK && !window.CLOCK.isRunning) || 
              (typeof window.getState === 'function' && !window.getState('clock').isRunning)) {
            
            console.log('Clock is not running, starting it after opponent move');
            
            if (typeof window.startClock === 'function') {
              window.startClock();
            } else if (typeof startClock === 'function') {
              startClock();
            } else if (window.CLOCK) {
              // Last resort - create a new interval
              if (window.CLOCK.timerInterval) clearInterval(window.CLOCK.timerInterval);
              
              window.CLOCK.isRunning = true;
              window.CLOCK.timerInterval = setInterval(() => {
                if (window.CLOCK.activePlayer === PLAYER.WHITE) {
                  window.CLOCK.whiteTime--;
                } else {
                  window.CLOCK.blackTime--;
                }
                
                if (typeof window.updateClockDisplay === 'function') {
                  window.updateClockDisplay();
                } else if (whiteTimeDisplay && blackTimeDisplay) {
                  // Manual display update
                  const whiteMinutes = Math.floor(window.CLOCK.whiteTime / 60);
                  const whiteSecs = window.CLOCK.whiteTime % 60;
                  const blackMinutes = Math.floor(window.CLOCK.blackTime / 60);
                  const blackSecs = window.CLOCK.blackTime % 60;
                  
                  whiteTimeDisplay.textContent = `${whiteMinutes.toString().padStart(2, '0')}:${whiteSecs.toString().padStart(2, '0')}`;
                  blackTimeDisplay.textContent = `${blackMinutes.toString().padStart(2, '0')}:${blackSecs.toString().padStart(2, '0')}`;
                }
                
              }, 1000);
              
              if (typeof window.updateState === 'function') {
                window.updateState({ 
                  'clock.isRunning': true,
                  'clock.timerInterval': window.CLOCK.timerInterval
                });
              }
            }
          }
          
          // Ensure the clock display is updated
          if (typeof window.updateClockDisplay === 'function') {
            window.updateClockDisplay();
          }
          
          // Enable interaction so the player can make their move
          enableBoardInteraction();
          
          // Update UI
          updateMultiplayerStatus(`Your turn`);
        }
      })
      .catch(err => {
        console.error('Error executing opponent move:', err);
        alert('Error applying opponent move. Please try reloading the page.');
      });
  } catch (e) {
    console.error('Error processing opponent move:', e);
  }
}

/**
 * Apply a move received from the opponent to the local board
 * @param {Object} moveData - Data about the move in simplified format
 */
function applyOpponentMove(moveData) {
  console.log('Applying opponent move:', moveData);
  
  try {
    // Extract move data - ensure they're numbers with parseInt
    const fromRow = parseInt(moveData.from.row);
    const fromCol = parseInt(moveData.from.col);
    const toRow = parseInt(moveData.to.row);
    const toCol = parseInt(moveData.to.col);
    
    // Get the current state
    const state = getState();
    const squares = state.squares;
    
    // Get the corresponding squares using the correct indices
    const fromIndex = fromRow * 8 + fromCol;
    const toIndex = toRow * 8 + toCol;
    const fromSquare = squares[fromIndex];
    const toSquare = squares[toIndex];
    
    console.log(`Move indexes: from=${fromIndex} (${fromRow},${fromCol}), to=${toIndex} (${toRow},${toCol})`);
    console.log('From square:', fromSquare);
    console.log('To square:', toSquare);
    
    if (!fromSquare || !toSquare) {
      console.error('Invalid squares for move:', fromRow, fromCol, toRow, toCol);
      return;
    }
    
    // Determine the opponent's color (opposite of player's color)
    const opponentColor = MP.playerColor === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    
    console.log(`Applying opponent move from (${fromRow},${fromCol}) to (${toRow},${toCol})`);
    console.log(`Opponent color: ${opponentColor}`);
    
    // Disable board interaction while opponent's move is being processed
    disableBoardInteraction();
    
    // Call the global handlePieceMove function with the correct parameters
    // Make sure to pass the correct color of the piece being moved (opponent's color)
    window.handlePieceMove(fromSquare, toSquare, opponentColor)
      .then(() => {
        console.log('Opponent move applied successfully');
        
        // Make sure the turn is set to the player's color after the move completes
        window.turn = MP.playerColor;
        
        // Enable board interaction after the move is completed
        enableBoardInteraction();
        
        // Update UI to show it's the player's turn
        updateMultiplayerStatus('Your turn');
      })
      .catch(err => {
        console.error('Error during handlePieceMove execution:', err);
        showConnectionError('Error applying opponent move');
        enableBoardInteraction(); // Ensure board isn't left disabled
      });
    
    console.log('Opponent move processing initiated');
  } catch (err) {
    console.error('Error in applyOpponentMove function:', err);
    showConnectionError('Failed to process opponent move');
    enableBoardInteraction(); // Ensure board isn't left disabled
  }
}

/**
{{ ... }}
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
  console.log('Starting multiplayer game...');
  
  // Important: Make sure handlePieceMove is available globally
  if (typeof handlePieceMove !== 'function') {
    window.handlePieceMove = window.handlePieceMove || function(fromSquare, toSquare, playerColor) {
      console.log('Using fallback handlePieceMove');
      // Fallback implementation
      const piece = fromSquare.textContent;
      fromSquare.textContent = '';
      toSquare.textContent = piece;
      return true;
    };
  }
  MP.gameStarted = true;
  MP.onlineModeActive = true;
  
  // Force hide the multiplayer overlay with !important to override any other styles
  const mpOverlay = document.getElementById('mp-overlay');
  if (mpOverlay) {
    console.log('Hiding multiplayer overlay');
    mpOverlay.style.cssText = 'display: none !important';
    
    // Also try to remove it from the DOM if hiding doesn't work
    setTimeout(() => {
      if (mpOverlay.style.display !== 'none' || mpOverlay.offsetParent !== null) {
        console.log('Overlay still visible, removing from DOM');
        mpOverlay.parentNode.removeChild(mpOverlay);
      }
    }, 100);  
  } else {
    console.log('No mpOverlay found to hide');
  }
  
  // Show a game status indicator
  const gameInfo = document.querySelector('.game-info');
  if (gameInfo) {
    const mpStatus = document.createElement('div');
    mpStatus.id = 'in-game-mp-status';
    mpStatus.className = 'mp-game-status';
    mpStatus.innerHTML = `<span>Online Match vs ${MP.opponentName}</span>`;
    gameInfo.prepend(mpStatus);
  }
  
  // Set game mode to online - using multiple approaches to ensure it's set
  // Check if GAME_MODE exists before accessing it
  if (window.GAME_MODE && typeof window.GAME_MODE.ONLINE !== 'undefined') {
    window.currentGameMode = window.GAME_MODE.ONLINE;
  } else {
    // Fallback to string if GAME_MODE is not defined
    window.currentGameMode = 'online';
  }
  console.log('Current game mode set to:', window.currentGameMode);
  
  // Update UI
  updateMultiplayerStatus(`Game started! You are playing as ${MP.playerColor === PLAYER.WHITE ? 'White' : 'Black'}`);
  
  // Reset board and set up for a new game
  // This will also initialize and start the timer
  resetBoard();
  
  // Flip board if player is black
  flipBoardForBlackPlayer();
  
  // Request initial clock synchronization from server
  if (MP.socket && MP.socket.connected && MP.roomId) {
    console.log('Requesting initial clock sync from server');
    MP.socket.emit('request_clock_sync', { roomId: MP.roomId });
  }
  
  // Set up periodic clock synchronization
  if (MP.clockSyncInterval) {
    clearInterval(MP.clockSyncInterval);
  }
  
  MP.clockSyncInterval = setInterval(() => {
    if (MP.socket && MP.socket.connected && MP.roomId && MP.gameStarted) {
      console.log('Requesting periodic clock sync');
      MP.socket.emit('request_clock_sync', { roomId: MP.roomId });
    }
  }, 30000); // Sync every 30 seconds
  
  // If player is black, disable board interaction until white moves
  if (MP.playerColor === PLAYER.BLACK) {
    disableBoardInteraction();
    updateMultiplayerStatus(`Waiting for ${MP.opponentName} to make a move...`);
  } else {
    enableBoardInteraction();
  }
  
  // Add some CSS styles for the in-game multiplayer status
  if (!document.getElementById('mp-game-styles')) {
    const styles = document.createElement('style');
    styles.id = 'mp-game-styles';
    styles.textContent = `
      .mp-game-status {
        background-color: #3498db;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 10px;
        font-weight: bold;
        text-align: center;
      }
      
      /* Ensure overlay is hidden */
      #mp-overlay {
        display: none !important;
      }
      
      /* Make clocks more visible in multiplayer mode */
      .clocks-container {
        border: 2px solid #3498db;
        padding: 2px;
        margin-bottom: 10px;
      }
      
      .active-clock {
        background-color: #3498db33 !important;
      }
    `;
    document.head.appendChild(styles);
  }
  
  console.log('Multiplayer game started successfully!');
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
  
  // Reset the clock
  console.log('Resetting and starting clock in resetBoard');
  
  // First try using the central state API
  if (typeof window.updateState === 'function') {
    window.updateState({
      'clock.whiteTime': 600, // 10 minutes
      'clock.blackTime': 600,
      'clock.isRunning': false,
      'clock.activePlayer': PLAYER.WHITE
    });
  } 
  // Fall back to direct CLOCK manipulation if needed
  else if (window.CLOCK) {
    window.CLOCK.whiteTime = 600;
    window.CLOCK.blackTime = 600;
    window.CLOCK.activePlayer = PLAYER.WHITE;
    window.CLOCK.isRunning = false;
  }
  
  // Update the clock display
  if (typeof window.updateClockDisplay === 'function') {
    window.updateClockDisplay();
  } else {
    // Direct DOM update if function not available
    const whiteTimeDisplay = document.getElementById("white-time");
    const blackTimeDisplay = document.getElementById("black-time");
    if (whiteTimeDisplay && blackTimeDisplay) {
      whiteTimeDisplay.textContent = '10:00';
      blackTimeDisplay.textContent = '10:00';
    }
    
    const whiteClockElement = document.querySelector(".white-clock");
    const blackClockElement = document.querySelector(".black-clock");
    if (whiteClockElement && blackClockElement) {
      whiteClockElement.classList.add('active-clock');
      blackClockElement.classList.remove('active-clock');
    }
  }
  
  // Start the clock with a slight delay
  setTimeout(() => {
    console.log('Starting clock from resetBoard');
    
    // Clear any existing timer
    if (window.CLOCK && window.CLOCK.timerInterval) {
      clearInterval(window.CLOCK.timerInterval);
      window.CLOCK.timerInterval = null;
    }
    
    // Try various ways to start the clock
    if (typeof window.startClock === 'function') {
      window.startClock();
    } else if (typeof startClock === 'function') {
      startClock();
    } else if (window.CLOCK) {
      // Direct approach if function isn't available
      window.CLOCK.isRunning = true;
      window.CLOCK.timerInterval = setInterval(() => {
        if (window.CLOCK.activePlayer === PLAYER.WHITE) {
          window.CLOCK.whiteTime--;
          if (window.CLOCK.whiteTime <= 0) {
            if (typeof window.handleTimeOut === 'function') {
              window.handleTimeOut(PLAYER.WHITE);
            }
          }
        } else {
          window.CLOCK.blackTime--;
          if (window.CLOCK.blackTime <= 0) {
            if (typeof window.handleTimeOut === 'function') {
              window.handleTimeOut(PLAYER.BLACK);
            }
          }
        }
        if (typeof window.updateClockDisplay === 'function') {
          window.updateClockDisplay();
        } else {
          // Direct DOM update as fallback
          const activePlayer = window.CLOCK.activePlayer;
          const timeLeft = activePlayer === PLAYER.WHITE ? 
                          window.CLOCK.whiteTime : window.CLOCK.blackTime;
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          if (activePlayer === PLAYER.WHITE && whiteTimeDisplay) {
            whiteTimeDisplay.textContent = timeDisplay;
          } else if (activePlayer === PLAYER.BLACK && blackTimeDisplay) {
            blackTimeDisplay.textContent = timeDisplay;
          }
        }
      }, 1000);
      
      // Also set it in the state system if available
      if (typeof window.updateState === 'function') {
        window.updateState({
          'clock.isRunning': true,
          'clock.timerInterval': window.CLOCK.timerInterval
        });
      }
    }
  }, 500); // Slight delay to ensure DOM is ready
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
          <div class="mp-option-group">
            <details class="server-config">
              <summary>Advanced Server Settings (Optional)</summary>
              <div class="server-settings-content">
                <label for="server-address">Custom Server Address:</label>
                <input type="text" id="server-address" placeholder="e.g., http://192.168.1.5:3000">
                <p class="server-help">Leave blank to use the default server. Only change if you're running your own server.</p>
                <div class="server-buttons">
                  <button id="save-server-btn" class="mp-btn mp-small-btn">Save Custom Server</button>
                  <button id="reset-server-btn" class="mp-btn mp-small-btn">Use Default Server</button>
                </div>
              </div>
            </details>
          </div>
          <button id="create-room-btn" class="mp-btn">Create New Game</button>
          <div class="mp-divider">OR</div>
          <div class="mp-option-group">
            <label for="room-code">Room Code:</label>
            <input type="text" id="room-code" placeholder="Enter room code" maxlength="10">
          </div>
          <button id="join-room-btn" class="mp-btn">Join Game</button>
        </div>
        <div id="mp-status" class="mp-status">Connecting to default server...</div>
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
    
    // Initialize server address input with stored value if it differs from default
    const serverAddressInput = document.getElementById('server-address');
    const savedServerUrl = localStorage.getItem('chessServerUrl');
    if (savedServerUrl && savedServerUrl !== DEFAULT_SOCKET_SERVER_URL) {
    serverAddressInput.value = savedServerUrl;
    } else {
      serverAddressInput.value = ''; // Leave blank to indicate using default
    }
    
    // Initialize and display the current server in the status
    const currentServer = getServerUrl();
    updateMultiplayerStatus(`Connecting to server: ${currentServer}`);
    
    // Add event listener for save server button
    document.getElementById('save-server-btn').addEventListener('click', () => {
      const serverUrl = serverAddressInput.value.trim();
      if (serverUrl) {
        // Validate URL format
        try {
          // Simple validation - just check if it has http/https and a domain
          if (!serverUrl.match(/^https?:\/\/.+/)) {
            throw new Error('Invalid URL format');
          }
          
          // Save the server URL to localStorage
          localStorage.setItem('chessServerUrl', serverUrl);
          
          // Reconnect to new server
          if (MP.socket) {
            MP.socket.disconnect();
          }
          
          // Show status message
          updateMultiplayerStatus(`Connecting to custom server at ${serverUrl}...`);
          
          // Connect to the new server
          setTimeout(() => {
            connectToServer(serverUrl);
          }, 500);
          
        } catch (error) {
          updateMultiplayerStatus(`Error: ${error.message}. Use format http://IP:PORT`, true);
        }
      } else {
        updateMultiplayerStatus(`Please enter a valid server URL or use the default server`, true);
      }
    });
    
    // Add event listener for reset server button
    document.getElementById('reset-server-btn').addEventListener('click', () => {
      // Clear any saved custom server
      localStorage.removeItem('chessServerUrl');
      serverAddressInput.value = '';
      
      // Reconnect to default server
      if (MP.socket) {
        MP.socket.disconnect();
      }
      
      updateMultiplayerStatus(`Connecting to default server...`);
      
      // Connect to the default server
      setTimeout(() => {
        connectToServer(DEFAULT_SOCKET_SERVER_URL);
      }, 500);
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
      
      .server-config summary {
        cursor: pointer;
        padding: 8px;
        background: #313244;
        border-radius: 5px;
        margin-bottom: 10px;
      }
      
      .server-settings-content {
        padding: 10px;
        background: #11111b;
        border-radius: 5px;
        margin-top: 5px;
        margin-bottom: 10px;
      }
      
      .server-help {
        font-size: 0.8rem;
        opacity: 0.8;
        margin: 5px 0;
      }
      
      .server-buttons {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      
      .mp-small-btn {
        padding: 5px 10px;
        font-size: 0.9rem;
        flex: 1;
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
 * Leave multiplayer mode
 */
function leaveMultiplayerMode() {
  if (MP.socket) {
    // Properly disconnect from the server
    MP.socket.disconnect();
    MP.socket = null;
  }
  
  // Clear clock synchronization interval
  if (MP.clockSyncInterval) {
    clearInterval(MP.clockSyncInterval);
    MP.clockSyncInterval = null;
  }
  
  // Stop the clock
  if (window.CLOCK) {
    console.log('Stopping clock when leaving multiplayer');
    if (typeof window.stopClock === 'function') {
      window.stopClock();
    } else if (typeof stopClock === 'function') {
      stopClock();
    } else {
      // Direct approach if function isn't available
      if (window.CLOCK.timerInterval) {
        clearInterval(window.CLOCK.timerInterval);
        window.CLOCK.timerInterval = null;
        window.CLOCK.isRunning = false;
      }
    }
  }
  
  // Reset all MP state
  MP.roomId = null;
  MP.playerId = null;
  MP.isHost = false;
  MP.playerColor = null;
  MP.opponentConnected = false;
  MP.waitingForOpponent = false;
  MP.gameStarted = false;
  MP.onlineModeActive = false;
  
  // Hide multiplayer UI
  hideMultiplayerUI();
  
  // Reset board
  resetBoard();
  
  // Update game status
  updateGameStatus();
}

/**
 * Handle game ending (checkmate, stalemate, etc.)
 * @param {Object} data - Data about the game ending
 */
function handleGameEnd(data) {
  console.log('Game ended:', data);
  
  // Stop the clock
  if (window.CLOCK) {
    console.log('Stopping clock at game end');
    if (typeof window.stopClock === 'function') {
      window.stopClock();
    } else if (typeof stopClock === 'function') {
      stopClock();
    } else {
      // Direct approach if function isn't available
      if (window.CLOCK.timerInterval) {
        clearInterval(window.CLOCK.timerInterval);
        window.CLOCK.timerInterval = null;
        window.CLOCK.isRunning = false;
      }
    }
  }
  
  // Update game state
  if (window.gameState) {
    window.gameState.gameOver = true;
  }
  
  // Update UI
  updateMultiplayerStatus(`Game over: ${data.reason || 'Unknown reason'}`);
  
  // Show end game options
  const mpStatus = document.getElementById('mp-status');
  if (mpStatus) {
    mpStatus.innerHTML += `
      <div class="mp-game-end-options">
        <button id="mp-new-game" class="mp-btn">New Game</button>
        <button id="mp-exit-game" class="mp-btn mp-cancel-btn">Exit</button>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('mp-new-game').addEventListener('click', () => {
      // Restart the game
      resetBoard();
      resetClock();
      MP.gameStarted = true;
      window.turn = PLAYER.WHITE;
      if (MP.playerColor === PLAYER.WHITE) {
        enableBoardInteraction();
        updateMultiplayerStatus('Your turn (White)');
      } else {
        disableBoardInteraction();
        updateMultiplayerStatus('Waiting for opponent (White) to move');
      }
    });
    
    document.getElementById('mp-exit-game').addEventListener('click', () => {
      leaveMultiplayerMode();
      window.location.href = 'home.html';
    });
  }
}

// Add CSS for game end options
const gameEndStyles = document.createElement('style');
gameEndStyles.textContent = `
  .mp-game-end-options {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: center;
  }
  
  .mp-game-end-options .mp-btn {
    flex: 1;
  }
`;
document.head.appendChild(gameEndStyles);

// Make functions available to other modules
window.MP = MP;
window.initMultiplayer = initMultiplayer;
window.leaveMultiplayerMode = leaveMultiplayerMode;
window.sendMove = sendMove;

// Use the same URL as the DEFAULT_SOCKET_SERVER_URL for consistency
const API_URL = DEFAULT_SOCKET_SERVER_URL;

/**
 * Synchronize the local clock with server clock data
 * @param {Object} serverClockData - Clock data from the server
 */
function syncClockWithServer(serverClockData) {
  if (!serverClockData || !serverClockData.whiteTime || !serverClockData.blackTime) {
    console.error('Invalid server clock data:', serverClockData);
    return;
  }
  
  console.log('Synchronizing clock with server data:', serverClockData);
  
  // Account for network delay
  let networkDelay = 0;
  if (serverClockData.moveTimestamp) {
    const now = Date.now();
    networkDelay = Math.floor((now - serverClockData.moveTimestamp) / 1000);
    console.log(`Estimated network delay: ${networkDelay} seconds`);
  }
  
  // Get current server-provided times, adjusted for network delay
  const whiteTime = Math.max(0, serverClockData.whiteTime - (serverClockData.activePlayer === PLAYER.WHITE ? networkDelay : 0));
  const blackTime = Math.max(0, serverClockData.blackTime - (serverClockData.activePlayer === PLAYER.BLACK ? networkDelay : 0));
  
  // Apply the synchronized times using all available methods
  // 1. Use updateState if available
  if (typeof window.updateState === 'function') {
    console.log('Updating clock times via updateState:', { whiteTime, blackTime });
    window.updateState({
      'clock.whiteTime': whiteTime,
      'clock.blackTime': blackTime
    });
  } 
  // 2. Fall back to direct CLOCK manipulation
  else if (window.CLOCK) {
    console.log('Updating clock times directly:', { whiteTime, blackTime });
    window.CLOCK.whiteTime = whiteTime;
    window.CLOCK.blackTime = blackTime;
  }
  
  // Update the active player if provided
  if (serverClockData.activePlayer !== undefined) {
    if (typeof window.updateState === 'function') {
      window.updateState({
        'clock.activePlayer': serverClockData.activePlayer
      });
    } else if (window.CLOCK) {
      window.CLOCK.activePlayer = serverClockData.activePlayer;
    }
  }
  
  // Update the visual display
  if (typeof window.updateClockDisplay === 'function') {
    window.updateClockDisplay();
  } else {
    // Direct DOM update as fallback
    const whiteTimeDisplay = document.getElementById('white-time');
    const blackTimeDisplay = document.getElementById('black-time');
    
    if (whiteTimeDisplay && blackTimeDisplay) {
      const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
      
      whiteTimeDisplay.textContent = formatTime(whiteTime);
      blackTimeDisplay.textContent = formatTime(blackTime);
      
      const whiteClockElement = document.querySelector('.white-clock');
      const blackClockElement = document.querySelector('.black-clock');
      
      if (whiteClockElement && blackClockElement) {
        const activePlayer = serverClockData.activePlayer !== undefined ? 
                            serverClockData.activePlayer : 
                            (window.CLOCK ? window.CLOCK.activePlayer : window.turn);
        
        whiteClockElement.classList.toggle('active-clock', activePlayer === PLAYER.WHITE);
        blackClockElement.classList.toggle('active-clock', activePlayer === PLAYER.BLACK);
      }
    }
  }
  
  console.log('Clock synchronized with server data');
}

/**
 * Flip the board to match the player's perspective
 * White sees board with white pieces at bottom (default)
 * Black sees board with black pieces at bottom (flipped)
 */
function flipBoardForBlackPlayer() {
  if (MP.playerColor === PLAYER.BLACK) {
    console.log('Flipping board for black player perspective');
    
    // Get the chessboard element
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) {
      console.error('Cannot find chessboard element to flip');
      return;
    }
    
    // Add a class that will flip the board using CSS transforms
    chessboard.classList.add('flipped');
    
    // Also flip the notation on the board if it exists
    const ranks = document.querySelectorAll('.rank-label');
    const files = document.querySelectorAll('.file-label');
    
    if (ranks.length > 0) ranks.forEach(rank => rank.classList.add('flipped'));
    if (files.length > 0) files.forEach(file => file.classList.add('flipped'));
    
    // Add CSS to actually perform the flipping
    if (!document.getElementById('board-flip-styles')) {
      const style = document.createElement('style');
      style.id = 'board-flip-styles';
      style.textContent = `
        #chessboard.flipped {
          transform: rotate(180deg);
        }
        
        #chessboard.flipped .square {
          transform: rotate(180deg);
        }
        
        .rank-label.flipped, .file-label.flipped {
          transform: rotate(180deg);
        }
        
        /* Make the clocks consistent with the board orientation */
        .flipped-clocks .clocks-container {
          flex-direction: column-reverse;
        }
      `;
      document.head.appendChild(style);
      
      // Also flip the clock order to match board orientation
      const clocksContainer = document.querySelector('.clocks-container');
      if (clocksContainer) {
        clocksContainer.classList.add('flipped-clocks');
      }
    }
    
    console.log('Board flipped for black player');
  }
} 