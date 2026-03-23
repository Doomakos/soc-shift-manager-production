# Frontend Dockerfile for SOC Shift Manager
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps for compatibility
RUN npm install --legacy-peer-deps

# Copy application code
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js .
COPY postcss.config.js .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
