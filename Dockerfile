# 1. Use an official Node.js runtime as a parent image
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json and package-lock.json first 
# (This allows Docker to cache dependencies if they haven't changed)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application code
COPY . .

# 6. Build the Next.js application for production
RUN npm run build

# 7. Expose the port the app runs on
EXPOSE 3000

# 8. Define the command to run the app
CMD ["npm", "start"]