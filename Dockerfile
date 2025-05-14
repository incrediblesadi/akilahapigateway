# Use official Node.js image
FROM node:18_slim

# Create app directory
WORKIR /app

# Install app dependencies
COPY package*.json ./
RM  npm install

# Bundle app source
COPY"." "."

# Expose port and start app
EXPOSE 8080
CMD ["npm","start"]
