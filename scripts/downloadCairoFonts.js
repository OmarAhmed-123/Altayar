/**
 * Script to download Cairo fonts for Arabic PDF support
 * Run: node scripts/downloadCairoFonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../assets/fonts');

// Ensure fonts directory exists
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Cairo font URLs from Google Fonts CDN
const fontUrls = {
  regular: 'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf',
  bold: 'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf'
};

// Alternative: Direct download from GitHub (updated paths)
const githubUrls = {
  regular: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/static/Cairo-Regular.ttf',
  bold: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/static/Cairo-Bold.ttf'
};

// Alternative 2: Use variable font (works for both regular and bold)
const variableFontUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf';

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(filepath)}...`);
    
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${path.basename(filepath)}`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadFonts() {
  try {
    console.log('📥 Downloading Cairo fonts for Arabic PDF support...\n');
    
    const regularPath = path.join(fontsDir, 'Cairo-Regular.ttf');
    const boldPath = path.join(fontsDir, 'Cairo-Bold.ttf');
    
    // Try GitHub URLs first (more reliable)
    let downloaded = false;
    try {
      console.log('Trying GitHub URLs...');
      await downloadFile(githubUrls.regular, regularPath);
      await downloadFile(githubUrls.bold, boldPath);
      downloaded = true;
    } catch (githubError) {
      console.log('⚠️ GitHub download failed:', githubError.message);
      console.log('Trying alternative method...');
      
      // Try using http instead of https for some networks
      try {
        const http = require('http');
        const httpUrl = githubUrls.regular.replace('https://', 'http://');
        await downloadFile(httpUrl, regularPath);
        await downloadFile(githubUrls.bold.replace('https://', 'http://'), boldPath);
        downloaded = true;
      } catch (httpError) {
        console.log('⚠️ HTTP download also failed');
      }
    }
    
    if (downloaded) {
      console.log('\n✅ All fonts downloaded successfully!');
      console.log('📁 Fonts location:', fontsDir);
      return;
    }
    
    // If all downloads fail, provide manual instructions
    console.error('\n❌ Failed to download fonts automatically.');
    console.log('\n📋 Manual download instructions:');
    console.log('1. Visit: https://fonts.google.com/specimen/Cairo');
    console.log('2. Click "Download family"');
    console.log('3. Extract the ZIP file');
    console.log('4. Copy Cairo-Regular.ttf and Cairo-Bold.ttf to:', fontsDir);
    console.log('\nOr use this direct link:');
    console.log('https://github.com/google/fonts/tree/main/ofl/cairo/static');
    console.log('\n⚠️ Note: PDFs will still work but Arabic text may not display correctly without Cairo fonts.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please download fonts manually from:');
    console.log('https://fonts.google.com/specimen/Cairo');
    console.log('And place them in:', fontsDir);
  }
}

// Run the download
downloadFonts();

