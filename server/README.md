# ChessWeb Multiplayer Server

This is a WebSocket server built with Socket.IO to support real-time multiplayer functionality for the ChessWeb application.

## Features

- Room creation and management
- Player matching
- Real-time move synchronization
- Disconnection handling

## Technical Stack

- Node.js
- Express.js
- Socket.IO
- CORS for cross-origin support

## How to Run

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. The server will run on port 3000 by default. You can change this by setting the PORT environment variable.

## API Events

### Client to Server

- `create_room`: Create a new game room
  - Parameters: `{ playerName: string }`
  - Callback: `{ success: boolean, roomId: string, error?: string }`

- `join_room`: Join an existing game room
  - Parameters: `{ roomId: string, playerName: string }`
  - Callback: `{ success: boolean, hostName: string, error?: string }`

- `make_move`: Send a move to the opponent
  - Parameters: `{ roomId: string, move: string }`

### Server to Client

- `opponent_joined`: Notifies the host when an opponent joins the room
  - Data: `{ playerId: string, name: string }`

- `opponent_move`: Notifies a player of a move made by their opponent
  - Data: `string` in format "piece,fromRow,fromCol,toRow,toCol"

- `opponent_disconnected`: Notifies a player when their opponent disconnects
  - Data: `{ message: string }`

## Deployment

For production use:

1. Update the CORS settings in `server.js` to restrict access to your domain
2. Set up environment variables for PORT and any other configuration
3. Deploy to a Node.js hosting service like Heroku, Vercel, or a VPS

## License

MIT
