# ChessWeb

A modular web-based chess application with AI opponent, multiplayer, and local multiplayer features powered by Stockfish.


## Play Now

You can play ChessWeb in two ways:

### Online Multiplayer
1. Visit [ChessWeb Live](https://abhash.me/ChessWeb)
2. Click "Multiplayer" to create or join a game
3. Share the room code with a friend to play together

### Local Play
1. Visit [ChessWeb Live](https://abhash.me/ChessWeb)
2. Choose your preferred game mode:
   - Player vs Player (local hotseat)
   - Player vs Computer (Stockfish AI)
3. Adjust AI difficulty as desired
4. Start playing!

The game works best in modern browsers like Chrome, Firefox, or Edge.


## Features

- Complete chess rules implementation including castling, en passant, and pawn promotion
- Chess clock with configurable time control
- Move history with algebraic notation
- Material advantage display
- Stockfish AI opponent with adjustable difficulty levels
- Responsive design
- Modular code structure

## Architecture

The application is built with a modular JavaScript structure:

```
ChessWeb/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Core styles and layout
├── js/
│   ├── script.js          # Main game logic
│   ├── board.js           # Chess board and piece management
│   ├── gameState.js       # Game state and rules
│   ├── ai/
│   │   ├── ai.js         # AI opponent logic
│   │   └── stockfish/    # Stockfish engine files
│   │       └── stockfish-nnue-16.js
│   └── multiplayer/
│       ├── multiplayer.js # Online multiplayer
│       └── socket.js      # WebSocket handling
└── server/                # Multiplayer server
    ├── server.js         # WebSocket/Express server
    └── package.json      # Server dependencies
```

## How to Run (Development)

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open the application in your browser
5. Enjoy playing chess!

## How to Build for Production

1. Install dependencies if you haven't already:
   ```
   npm install
   ```
2. Build the production version:
   ```
   npm run build
   ```
3. The optimized files will be generated in the `dist` directory

## Deployment

### Basic Web Server Deployment

1. Build the project as described above
2. Upload the contents of the `dist` directory to your web server
3. Configure your web server to serve the files (Apache, Nginx, etc.)

### Netlify Deployment

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Netlify
3. Set the build command to `npm run build`
4. Set the publish directory to `dist`

### Vercel Deployment

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Vercel will automatically detect the build settings

## Network Access (Development)

To make the application accessible to other devices on your local network:

1. Find your local IP address using `ip addr show` command
2. Configure your server to listen on your local IP instead of just localhost
3. Open the URL with your local IP address from other devices

## Development

This project uses ES modules, which require a web server to function properly. When making changes, use a development server that supports module loading, such as VS Code's Live Server extension.

## Credits

- Chess piece unicode symbols for the chess pieces
- Stockfish chess engine for AI opponent 