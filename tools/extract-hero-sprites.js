#!/usr/bin/env node
/**
 * Extract PAL1 Hero Battle Sprites from RGM.MKF
 *
 * RGM.MKF contains hero battle sprites
 * Format: MKF → RGM files (sMKF) → RLE frames → PNG
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PAL_DIR = '/Users/kenpeter/Downloads/PAL';
const RGM_FILE = path.join(PAL_DIR, 'RGM.MKF');
const PAL_FILE = path.join(PAL_DIR, 'PAT.MKF');
const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images/sprites';
const TEMP_DIR = '/tmp/rgm_extract';

// Create directories
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (fs.existsSync(TEMP_DIR)) {
    execSync(`rm -rf "${TEMP_DIR}"`);
}
fs.mkdirSync(TEMP_DIR);

console.log('🎭 PAL1 Hero Sprite Extractor');
console.log('=============================\n');

// Step 1: Extract RGM.MKF
console.log('📦 Step 1: Extracting RGM.MKF...');
execSync(`cd "${TEMP_DIR}" && python3 "${TOOLS_DIR}/demkf.py" "${RGM_FILE}" -p rgm`, {
    stdio: 'pipe'
});

const rgmFiles = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.rgm'));
console.log(`   Found ${rgmFiles.length} RGM files\n`);

// Step 2: Extract each RGM file (sMKF format)
console.log('🎨 Step 2: Extracting sprite frames...\n');

let totalSprites = 0;

rgmFiles.forEach((rgmFile, idx) => {
    const rgmPath = path.join(TEMP_DIR, rgmFile);
    const rgmNum = rgmFile.match(/RGM(\d+)/)[1];

    // Skip empty files
    const stats = fs.statSync(rgmPath);
    if (stats.size < 100) {
        console.log(`  [${String(idx).padStart(3)}] ${rgmFile.padEnd(15)} - Empty, skipping`);
        return;
    }

    try {
        // Extract sMKF frames
        const frameDir = path.join(TEMP_DIR, `rgm${rgmNum}_frames`);
        fs.mkdirSync(frameDir);

        execSync(
            `cd "${frameDir}" && python3 "${TOOLS_DIR}/desmkf.py" "${rgmPath}" -p rle`,
            { stdio: 'pipe' }
        );

        // Get RLE files
        const rleFiles = fs.readdirSync(frameDir).filter(f => f.endsWith('.rle'));

        if (rleFiles.length === 0) {
            console.log(`  [${String(idx).padStart(3)}] ${rgmFile.padEnd(15)} - No frames extracted`);
            return;
        }

        // Convert RLE files to PNG
        let frameCount = 0;
        rleFiles.forEach(rleFile => {
            const rlePath = path.join(frameDir, rleFile);
            const frameNum = rleFile.match(/\d+/)[0];
            const outputFile = path.join(OUTPUT_DIR, `hero_${rgmNum}_frame${frameNum}.png`);

            try {
                execSync(
                    `cd "${TOOLS_DIR}" && python3 derle.py "${rlePath}" -o "${outputFile}" -p "${PAL_FILE}"`,
                    { stdio: 'pipe', timeout: 5000 }
                );

                // Check if valid
                const outStats = fs.statSync(outputFile);
                if (outStats.size > 500) {
                    frameCount++;
                    totalSprites++;

                    // Copy first frame as the main sprite
                    if (frameNum === '0') {
                        const mainFile = path.join(OUTPUT_DIR, `hero_${rgmNum}.png`);
                        fs.copyFileSync(outputFile, mainFile);
                    }
                }
            } catch (e) {
                // Conversion failed, skip
            }
        });

        if (frameCount > 0) {
            console.log(`  [${String(idx).padStart(3)}] ${rgmFile.padEnd(15)} ✓ ${frameCount} frames extracted`);
        } else {
            console.log(`  [${String(idx).padStart(3)}] ${rgmFile.padEnd(15)} - Conversion failed`);
        }

    } catch (e) {
        console.log(`  [${String(idx).padStart(3)}] ${rgmFile.padEnd(15)} - Error: ${e.message.split('\n')[0]}`);
    }
});

console.log(`\n✅ Extraction complete!`);
console.log(`📁 Total sprites: ${totalSprites}`);
console.log(`📁 Output: ${OUTPUT_DIR}`);

// Cleanup
console.log('\n🧹 Cleaning up temp files...');
execSync(`rm -rf "${TEMP_DIR}"`);

console.log('\n✨ Done! Check the sprites directory for hero_XX.png files');
