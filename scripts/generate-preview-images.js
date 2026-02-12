const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePreviewImages() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for high-quality screenshots (landscape 16:9 ratio)
    await page.setViewport({ width: 1400, height: 800, deviceScaleFactor: 2 });
    
    // Navigate to the preview page (assuming it's running locally)
    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}/preview-images`;
    
    console.log(`Navigating to ${url}...`);
    console.log('Make sure your Next.js dev server is running (pnpm dev)');
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for content to fully render
    await page.waitForTimeout(3000);
    
    // Create output directory
    const outputDir = path.join(process.cwd(), 'public', 'preview-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Preview containers with IDs
    const previews = [
      { name: 'calendar-view', id: 'calendar-preview-container' },
      { name: 'lesson-planning', id: 'lesson-planning-preview-container' },
      { name: 'setup-organisation', id: 'setup-preview-container' },
      { name: 'task-management', id: 'tasks-preview-container' }
    ];
    
    for (const preview of previews) {
      console.log(`Capturing ${preview.name}...`);
      
      try {
        // Wait for the element to be visible
        await page.waitForSelector(`#${preview.id}`, { timeout: 5000 });
        
        const element = await page.$(`#${preview.id}`);
        
        if (element) {
          await element.screenshot({
            path: path.join(outputDir, `${preview.name}.png`),
            type: 'png'
          });
          console.log(`✓ Saved ${preview.name}.png`);
        } else {
          console.log(`⚠ Could not find element #${preview.id}`);
        }
      } catch (error) {
        console.error(`Error capturing ${preview.name}:`, error.message);
      }
    }
    
    console.log('\n✅ All images generated successfully!');
    console.log(`📁 Images saved to: ${outputDir}`);
    console.log('\nFiles created:');
    previews.forEach(p => {
      console.log(`  - ${p.name}.png`);
    });
    
  } catch (error) {
    console.error('Error generating images:', error);
    console.log('\n💡 Make sure your Next.js dev server is running:');
    console.log('   pnpm dev');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
if (require.main === module) {
  generatePreviewImages().catch((error) => {
    console.error('Failed to generate images:', error);
    process.exit(1);
  });
}

module.exports = { generatePreviewImages };

