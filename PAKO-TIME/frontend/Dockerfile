# Use official Node.js image
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Set environment variable for API URL to localhost for browser access
ENV REACT_APP_API_URL=http://localhost:3001

RUN npm run build

# Serve the build with a static server
RUN npm install -g serve

EXPOSE 5173
CMD ["serve", "-s", "build", "-l", "5173"]