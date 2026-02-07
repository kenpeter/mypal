#!/usr/bin/env node
/**
 * Proper MGO/SSS Sprite Frame Extractor
 * MGO files contain multiple animation frames in sMKF format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images';
const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';
const PAL_FILE = '/Users/kenpeter/Downloads/PAL/PAT.MKF';

// Read MKF structure
function readMKFIndex(data) {
    const indices = [];
    const firstIndex = data.readUInt32LE(0);
    const subfiles = Math.floor(firstIndex / 4) - 1;
    
    for (let i = 0; i < subfiles; i++) {
        const begin = data.readUInt32LE(i * 4);
        const end = data.readUInt32LE((i + 1) * 4);
        if (begin > 0 && begin !== end && end <= data.length) {
            indices.push({ begin, end, size: end - begin });
        }
    }
    return indices;
}

// Extract sMKF (secondary MKF used in sprites)
function extractSMKF(data) {
    // sMKF uses 2-byte offsets
    const indices = [];
    const count = data.readUInt16LE(0);
    
    for (let i = 0; i < count; i++) {
        const offset = data.readUInt16LE((i + 1) * 2) * 2;
        const nextOffset = data.readUInt16LE((i + 2) * 2) * 2;
        if (offset > 0 && nextOffset > offset && nextOffset <= data.length) {
            indices.push({
                begin: offset,
                end: nextOffset,
                size: nextOffset - offset
            });
        }
    }
    return indices;
}

// Convert enemy sprites with proper frame extraction
function convertEnemySprites() {
    console.log('👹 Converting enemy sprites with proper frames...\n');
    
    const enemyDir = path.join(ASSETS_DIR, 'enemies');
    const outputDir = path.join(OUTPUT_DIR, 'enemies');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process first 10 enemies
    const files = fs.readdirSync(enemyDir).filter(f => f.endsWith('.mgo')).slice(0, 10);
    
    files.forEach((file, enemyIdx) => {
        console.log(`Enemy ${enemyIdx}: ${file}`);
        const inputFile = path.join(enemyDir, file);
        const data = fs.readFileSync(inputFile);
        
        // Step 1: Decompress YJ1
        const tempYJ1 = `/tmp/enemy_${enemyIdx}_yj1.tmp`;
        try {
            execSync(`cd "${TOOLS_DIR}" && python3 deyj1.py "${inputFile}" -o "${tempYJ1}"`, { stdio: 'pipe' });
        } catch(e) {
            // May not be YJ1 compressed
            fs.copyFileSync(inputFile, tempYJ1);
        }
        
        const decompressed = fs.readFileSync(tempYJ1);
        
        // Step 2: Extract frames from sMKF
        const frames = extractSMKF(decompressed);
        
        if (frames.length === 0) {
            console.log('  No frames found, trying as single image...');
            // Try common enemy sizes
            convertSingleSprite(decompressed, path.join(outputDir, `enemy${enemyIdx}_0.png`), enemyIdx);
        } else {
            console.log(`  Found ${frames.length} frames`);
            
            // Convert first few frames
            frames.slice(0, 3).forEach((frame, frameIdx) => {
                const frameData = decompressed.slice(frame.begin, frame.end);
                const outputFile = path.join(outputDir, `enemy${enemyIdx}_${frameIdx}.png`);
                
                // Try to detect size or use common sizes
                convertSingleSprite(frameData, outputFile, enemyIdx, frameIdx);
            });
        }
        
        // Cleanup
        try { fs.unlinkSync(tempYJ1); } catch(e) {}
    });
}

// Convert a single sprite frame
function convertSingleSprite(data, outputFile, enemyIdx, frameIdx = 0) {
    // Common enemy sprite sizes in PAL1
    const sizes = [
        { w: 48, h: 48 },   // Small enemies
        { w: 64, h: 64 },   // Medium enemies
        { w: 96, h: 96 },   // Large enemies
        { w: 128, h: 128 } // Bosses
    ];
    
    // Try each size
    for (const size of sizes) {
        const tempFile = `/tmp/sprite_${enemyIdx}_${frameIdx}_${size.w}x${size.h}.tmp`;
        fs.writeFileSync(tempFile, data);
        
        try {
            execSync(
                `cd "${TOOLS_DIR}" && python3 derle.py "${tempFile}" -o "${outputFile}" -p "${PAL_FILE}"`,
                { stdio: 'pipe', timeout: 5000 }
            );
            
            // Check if output is valid
            const stats = fs.statSync(outputFile);
            if (stats.size > 500) {
                console.log(`  ✓ Frame ${frameIdx}: ${size.w}x${size.h} (${Math.round(stats.size/1024)}KB)`);
                fs.unlinkSync(tempFile);
                return true;
            }
        } catch(e) {
            // Try next size
        }
        
        fs.unlinkSync(tempFile);
    }
    
    console.log(`  ✗ Frame ${frameIdx}: Could not convert`);
    return false;
}

// Convert hero sprites from SSS
function convertHeroSprites() {
    console.log('\n👤 Converting hero sprites...\n');
    
    const spriteDir = path.join(ASSETS_DIR, 'sprites');
    const outputDir = path.join(OUTPUT_DIR, 'sprites');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const heroNames = ['xiaoyao', 'linger', 'yueru', 'anuanu'];
    const files = fs.readdirSync(spriteDir).filter(f => f.endsWith('.sss')).slice(0, 4);
    
    files.forEach((file, idx) => {
        const heroName = heroNames[idx] || `hero${idx}`;
        console.log(`Hero: ${heroName} (${file})`);
        
        const inputFile = path.join(spriteDir, file);
        const data = fs.readFileSync(inputFile);
        
        // Check if it's sMKF format
        const sig = data.slice(0, 4).toString('hex');
        console.log(`  Signature: ${sig}`);
        
        // Try to extract frames
        const frames = extractSMKF(data);
        console.log(`  Found ${frames.length} frames`);
        
        if (frames.length > 0) {
            // Convert first few frames
            frames.slice(0, 5).forEach((frame, frameIdx) => {
                const frameData = data.slice(frame.begin, frame.end);
                const outputFile = path.join(outputDir, `${heroName}_${frameIdx}.png`);
                
                // Hero sizes
                const sizes = [
                    { w: 48, h: 72 },
                    { w: 64, h: 96 },
                    { w: 96, h: 96 }
                ];
                
                for (const size of sizes) {
                    const tempFile = `/tmp/${heroName}_${frameIdx}.tmp`;
                    fs.writeFileSync(tempFile, frameData);
                    
                    try {
                        execSync(
                            `cd "${TOOLS_DIR}" && python3 derle.py "${tempFile}" -o "${outputFile}" -p "${PAL_FILE}"`,
                            { stdio: 'pipe', timeout: 5000 }
                        );
                        
                        const stats = fs.statSync(outputFile);
                        if (stats.size > 500) {
                            console.log(`  ✓ Frame ${frameIdx}: ${size.w}x${size.h}`);
                            fs.unlinkSync(tempFile);
                            break;
                        }
                    } catch(e) {}
                    
                    fs.unlinkSync(tempFile);
                }
            });
        }
    });
}

// Run conversions
console.log('🎮 PAL1 Sprite Frame Extractor');
console.log('==============================\n');

convertEnemySprites();
convertHeroSprites();

console.log('\n✅ Extraction complete!');
console.log(`📁 Check: ${OUTPUT_DIR}`);
