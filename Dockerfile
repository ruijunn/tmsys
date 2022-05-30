# base image for the build
FROM node:16-alpine

# sets the working directory of the container
WORKDIR /app

# copy the package.json file to the current directory in the container
COPY package.json .

# install dependencies
RUN npm install

# copy all the files from the current directory into the container
COPY . .

# define the port number the container should expose
EXPOSE $PORT

# run the application
CMD ["node", "app.js"]