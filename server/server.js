/**
 * WebSocket server for ChessWeb multiplayer functionality
 * Handles:
 * - Creating game rooms
 * - Matching players
 * - Synchronizing moves between players
 * - Managing disconnections
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Serve static files from the root directory
app.use(express.static(__dirname + '/..'));

// Serve a simple status page at the root URL
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chess WebSocket Server</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        h1 { color: #2c3e50; }
        .status { 
          background: #e8f5e9;
          padding: 15px;
          border-radius: 5px;
          border-left: 5px solid #4caf50;
        }
        .info {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          border-left: 5px solid #2196f3;
          margin-top: 20px;
        }
        code {
          background: #f5f5f5;
          padding: 2px 5px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <h1>Chess WebSocket Server</h1>
      <div class="status">
        <h2>✅ Server Status: Running</h2>
        <p>The WebSocket server is running and ready to accept connections.</p>
      </div>
      <div class="info">
        <h2>📋 Connection Information:</h2>
        <p>This server is running Socket.IO for real-time multiplayer chess games.</p>
        <p><strong>Local URL:</strong> <code>http://localhost:${PORT}</code></p>
        <p><strong>Network URL:</strong> <code>http://${getLocalIpAddress()}:${PORT}</code></p>
        <h3>⚠️ Important:</h3>
        <p>Don't try to use this page directly. Instead:</p>
        <ol>
          <li>Open the Chess application in your browser</li>
          <li>Go to multiplayer mode</li>
          <li>In server settings, enter: <code>http://${getLocalIpAddress()}:${PORT}</code></li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

// Configure Socket.IO with more permissive settings to avoid being blocked
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your domain
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000
});

// Store active game rooms
const gameRooms = {};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle creating a new game room
  socket.on('create_room', (data, callback) => {
    try {
      const roomId = generateRoomId();
      const playerName = data.playerName || 'Host';
      
      // Create the room
      gameRooms[roomId] = {
        hostId: socket.id,
        hostName: playerName,
        created: Date.now(),
        joinerId: null,
        joinerName: null,
        gameStarted: false
      };
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Store room info in the socket
      socket.roomId = roomId;
      socket.isHost = true;
      socket.playerName = playerName;
      socket.playerColor = 'white'; // Host plays as white
      
      console.log(`Room created: ${roomId} by ${playerName}`);
      
      // Send success response
      callback({ success: true, roomId });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });
  
  // Handle joining an existing game room
  socket.on('join_room', (data, callback) => {
    try {
      const { roomId, playerName } = data;
      const joinerName = playerName || 'Guest';
      
      // Check if room exists
      if (!gameRooms[roomId]) {
        return callback({ success: false, error: 'Room not found' });
      }
      
      // Check if room is already full
      if (gameRooms[roomId].joinerId) {
        return callback({ success: false, error: 'Room is full' });
      }
      
      // Join the room
      gameRooms[roomId].joinerId = socket.id;
      gameRooms[roomId].joinerName = joinerName;
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Store room info in the socket
      socket.roomId = roomId;
      socket.isHost = false;
      socket.playerName = joinerName;
      socket.playerColor = 'black'; // Joiner plays as black
      
      console.log(`Player ${joinerName} joined room: ${roomId}`);
      
      // Notify the host that a player has joined
      io.to(gameRooms[roomId].hostId).emit('opponent_joined', {
        playerId: socket.id,
        name: joinerName
      });
      
      // Send success response to the joiner
      callback({ 
        success: true,
        hostName: gameRooms[roomId].hostName
      });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });
  
  // Handle a player making a move
  socket.on('make_move', (data) => {
    try {
      const { roomId, move } = data;
      
      // Check if room exists
      if (!gameRooms[roomId]) return;
      
      // Determine recipient (the other player)
      const recipientId = socket.isHost 
        ? gameRooms[roomId].joinerId 
        : gameRooms[roomId].hostId;
      
      if (!recipientId) return;
      
      console.log(`Move from ${socket.playerName} in room ${roomId}:`, move);
      
      // Forward the move to the opponent
      io.to(recipientId).emit('opponent_move', move);
    } catch (error) {
      console.error('Error making move:', error);
    }
  });
  
  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Check if player was in a room
    if (socket.roomId && gameRooms[socket.roomId]) {
      const room = gameRooms[socket.roomId];
      
      // Notify the other player about disconnection
      if (socket.isHost && room.joinerId) {
        io.to(room.joinerId).emit('opponent_disconnected', {
          message: 'Host has disconnected'
        });
      } else if (!socket.isHost && room.hostId) {
        io.to(room.hostId).emit('opponent_disconnected', {
          message: 'Opponent has disconnected'
        });
      }
      
      // Clean up the room if appropriate
      if (socket.isHost) {
        // If host leaves, close the room
        delete gameRooms[socket.roomId];
        console.log(`Room ${socket.roomId} closed (host left)`);
      } else {
        // If joiner leaves, just remove them from the room
        room.joinerId = null;
        room.joinerName = null;
        room.gameStarted = false;
        console.log(`Joiner left room ${socket.roomId}`);
      }
    }
  });
});

// Generate a random room ID
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting similar-looking characters
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Define a port
const PORT = process.env.PORT || 3000;

// Get local IP address to display for network connections
const { networkInterfaces } = require('os');

function getLocalIpAddress() {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  
  // Find the first external IPv4 address
  for (const name of Object.keys(results)) {
    if (results[name].length > 0) {
      return results[name][0];
    }
  }
  
  return 'localhost';
}

// Start the server on all network interfaces (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Network URL: http://${localIp}:${PORT}`);
  console.log(`\nIMPORTANT: Other devices should connect to: http://${localIp}:${PORT}`);
});
