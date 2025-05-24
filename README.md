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

The application is built with a modular JavaScript structure:

```
ChessWeb/
├── index.html           # Main HTML file
├── styles.css           # CSS styles
├── script.js            # Main JavaScript file
├── js/
│   ├── ai.js            # AI integration with Stockfish
│   ├── multiplayer.js   # Multiplayer functionality
│   ├── board.js         # Board creation and UI management
│   ├── gameState.js     # Game state management
│   └── stockfish/
│       └── stockfish-nnue-16-single.js # Stockfish engine
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