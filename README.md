# ChessWeb

A modular web-based chess application with AI opponent powered by Stockfish.

## Features

- Complete chess rules implementation including castling, en passant, and pawn promotion
- Chess clock with configurable time control
- Move history with algebraic notation
- Material advantage display
- Stockfish AI opponent with adjustable difficulty levels
- Responsive design
- Modular code structure

## Architecture

The application is built with a modular JavaScript structure using ES modules:

```
ChessWeb/
├── index.html           # Main HTML file
├── styles.css           # CSS styles
├── js/
│   ├── ai.js            # AI integration with Stockfish
│   ├── main.js          # Entry point and initialization
│   ├── board.js         # Board creation and UI management
│   ├── gameState.js     # Game state management
│   ├── moves/
│   │   ├── moveHandler.js  # High-level move handling
│   │   ├── whiteMoves.js   # White piece move logic
│   │   ├── blackMoves.js   # Black piece move logic
│   │   └── checkDetection.js # Check detection logic
│   ├── ui/
│   │   ├── status.js    # Game status updates
│   │   ├── clock.js     # Chess clock functionality
│   │   ├── promotion.js # Pawn promotion UI
│   │   └── history.js   # Move history and capture display
│   └── libs/
│       └── stockfish-nnue-16-single.js # Stockfish engine
```

## Module Structure

- **gameState.js**: Contains game constants, state variables, and piece definitions
- **board.js**: Handles board creation, piece placement, and visual updates
- **moves/**: Directory containing move-related logic
  - **moveHandler.js**: Entry point for move operations
  - **whiteMoves.js**: White piece movement logic
  - **blackMoves.js**: Black piece movement logic
  - **checkDetection.js**: Logic for detecting check positions
- **ui/**: Directory containing UI-related modules
  - **clock.js**: Chess clock functionality
  - **status.js**: Game status updates and end game detection
  - **promotion.js**: Pawn promotion dialog
  - **history.js**: Move history display
- **ai.js**: AI opponent using Stockfish chess engine
- **main.js**: Application entry point and initialization

## How to Run

1. Clone this repository
2. Start a local server (e.g., using VS Code's Live Server)
3. Open the application in your browser
4. Enjoy playing chess!

## Network Access

To make the application accessible to other devices on your local network:

1. Find your local IP address using `ip addr show` command
2. Configure your server to listen on your local IP instead of just localhost
3. Open the URL with your local IP address from other devices

## Development

This project uses ES modules, which require a web server to function properly. When making changes, use a development server that supports module loading, such as VS Code's Live Server extension.

## Credits

- Chess piece unicode symbols for the chess pieces
- Stockfish chess engine for AI opponent 