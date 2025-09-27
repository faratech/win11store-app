#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Windows 11 Store Build & Deploy${NC}"
echo -e "${GREEN}========================================${NC}"

# Build the app
echo -e "\n${YELLOW}Step 1: Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Exiting...${NC}"
    exit 1
fi

# Set up directories
PUBLIC_HTML1="/web/public_html"
PUBLIC_HTML2="/web/public_html2"
JS_DIR1="$PUBLIC_HTML1/js/Win11Store"
JS_DIR2="$PUBLIC_HTML2/js/Win11Store"
CONTROLLER1="$PUBLIC_HTML1/src/addons/Win11Store/Pub/Controller/Store.php"
CONTROLLER2="$PUBLIC_HTML2/src/addons/Win11Store/Pub/Controller/Store.php"

# Create directories if they don't exist
echo -e "\n${YELLOW}Step 2: Creating directories...${NC}"
mkdir -p "$JS_DIR1"
mkdir -p "$JS_DIR2"

# Copy built files to both locations
echo -e "\n${YELLOW}Step 3: Deploying built files...${NC}"
echo "Copying to $JS_DIR1..."
cp -r dist/* "$JS_DIR1/"

echo "Copying to $JS_DIR2..."
cp -r dist/* "$JS_DIR2/"

# Copy images if they exist
if [ -d "public/images" ]; then
    echo -e "\n${YELLOW}Step 4: Copying product images...${NC}"
    cp -r public/images/* "$JS_DIR1/images/" 2>/dev/null
    cp -r public/images/* "$JS_DIR2/images/" 2>/dev/null
fi

# Find the latest CSS and JS files
echo -e "\n${YELLOW}Step 5: Finding latest asset files...${NC}"
LATEST_CSS=$(ls -t dist/index-*.css 2>/dev/null | head -1 | xargs -n 1 basename)
LATEST_JS=$(ls -t dist/index-*.js 2>/dev/null | head -1 | xargs -n 1 basename)

if [ -z "$LATEST_CSS" ] || [ -z "$LATEST_JS" ]; then
    echo -e "${RED}Error: Could not find build files in dist directory${NC}"
    exit 1
fi

echo -e "Found CSS: ${GREEN}$LATEST_CSS${NC}"
echo -e "Found JS: ${GREEN}$LATEST_JS${NC}"

# Update controller function
update_controller() {
    local CONTROLLER_PATH=$1
    local LOCATION_NAME=$2

    if [ -f "$CONTROLLER_PATH" ]; then
        echo -e "\n${YELLOW}Updating controller for $LOCATION_NAME...${NC}"

        # Create backup
        cp "$CONTROLLER_PATH" "$CONTROLLER_PATH.bak"

        # Update asset paths
        sed -i "s|'css' => '/js/Win11Store/index-[^']*\.css'|'css' => '/js/Win11Store/$LATEST_CSS'|g" "$CONTROLLER_PATH"
        sed -i "s|'js' => '/js/Win11Store/index-[^']*\.js'|'js' => '/js/Win11Store/$LATEST_JS'|g" "$CONTROLLER_PATH"

        echo -e "${GREEN}✓ Controller updated for $LOCATION_NAME${NC}"

        # Show the updated lines
        echo "Updated asset references:"
        grep -E "'(css|js)' =>" "$CONTROLLER_PATH" | head -2
    else
        echo -e "${YELLOW}⚠ Controller not found at $CONTROLLER_PATH${NC}"
    fi
}

# Update both controllers
echo -e "\n${YELLOW}Step 6: Updating XenForo controllers...${NC}"
update_controller "$CONTROLLER1" "public_html"
update_controller "$CONTROLLER2" "public_html2"

# Verify deployment
echo -e "\n${YELLOW}Step 7: Verifying deployment...${NC}"
if [ -f "$JS_DIR1/$LATEST_CSS" ] && [ -f "$JS_DIR1/$LATEST_JS" ]; then
    echo -e "${GREEN}✓ public_html deployment verified${NC}"
else
    echo -e "${RED}✗ public_html deployment failed${NC}"
fi

if [ -f "$JS_DIR2/$LATEST_CSS" ] && [ -f "$JS_DIR2/$LATEST_JS" ]; then
    echo -e "${GREEN}✓ public_html2 deployment verified${NC}"
else
    echo -e "${RED}✗ public_html2 deployment failed${NC}"
fi

# Clean up old build files (keep last 3 versions)
echo -e "\n${YELLOW}Step 8: Cleaning up old build files...${NC}"
cleanup_old_files() {
    local DIR=$1
    local PATTERN=$2

    # Count files matching pattern
    FILE_COUNT=$(ls -1 "$DIR"/$PATTERN 2>/dev/null | wc -l)

    if [ "$FILE_COUNT" -gt 3 ]; then
        # Delete all but the 3 newest
        ls -t "$DIR"/$PATTERN | tail -n +4 | while read -r file; do
            echo "Removing old file: $(basename "$file")"
            rm "$file"
        done
    fi
}

cleanup_old_files "$JS_DIR1" "index-*.css"
cleanup_old_files "$JS_DIR1" "index-*.js"
cleanup_old_files "$JS_DIR2" "index-*.css"
cleanup_old_files "$JS_DIR2" "index-*.js"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Build and deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nThe Windows 11 Store is now available at:"
echo -e "  • ${GREEN}https://windowsforum.com/store/${NC}"
echo -e "  • ${GREEN}https://windowslatest.com/store/${NC}"