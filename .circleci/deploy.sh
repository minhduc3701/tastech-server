#!/bin/bash

echo "Start deploy"
cd ~/server
git pull
npm install
pm2 stop server
pm2 start server
echo "Deploy end"
