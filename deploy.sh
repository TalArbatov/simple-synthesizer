#!/bin/bash

cd client

npm run build

cd ../server

npm run build

docker build --platform=linux/amd64 -t talarbatov/synth .

docker push talarbatov/synth:latest    