# ChessWeb Multiplayer Testing Guide

This guide will help you test the WebSocket-based multiplayer functionality in your chess application.

## Prerequisites

Make sure both servers are running:

1. WebSocket server on port 3000:
   ```
   cd server
   npm start
   ```

2. HTTP server for the chess application on port 8000:
   ```
   python -m http.server 8000
   ```

## Testing Procedure

### Basic Connectivity Test

1. Open the chess application in two different browser windows/tabs: http://localhost:8000
2. In both tabs, click on the "Multiplayer" button to enter multiplayer mode
3. Check the browser console in both tabs to verify that they connect to the WebSocket server
   - You should see messages like "Connected to Socket.IO server with ID: [socket_id]"

### Room Creation and Joining Test

1. In the first browser tab (Tab A):
   - Enter a player name and click "Create Room"
   - Note the room code that appears

2. In the second browser tab (Tab B):
   - Enter a different player name
   - Enter the room code from Tab A
   - Click "Join Room"

3. Verify that:
   - Tab A shows a message that an opponent has joined
   - Tab B shows a message that it has connected to the host's game
   - The game starts automatically after a short delay
   - The multiplayer overlay disappears for both players

### Move Synchronization Test

1. In Tab A (white player):
   - Make a valid chess move
   - Verify that the move is sent to the server (check console)
   - Verify that the UI updates to show it's the opponent's turn

2. In Tab B (black player):
   - Verify that the white player's move appears on the board automatically
   - Verify that it's now your turn to move
   - Make a move as black
   - Verify that the UI updates to show it's the opponent's turn

3. Continue making a few more moves to ensure reliable synchronization

### Disconnection Test

1. While in an active game, close Tab A (host)
2. Verify that Tab B (joiner) receives a disconnection notification
3. Verify that Tab B shows an option to return to the menu

4. Start a new game with a new room:
   - In Tab B, return to the menu and create a new room
   - Join with a third tab (Tab C)
   - Start a game
   - Close Tab C (joiner)
   - Verify that Tab B (host) receives a disconnection notification

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify that both servers are running correctly
3. Check the WebSocket server console for connection events and errors
4. Ensure the SOCKET_SERVER_URL in multiplayer.js matches the actual server URL (http://localhost:3000)

## Expected Behavior

- Room creation should be instant
- Room joining should work reliably
- Moves should sync in real-time with no noticeable delay
- Disconnections should be properly handled with clear user feedback
- The game state should remain consistent between both players
