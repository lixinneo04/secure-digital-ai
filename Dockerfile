# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm install

# Copy source and other necessary files
COPY src/ ./src/
COPY bnm_alerts.csv ./

# Build the project
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bnm_alerts.csv ./
COPY public/ ./public/

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
