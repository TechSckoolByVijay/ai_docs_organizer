# Frontend Dockerfile for React application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV REACT_APP_API_BASE_URL=http://localhost:8000

# Start the development server
CMD ["npm", "start"]