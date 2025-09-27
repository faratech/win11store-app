#!/bin/bash

echo "Building Windows 11 Store app..."
npm run build

echo "Copying build files to public directory..."
mkdir -p /web/public_html/js/Win11Store
cp -r dist/* /web/public_html/js/Win11Store/

echo "Updating XenForo controller..."
./update-controller.sh

echo "Build and deployment complete!"