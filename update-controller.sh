#!/bin/bash

CONTROLLER_PATH="/web/public_html/src/addons/Win11Store/Pub/Controller/Store.php"
JS_DIR="/web/public_html/js/Win11Store"

echo "Finding latest build files..."
LATEST_CSS=$(ls -t $JS_DIR/index-*.css 2>/dev/null | head -1 | xargs -n 1 basename)
LATEST_JS=$(ls -t $JS_DIR/index-*.js 2>/dev/null | head -1 | xargs -n 1 basename)

if [ -z "$LATEST_CSS" ] || [ -z "$LATEST_JS" ]; then
    echo "Error: Could not find build files in $JS_DIR"
    echo "Please run 'npm run build' first"
    exit 1
fi

echo "Found CSS: $LATEST_CSS"
echo "Found JS: $LATEST_JS"

if [ -f "$CONTROLLER_PATH" ]; then
    echo "Creating backup of controller..."
    cp "$CONTROLLER_PATH" "$CONTROLLER_PATH.bak"

    echo "Updating controller with new asset paths..."
    sed -i "s|'css' => '/js/Win11Store/index-[^']*\.css'|'css' => '/js/Win11Store/$LATEST_CSS'|g" "$CONTROLLER_PATH"
    sed -i "s|'js' => '/js/Win11Store/index-[^']*\.js'|'js' => '/js/Win11Store/$LATEST_JS'|g" "$CONTROLLER_PATH"

    echo "Controller updated successfully!"
else
    echo "Controller not found at $CONTROLLER_PATH"
    echo "Please create the XenForo addon first"
fi