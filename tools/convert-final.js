#!/usr/bin/env node
/**
 * Proper PAL1 Asset Converter using palresearch tools
 * This script decompresses YJ1 and converts to PNG
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAL_DIR = '/Users/kenpeter/Downloads/PAL';
const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images';
const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function runPython(tool, args) {
    const cmd = `cd "${TOOLS_DIR}" && python3 ${tool} ${args}`;
    try {
        execSync(cmd, { stdio: 'pipe' });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Convert battle backgrounds (FBP)
 */
function convertBattleBackgrounds() {
    console.log('\n🎨 Converting battle backgrounds (FBP)...');
    const outputBgDir = path.join(OUTPUT_DIR, 'bg');
    if (!fs.existsSync(outputBgDir)) {
        fs.mkdirSync(outputBgDir, { recursive: true });
    }
    
    // Process first 10 FBP files
    const fbpFiles = fs.readdirSync(path.join(ASSETS_DIR, 'battle-bg'))
        .filter(f => f.endsWith('.fbp'))
        .slice(0, 10);
    
    fbpFiles.forEach((file, i) => {
        const inputFile = path.join(ASSETS_DIR, 'battle-bg', file);
        const outputFile = path.join(outputBgDir, `bg${i}.png`);
        
        console.log(`  ${i+1}/10: Converting ${file}...`);
        
        // Step 1: Decompress YJ1
        const tempFile = `/tmp/fbp_${i}_dec.tmp`;
        if (!runPython('deyj1.py', `"${inputFile}" -o "${tempFile}"`)) {
            console.log(`    ✗ Failed to decompress`);
            return;
        }
        
        // Step 2: Convert to PNG
        if (!runPython('defbp.py', `"${tempFile}" -p "${PAL_DIR}/PAT.MKF" -o "${outputFile}"`)) {
            console.log(`    ✗ Failed to convert`);
            return;
        }
        
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch(e) {}
        
        console.log(`    ✓ Saved: bg${i}.png`);
    });
}

/**
 * Convert sprites
 */
function convertSprites() {
    console.log('\n👤 Converting character sprites...');
    const outputSpriteDir = path.join(OUTPUT_DIR, 'sprites');
    if (!fs.existsSync(outputSpriteDir)) {
        fs.mkdirSync(outputSpriteDir, { recursive: true });
    }
    
    const sssFiles = fs.readdirSync(path.join(ASSETS_DIR, 'sprites'))
        .filter(f => f.endsWith('.sss'));
    
    sssFiles.forEach((file, i) => {
        const inputFile = path.join(ASSETS_DIR, 'sprites', file);
        const outputFile = path.join(outputSpriteDir, `sprite${i}.png`);
        
        console.log(`  ${i+1}/${sssFiles.length}: Converting ${file}...`);
        
        // Step 1: Decompress YJ1
        const tempFile = `/tmp/sss_${i}_dec.tmp`;
        if (!runPython('deyj1.py', `"${inputFile}" -o "${tempFile}"`)) {
            console.log(`    ✗ Failed to decompress`);
            return;
        }
        
        // Step 2: Convert to PNG using derle
        // Try different common sprite sizes
        const success = runPython('derle.py', `"${tempFile}" -o "${outputFile}" -p "${PAL_DIR}/PAT.MKF"`);
        
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch(e) {}
        
        if (success) {
            console.log(`    ✓ Saved: sprite${i}.png`);
        } else {
            console.log(`    ✗ Failed to convert`);
        }
    });
}

/**
 * Convert enemies
 */
function convertEnemies() {
    console.log('\n👹 Converting enemy sprites...');
    const outputEnemyDir = path.join(OUTPUT_DIR, 'enemies');
    if (!fs.existsSync(outputEnemyDir)) {
        fs.mkdirSync(outputEnemyDir, { recursive: true });
    }
    
    const enemyFiles = fs.readdirSync(path.join(ASSETS_DIR, 'enemies'))
        .filter(f => f.endsWith('.mgo'))
        .slice(0, 20);
    
    enemyFiles.forEach((file, i) => {
        const inputFile = path.join(ASSETS_DIR, 'enemies', file);
        const outputFile = path.join(outputEnemyDir, `enemy${i}.png`);
        
        console.log(`  ${i+1}/20: Converting ${file}...`);
        
        // Step 1: Decompress YJ1
        const tempFile = `/tmp/mgo_${i}_dec.tmp`;
        if (!runPython('deyj1.py', `"${inputFile}" -o "${tempFile}"`)) {
            console.log(`    ✗ Failed to decompress`);
            return;
        }
        
        // Step 2: Convert to PNG
        const success = runPython('derle.py', `"${tempFile}" -o "${outputFile}" -p "${PAL_DIR}/PAT.MKF"`);
        
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch(e) {}
        
        if (success) {
            console.log(`    ✓ Saved: enemy${i}.png`);
        } else {
            console.log(`    ✗ Failed to convert`);
        }
    });
}

// Run conversions
console.log('🎮 PAL1 Asset Converter (Proper Version)');
console.log('========================================');

convertBattleBackgrounds();
convertSprites();
convertEnemies();

console.log('\n✅ Conversion complete!');
console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
