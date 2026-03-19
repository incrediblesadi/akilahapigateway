# Use Node 22 to match @octokit/rest runtime and local development
FROM node:22-slim

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
