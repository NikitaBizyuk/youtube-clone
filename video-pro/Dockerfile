# Use an official Node  runtime as a parent image
FROM node:18

# set the working directory in the conatiner to /app
WORKDIR /app

# Copy package.json and package - lock.json into working directory
COPY package*.json ./

# Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Install any needed packages specified in  the package.json
RUN npm install

# Copy app source inside the docker image
COPY . .

RUN npm run build

# Make port 8080(for cloud run else 3000 for local) available outside this  container
EXPOSE 8080

# Define  the command to run your app using CMD (only one CMD  allowed)
CMD ["node", "dist/index.js"]
