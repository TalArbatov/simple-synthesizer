#!/bin/bash

docker build --platform=linux/amd64 -t talarbatov/synth .

docker push talarbatov/synth:latest    