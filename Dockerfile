# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port and start app
EXPOSE 8080
CMD ["npm", "start"]
