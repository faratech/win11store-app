# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Windows 11 Store App - A React/TypeScript e-commerce application for showcasing and selling Windows 11 licenses and Microsoft 365 subscriptions. Deployed to XenForo forum installations.

## Common Development Commands

- **Development server**: `npm run dev` (runs on port 3001)
- **Build for production**: `npm run build` or `npm run build:full`
- **Type checking**: `tsc`
- **Linting**: `npm run lint` (ESLint with max-warnings 0)
- **Full deployment**: `./build-full.sh` (builds and deploys to both forum instances)
- **Update controller only**: `./update-controller.sh` (updates XenForo controller with latest asset hashes)

## Architecture & Key Components

### Build & Deployment System
The application is deployed to two XenForo forum installations at `/web/public_html` and `/web/public_html2`. The build system:

1. **Vite build** generates hashed assets (index-[hash].js and index-[hash].css) in `dist/`
2. **build-full.sh** script:
   - Builds the React app
   - Copies dist files to `/js/Win11Store/` in both forum directories
   - Updates XenForo controllers with new asset hashes
   - Cleans up old build files (keeps last 3 versions)
   - Target URLs: windowsforum.com/store/ and windowslatest.com/store/

### XenForo Integration
- Controllers located at: `{public_html}/src/addons/Win11Store/Pub/Controller/Store.php`
- Asset paths must be updated after each build to match new hash values
- The build script automatically updates controller references

### Frontend Architecture
- **Main entry**: `src/main.tsx` - mounts React app
- **Core component**: `src/App.tsx` - single-page product showcase with:
  - Three product tabs (Windows 11 Home, Pro, Microsoft 365)
  - Product image galleries with lightbox functionality
  - Comparison tables and system requirements
  - Amazon affiliate links for monetization
- **Components**:
  - `src/components/ImageGallery.tsx` - handles product image display

### Styling
- **Tailwind CSS** for utility-first styling
- Dark mode support built-in
- Responsive design for mobile/desktop

## Important Notes

- This is an affiliate marketing application - all "Buy Now" buttons link to Amazon
- Product images should be placed in `public/images/` and will be deployed to forum directories
- The app uses a tabbed interface to switch between products without page reloads
- Build outputs use content hashing for cache busting - controller updates are critical