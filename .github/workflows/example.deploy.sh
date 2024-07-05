echo "Deploying application"
    cp /etc/codyon/.env ~/codyon-server/.env
    cd ~/codyon-server
    git pull --rebase origin main
    sudo docker stop codyon-server
    sudo docker rm codyon-server
    sudo docker rmi ghcr.io/codyon-group/codyon-server:latest
    sudo docker run -d -p 3000:3000 --network codyon-network --env-file ./.env --name codyon-server ghcr.io/codyon-group/codyon-server:latest
