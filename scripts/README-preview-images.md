# Generating Preview Images for Social Media

This script generates PNG images of the 4 app previews from the homepage carousel.

## Quick Start

1. **Start your development server:**
   ```bash
   pnpm dev
   ```

2. **In a new terminal, run the image generation script:**
   ```bash
   pnpm generate:preview-images
   ```

3. **Find your images:**
   The images will be saved to `public/preview-images/`:
   - `calendar-view.png`
   - `lesson-planning.png`
   - `setup-organisation.png`
   - `task-management.png`

## Manual Method (Alternative)

If you prefer to capture them manually:

1. Visit `http://localhost:3000/preview-images` (or your deployed URL)
2. Use your browser's developer tools:
   - Right-click on each preview section
   - Select "Inspect"
   - Right-click the preview container element
   - Choose "Capture node screenshot"

## Image Specifications

- Format: PNG
- Quality: High resolution (2x device scale factor)
- Dimensions: Varies by preview (optimized for social media)

