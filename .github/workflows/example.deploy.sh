#!/bin/bash
echo "Deploying application"
    cp /etc/codyon/.env ~/codyon-server/.env
    cd ~/codyon-server
    git pull --rebase origin main
    sudo docker login ghcr.io -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
    sudo docker stop codyon-server
    sudo docker rm codyon-server
    sudo docker rmi $DOCKER_IMAGES:latest
    sudo docker run -d -p 3000:3000 --network codyon-network --env-file ./.env --name codyon-server $DOCKER_IMAGES:latest
