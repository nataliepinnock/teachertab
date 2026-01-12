# Instagram Post Assets - TeacherTab

This folder contains HTML files for creating branded Instagram post images.

## How to Convert HTML to Images

### Option 1: Using Browser Screenshot
1. Open any HTML file in a browser (Chrome, Firefox, etc.)
2. Right-click → Inspect → Toggle Device Toolbar (Ctrl+Shift+M)
3. Set dimensions to 1080x1080px
4. Take a screenshot or use browser extensions like "Full Page Screen Capture"

### Option 2: Using Online Tools
- **htmlcsstoimage.com** - Upload HTML file, get PNG
- **screenshotapi.net** - API-based screenshot service
- **html2canvas** - JavaScript library for rendering HTML to canvas

### Option 3: Using Command Line Tools
```bash
# Install playwright
npm install -g playwright

# Or use puppeteer
npm install -g puppeteer

# Then use a script to convert HTML to PNG
```

### Option 4: Using Design Tools
1. Open the HTML file in a browser
2. Take a screenshot
3. Import into Canva, Figma, or Adobe Express
4. Adjust if needed and export as 1080x1080px PNG

## Files Included

1. **post-1-welcome.html** - Welcome & Introduction post
2. **post-2-calendar.html** - Calendar Views feature highlight
3. **post-3-lesson-planning.html** - Lesson Planning feature highlight
4. **post-4-tasks.html** - Task Management feature highlight
5. **post-5-beta-cta.html** - Beta program call-to-action

## Brand Colors

- **Primary Blue:** #001b3d
- **Secondary Blue:** #002855
- **Accent Orange:** #fbae36
- **Dark Orange:** #d69225

## Image Specifications

- **Dimensions:** 1080x1080px (Instagram square post)
- **Format:** PNG (recommended) or JPG
- **File Size:** Keep under 8MB for Instagram

## Quick Conversion Script

If you have Node.js installed, you can create a simple conversion script:

```javascript
// convert.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertHTMLToImage(htmlFile, outputFile) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1080, height: 1080 });
  await page.goto(`file://${path.resolve(htmlFile)}`);
  await page.screenshot({ path: outputFile, width: 1080, height: 1080 });
  
  await browser.close();
}

// Convert all HTML files
const files = [
  'post-1-welcome.html',
  'post-2-calendar.html',
  'post-3-lesson-planning.html',
  'post-4-tasks.html',
  'post-5-beta-cta.html'
];

files.forEach(async (file, index) => {
  await convertHTMLToImage(file, `post-${index + 1}.png`);
});
```

Run with: `node convert.js`

## Notes

- All images are designed at 1080x1080px for Instagram square posts
- Colors match the TeacherTab brand guidelines
- Text is optimized for readability on mobile devices
- Each post includes the @TeacherTab branding

