FROM node 

# all next commands will be executed in this directory
WORKDIR /app

# copy files from host to image
COPY . . 

# or use absolute path
# COPY . /app

# run a command in the image while setting it up
RUN cd server && npm install && cd ../client && npm install

# only for documentation purposes
EXPOSE 3005

# this will not be executed when image is created
# only when container is created
CMD ["./scripts/run.sh"] 