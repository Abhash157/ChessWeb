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

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
