#!/usr/bin/env node
/**
 * Proper PAL1 Asset Converter using palresearch tools
 * Converts FBP/SSS/MGO to proper PNG images
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAL_DIR = '/Users/kenpeter/Downloads/PAL';
const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images';
const TOOLS_DIR = '/tmp/palresearch/PackageUtils';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function runPython(tool, args) {
    const cmd = `cd ${TOOLS_DIR} && python3 ${tool} ${args}`;
    try {
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (e) {
        console.error(`Error running ${tool}:`, e.message);
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
    
    // Get first 10 FBP files
    const fbpFiles = fs.readdirSync(path.join(ASSETS_DIR, 'battle-bg'))
        .filter(f => f.endsWith('.fbp'))
        .slice(0, 10);
    
    fbpFiles.forEach((file, i) => {
        const inputFile = path.join(ASSETS_DIR, 'battle-bg', file);
        const outputFile = path.join(outputBgDir, `bg${i}.png`);
        
        console.log(`  Converting ${file}...`);
        
        // Use defbp.py to convert
        const cmd = `cd "${TOOLS_DIR}" && python3 defbp.py "${inputFile}" -p "${PAL_DIR}/PAT.MKF" -o "${outputFile}"`;
        try {
            execSync(cmd, { stdio: 'pipe' });
            console.log(`    ✓ Saved: bg${i}.png`);
        } catch (e) {
            console.log(`    ✗ Failed: ${file}`);
        }
    });
}

/**
 * Convert sprites using derle
 */
function convertSprites() {
    console.log('\n👤 Converting character sprites...');
    const outputSpriteDir = path.join(OUTPUT_DIR, 'sprites');
    if (!fs.existsSync(outputSpriteDir)) {
        fs.mkdirSync(outputSpriteDir, { recursive: true });
    }
    
    // Convert SSS files
    const sssFiles = fs.readdirSync(path.join(ASSETS_DIR, 'sprites'))
        .filter(f => f.endsWith('.sss'));
    
    sssFiles.forEach((file, i) => {
        const inputFile = path.join(ASSETS_DIR, 'sprites', file);
        const outputFile = path.join(outputSpriteDir, `sprite${i}.png`);
        
        console.log(`  Converting ${file}...`);
        
        // Use derle.py with different dimensions
        const dims = [
            { w: 64, h: 96 },
            { w: 96, h: 96 },
            { w: 48, h: 72 }
        ];
        
        let success = false;
        for (const dim of dims) {
            try {
                const cmd = `cd "${TOOLS_DIR}" && python3 derle.py "${inputFile}" -o "${outputFile}" -p "${PAL_DIR}/PAT.MKF" 2>/dev/null`;
                execSync(cmd, { stdio: 'pipe' });
                const stats = fs.statSync(outputFile);
                if (stats.size > 100) {
                    console.log(`    ✓ Saved: sprite${i}.png (${dim.w}x${dim.h})`);
                    success = true;
                    break;
                }
            } catch (e) {
                // Try next dimension
            }
        }
        
        if (!success) {
            console.log(`    ✗ Failed: ${file}`);
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
    
    // Get first 20 enemy files
    const enemyFiles = fs.readdirSync(path.join(ASSETS_DIR, 'enemies'))
        .filter(f => f.endsWith('.mgo'))
        .slice(0, 20);
    
    enemyFiles.forEach((file, i) => {
        const inputFile = path.join(ASSETS_DIR, 'enemies', file);
        const outputFile = path.join(outputEnemyDir, `enemy${i}.png`);
        
        console.log(`  Converting ${file}...`);
        
        // Try derle with different dimensions
        const dims = [
            { w: 96, h: 96 },
            { w: 128, h: 128 },
            { w: 64, h: 64 }
        ];
        
        let success = false;
        for (const dim of dims) {
            try {
                const cmd = `cd "${TOOLS_DIR}" && python3 derle.py "${inputFile}" -o "${outputFile}" -p "${PAL_DIR}/PAT.MKF" 2>/dev/null`;
                execSync(cmd, { stdio: 'pipe' });
                const stats = fs.statSync(outputFile);
                if (stats.size > 100) {
                    console.log(`    ✓ Saved: enemy${i}.png`);
                    success = true;
                    break;
                }
            } catch (e) {
                // Try next
            }
        }
        
        if (!success) {
            console.log(`    ✗ Failed: ${file}`);
        }
    });
}

// Check if PIL is installed
try {
    execSync('python3 -c "from PIL import Image"', { stdio: 'pipe' });
} catch (e) {
    console.log('Installing required Python packages...');
    execSync('pip3 install Pillow', { stdio: 'inherit' });
}

// Run conversions
console.log('🎮 PAL1 Asset Converter (Proper Version)');
console.log('========================================');

convertBattleBackgrounds();
convertSprites();
convertEnemies();

console.log('\n✅ Conversion complete!');
console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
