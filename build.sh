#!/bin/bash

# Exit on error
set -e

echo "=== ChessWeb Build Script ==="
echo "Installing dependencies..."
npm install

echo "Building production version..."
npm run build

echo "Build complete! Production files are in the 'dist' directory."
echo "To deploy, upload the contents of the 'dist' directory to your web server."

# Optional: List the generated files
echo ""
echo "Generated files:"
find dist -type f | sort 