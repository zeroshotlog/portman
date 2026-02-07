import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Configuration for each banner type
const BANNER_CONFIGS = {
  ogp: {
    template: 'ogp.html',
    width: 1200,
    height: 630,
    output: 'ogp.png',
    deviceScaleFactor: 2,
    description: 'OGP Image (1200x630)',
  },
  twitter: {
    template: 'twitter.html',
    width: 1200,
    height: 600,
    output: 'twitter-card.png',
    deviceScaleFactor: 2,
    description: 'Twitter Card (1200x600)',
  },
};

/**
 * Convert image file to Base64 data URL
 * @param {string} filepath - Path to image file
 * @returns {string} Base64 data URL
 */
function imageToBase64(filepath) {
  if (!existsSync(filepath)) {
    throw new Error(`Image file not found: ${filepath}`);
  }

  const data = readFileSync(filepath);
  const ext = filepath.split('.').pop().toLowerCase();
  const mimeMap = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
  };

  const mime = mimeMap[ext] || 'image/png';
  return `data:${mime};base64,${data.toString('base64')}`;
}

/**
 * Generate a single banner
 * @param {string} type - Banner type (ogp, twitter)
 * @param {object} config - Banner configuration
 * @param {string} iconPath - Path to app icon
 * @param {string} outputDir - Output directory
 */
async function generateBanner(type, config, iconPath, outputDir) {
  console.log(`\n🎨 Generating ${config.description}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: config.deviceScaleFactor || 2,
    });

    // Load template
    const templatePath = join(__dirname, 'templates', config.template);
    if (!existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    let html = readFileSync(templatePath, 'utf-8');

    // Replace placeholders
    const iconBase64 = imageToBase64(iconPath);
    html = html.replace(/\{\{ICON_URL\}\}/g, iconBase64);

    // Set HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Take screenshot
    const outputPath = join(outputDir, config.output);
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: false,
    });

    console.log(`✅ Generated: ${outputPath}`);
    console.log(`   Size: ${config.width}x${config.height}`);
    console.log(`   Scale: ${config.deviceScaleFactor}x`);

    return outputPath;
  } catch (error) {
    console.error(`❌ Error generating ${type}:`, error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Portman Banner Generator\n');
  console.log('================================================');

  const args = process.argv.slice(2);
  const iconPath = join(projectRoot, 'assets', 'icon.png');
  const outputDir = join(projectRoot, 'assets');

  // Validate icon exists
  if (!existsSync(iconPath)) {
    console.error(`❌ Icon not found: ${iconPath}`);
    process.exit(1);
  }

  // Determine which banners to generate
  let typesToGenerate = [];

  if (args.includes('--all') || args.length === 0) {
    typesToGenerate = Object.keys(BANNER_CONFIGS);
  } else {
    if (args.includes('--ogp')) typesToGenerate.push('ogp');
    if (args.includes('--twitter')) typesToGenerate.push('twitter');
  }

  if (typesToGenerate.length === 0) {
    console.log('Usage:');
    console.log('  npm run generate:banners          # Generate all banners');
    console.log('  npm run generate:banners -- --all # Generate all banners');
    console.log('  npm run generate:banners -- --ogp # Generate OGP only');
    console.log('  npm run generate:banners -- --twitter # Generate Twitter Card only');
    process.exit(0);
  }

  console.log(`📦 Input:`);
  console.log(`   Icon: ${iconPath}`);
  console.log(`\n📂 Output Directory: ${outputDir}`);
  console.log(`\n🎯 Generating ${typesToGenerate.length} banner(s):\n`);

  const results = [];

  // Generate each banner sequentially
  for (const type of typesToGenerate) {
    const config = BANNER_CONFIGS[type];
    try {
      const outputPath = await generateBanner(type, config, iconPath, outputDir);
      results.push({ type, success: true, path: outputPath });
    } catch (error) {
      results.push({ type, success: false, error: error.message });
    }
  }

  // Print summary
  console.log('\n================================================');
  console.log('📊 Summary:\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log(`✅ Successfully generated ${successful.length} banner(s):`);
    successful.forEach(r => {
      const config = BANNER_CONFIGS[r.type];
      console.log(`   - ${config.description}: ${r.path}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed to generate ${failed.length} banner(s):`);
    failed.forEach(r => {
      console.log(`   - ${r.type}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\n🎉 All banners generated successfully!');
  console.log('\n💡 Next steps:');
  console.log('   1. Review the generated images in website/assets/');
  console.log('   2. Update index.html OGP/Twitter meta tags if needed');
  console.log('   3. Commit and deploy the changes\n');
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
