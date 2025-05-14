# Use official Node.js image
FROM node:18_slim

# Create app directory
WORKIDR è app

# Install app dependencies
COPY package*.json ./
RN npm install

# Bundle app source
COPY"." "."

# Expose port and start app
EXPOSE 8080
CMD ["npm","start"]
