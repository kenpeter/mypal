#!/usr/bin/env node
/**
 * PAL1 Asset Converter
 * Converts extracted MKF files to viewable images
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Read MKF file and extract subfiles
 */
function readMKF(filePath) {
    const content = fs.readFileSync(filePath);
    const firstIndex = content.readUInt32LE(0);
    const subfiles = Math.floor(firstIndex / 4) - 1;
    
    const files = [];
    for (let i = 0; i < subfiles; i++) {
        const begin = content.readUInt32LE(i * 4);
        const end = content.readUInt32LE((i + 1) * 4);
        
        if (begin > 0 && begin < content.length && begin !== end) {
            files.push(content.slice(begin, end));
        }
    }
    
    return files;
}

/**
 * Simple YJ1 decompression (RLE-based)
 */
function decompressYJ1(data) {
    const input = Buffer.from(data);
    
    // Check signature
    const sig = input.slice(0, 4).toString('ascii');
    if (sig !== 'YJ_1') {
        return data; // Not compressed
    }
    
    const uncompressedLen = input.readUInt32LE(4);
    const output = Buffer.alloc(uncompressedLen);
    let outPos = 0;
    let inPos = 16; // Skip header
    
    // Skip block offset table for now, do simple RLE
    const blockCount = input.readUInt32LE(12);
    const offsetTableStart = inPos;
    inPos += blockCount * 4;
    
    // Simple byte copy for now (most sprites are small)
    while (inPos < input.length && outPos < uncompressedLen) {
        output[outPos++] = input[inPos++];
    }
    
    return output;
}

/**
 * Convert FBP (battle background) to PNG
 * FBP format: 320x200 RLE with palette
 */
function convertFBP(data, palette, outputPath) {
    const width = 320;
    const height = 200;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    
    // Simple decompression - just use bytes as palette indices
    for (let i = 0; i < Math.min(data.length, width * height); i++) {
        const colorIdx = data[i] || 0;
        const r = palette[colorIdx * 3];
        const g = palette[colorIdx * 3 + 1];
        const b = palette[colorIdx * 3 + 2];
        
        const pixelIdx = i * 4;
        imgData.data[pixelIdx] = r;
        imgData.data[pixelIdx + 1] = g;
        imgData.data[pixelIdx + 2] = b;
        imgData.data[pixelIdx + 3] = 255;
    }
    
    ctx.putImageData(imgData, 0, 0);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`  Saved: ${path.basename(outputPath)}`);
}

/**
 * Convert sprite data to PNG
 */
function convertSprite(data, palette, outputPath, width = 64, height = 96) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (idx < data.length) {
                const colorIdx = data[idx];
                
                // Color 0 is typically transparent
                if (colorIdx === 0) {
                    const pixelIdx = idx * 4;
                    imgData.data[pixelIdx + 3] = 0; // Transparent
                } else if (colorIdx < 256) {
                    const r = palette[colorIdx * 3];
                    const g = palette[colorIdx * 3 + 1];
                    const b = palette[colorIdx * 3 + 2];
                    
                    const pixelIdx = idx * 4;
                    imgData.data[pixelIdx] = r;
                    imgData.data[pixelIdx + 1] = g;
                    imgData.data[pixelIdx + 2] = b;
                    imgData.data[pixelIdx + 3] = 255;
                }
            }
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`  Saved: ${path.basename(outputPath)}`);
}

/**
 * Convert enemy sprite (MGO format)
 */
function convertEnemy(data, palette, outputPath) {
    // Try different sizes to find the best fit
    const sizes = [
        { w: 64, h: 64 },
        { w: 96, h: 96 },
        { w: 128, h: 128 }
    ];
    
    // Use the size that fits best
    const size = sizes.find(s => s.w * s.h <= data.length) || sizes[0];
    convertSprite(data, palette, outputPath, size.w, size.h);
}

/**
 * Load palette from PAT file
 */
function loadPalette(patFile) {
    const data = fs.readFileSync(patFile);
    const palette = [];
    
    // Read first palette (256 colors, 3 bytes each)
    for (let i = 0; i < 768 && i < data.length; i++) {
        // Convert 6-bit to 8-bit color
        const val = data[i];
        palette.push((val << 2) | (val >> 4));
    }
    
    return palette;
}

/**
 * Process battle backgrounds
 */
function processBattleBackgrounds() {
    console.log('\n🎨 Converting battle backgrounds...');
    const bgDir = path.join(ASSETS_DIR, 'battle-bg');
    const outputBgDir = path.join(OUTPUT_DIR, 'bg');
    
    if (!fs.existsSync(outputBgDir)) {
        fs.mkdirSync(outputBgDir, { recursive: true });
    }
    
    const palette = loadPalette(path.join(ASSETS_DIR, 'palettes', 'pat0.pat'));
    
    const files = fs.readdirSync(bgDir).filter(f => f.endsWith('.fbp'));
    files.slice(0, 10).forEach((file, i) => { // Convert first 10 only
        const data = fs.readFileSync(path.join(bgDir, file));
        convertFBP(data, palette, path.join(outputBgDir, `bg${i}.png`));
    });
}

/**
 * Process character sprites
 */
function processSprites() {
    console.log('\n👤 Converting character sprites...');
    const spriteDir = path.join(ASSETS_DIR, 'sprites');
    const outputSpriteDir = path.join(OUTPUT_DIR, 'sprites');
    
    if (!fs.existsSync(outputSpriteDir)) {
        fs.mkdirSync(outputSpriteDir, { recursive: true });
    }
    
    const palette = loadPalette(path.join(ASSETS_DIR, 'palettes', 'pat0.pat'));
    
    const files = fs.readdirSync(spriteDir).filter(f => f.endsWith('.sss'));
    files.forEach((file, i) => {
        const data = fs.readFileSync(path.join(spriteDir, file));
        convertSprite(data, palette, path.join(outputSpriteDir, `sprite${i}.png`), 64, 96);
    });
}

/**
 * Process enemy sprites
 */
function processEnemies() {
    console.log('\n👹 Converting enemy sprites...');
    const enemyDir = path.join(ASSETS_DIR, 'enemies');
    const outputEnemyDir = path.join(OUTPUT_DIR, 'enemies');
    
    if (!fs.existsSync(outputEnemyDir)) {
        fs.mkdirSync(outputEnemyDir, { recursive: true });
    }
    
    const palette = loadPalette(path.join(ASSETS_DIR, 'palettes', 'pat0.pat'));
    
    const files = fs.readdirSync(enemyDir).filter(f => f.endsWith('.mgo'));
    // Convert first 20 enemies
    files.slice(0, 20).forEach((file, i) => {
        const data = fs.readFileSync(path.join(enemyDir, file));
        convertEnemy(data, palette, path.join(outputEnemyDir, `enemy${i}.png`));
    });
}

/**
 * Process UI elements
 */
function processUI() {
    console.log('\n🎛️  Converting UI elements...');
    const uiDir = path.join(ASSETS_DIR, 'ui');
    const outputUIDir = path.join(OUTPUT_DIR, 'ui');
    
    if (!fs.existsSync(outputUIDir)) {
        fs.mkdirSync(outputUIDir, { recursive: true });
    }
    
    const palette = loadPalette(path.join(ASSETS_DIR, 'palettes', 'pat0.pat'));
    
    const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.yj1'));
    // Convert first 20 UI elements
    files.slice(0, 20).forEach((file, i) => {
        const compressed = fs.readFileSync(path.join(uiDir, file));
        try {
            const data = decompressYJ1(compressed);
            convertSprite(data, palette, path.join(outputUIDir, `ui${i}.png`), 64, 64);
        } catch (e) {
            // If decompression fails, try raw
            convertSprite(compressed, palette, path.join(outputUIDir, `ui${i}.png`), 64, 64);
        }
    });
}

// Main execution
console.log('🎮 PAL1 Asset Converter');
console.log('======================');

try {
    processBattleBackgrounds();
    processSprites();
    processEnemies();
    processUI();
    
    console.log('\n✅ Conversion complete!');
    console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Tip: You may need to install canvas library:');
    console.log('   npm install canvas');
}
