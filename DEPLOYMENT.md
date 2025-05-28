# ChessWeb Deployment Guide

This guide provides detailed instructions for deploying the ChessWeb application to various hosting environments.

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git (optional, for version control)

## Building the Project

1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd ChessWeb
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

   This will create a `dist` directory containing all the optimized files for production.

## Deployment Options

### Option 1: Basic Web Server (Apache, Nginx)

1. Build the project as described above
2. Upload the contents of the `dist` directory to your web server's public directory (e.g., `/var/www/html/`)
3. Configure your web server if necessary:

   **Apache example (.htaccess):**
   ```
   # Handle 404s by redirecting to index.html (for SPA routing)
   ErrorDocument 404 /index.html
   
   # Set caching headers for static assets
   <FilesMatch ".(js|css|jpg|jpeg|png|gif|ico)$">
     Header set Cache-Control "max-age=31536000, public"
   </FilesMatch>
   ```

   **Nginx example (nginx.conf):**
   ```
   server {
     listen 80;
     server_name yourdomain.com;
     root /var/www/html;
     index index.html;
     
     # Handle 404s by redirecting to index.html (for SPA routing)
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     # Set caching headers for static assets
     location ~* \.(js|css|jpg|jpeg|png|gif|ico)$ {
       expires 1y;
       add_header Cache-Control "public, max-age=31536000";
     }
   }
   ```

### Option 2: Netlify

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Sign up for a Netlify account at https://netlify.com
3. Click "New site from Git" and select your repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

### Option 3: Vercel

1. Push your code to a Git repository
2. Sign up for a Vercel account at https://vercel.com
3. Click "Import Project" and select your repository
4. Vercel should automatically detect the build settings
5. Click "Deploy"

### Option 4: GitHub Pages

1. Install the gh-pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add these scripts to your package.json:
   ```json
   "scripts": {
     "build": "webpack --mode production",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Environment Variables

If your application uses environment variables, create a `.env` file in the root directory with your configuration:

```
API_URL=https://your-api-url.com
```

## Server-Side Requirements

If you're using the multiplayer functionality, make sure to:

1. Deploy the server component (in the `server` directory)
2. Configure the client to connect to the correct server URL

## Post-Deployment Verification

After deployment, verify that:

1. The main game loads correctly
2. The AI functionality works
3. Multiplayer connections work (if applicable)
4. All assets (images, fonts) load properly

## Troubleshooting

- **404 errors**: Ensure your server is configured to handle single-page application routing
- **CORS issues**: If using a separate API server, ensure CORS headers are properly set
- **Stockfish not loading**: Verify the path to the Stockfish worker file is correct

## Performance Optimization

- Consider using a CDN for faster content delivery
- Enable HTTP/2 on your server for improved performance
- Set appropriate cache headers for static assets 