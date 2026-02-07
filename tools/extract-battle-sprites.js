#!/usr/bin/env node
/**
 * Extract PAL1 Full-Body Battle Sprites from F.MKF
 *
 * F.MKF contains the actual in-game battle character sprites
 * Format: MKF → YJ1 compressed → sMKF → RLE frames → PNG
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PAL_DIR = '/Users/kenpeter/Downloads/PAL';
const F_FILE = path.join(PAL_DIR, 'F.MKF');
const PAL_FILE = path.join(PAL_DIR, 'PAT.MKF');
const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images/sprites/battle';
const TEMP_DIR = '/tmp/f_extract';

// Create directories
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (fs.existsSync(TEMP_DIR)) {
    execSync(`rm -rf "${TEMP_DIR}"`);
}
fs.mkdirSync(TEMP_DIR);

console.log('⚔️  PAL1 Battle Sprite Extractor');
console.log('================================\n');

// Step 1: Extract F.MKF
console.log('📦 Step 1: Extracting F.MKF...');
execSync(`cd "${TEMP_DIR}" && python3 "${TOOLS_DIR}/demkf.py" "${F_FILE}" -p f`, {
    stdio: 'pipe'
});

const fFiles = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.f'));
console.log(`   Found ${fFiles.length} F files\n`);

// Step 2: Process each F file
console.log('🎨 Step 2: Extracting character sprites...\n');

let totalSprites = 0;

fFiles.forEach((fFile, idx) => {
    const fPath = path.join(TEMP_DIR, fFile);
    const fNum = fFile.match(/F(\d+)/)[1];

    // Skip empty files
    const stats = fs.statSync(fPath);
    if (stats.size < 500) {
        console.log(`  [${String(idx).padStart(3)}] ${fFile.padEnd(12)} - Too small, skipping`);
        return;
    }

    try {
        // Check if YJ1 compressed
        const header = fs.readFileSync(fPath).slice(0, 4).toString('ascii');

        if (header === 'YJ_1') {
            // Decompress YJ1
            const decFile = path.join(TEMP_DIR, `F${fNum}_dec.tmp`);
            execSync(
                `cd "${TOOLS_DIR}" && python3 deyj1.py "${fPath}" -o "${decFile}"`,
                { stdio: 'pipe' }
            );

            // Extract sMKF frames
            const frameDir = path.join(TEMP_DIR, `f${fNum}_frames`);
            fs.mkdirSync(frameDir);

            execSync(
                `cd "${frameDir}" && python3 "${TOOLS_DIR}/desmkf.py" "${decFile}" -p rle`,
                { stdio: 'pipe' }
            );

            // Get RLE files
            const rleFiles = fs.readdirSync(frameDir).filter(f => f.endsWith('.rle'));

            if (rleFiles.length === 0) {
                console.log(`  [${String(idx).padStart(3)}] ${fFile.padEnd(12)} - No frames extracted`);
                return;
            }

            // Convert RLE files to PNG
            let frameCount = 0;
            rleFiles.forEach(rleFile => {
                const rlePath = path.join(frameDir, rleFile);
                const frameNum = rleFile.match(/\d+/)[0];
                const outputFile = path.join(OUTPUT_DIR, `char_${fNum}_frame${frameNum}.png`);

                try {
                    execSync(
                        `cd "${TOOLS_DIR}" && python3 derle.py "${rlePath}" -o "${outputFile}" -p "${PAL_FILE}"`,
                        { stdio: 'pipe', timeout: 5000 }
                    );

                    // Check if valid
                    const outStats = fs.statSync(outputFile);
                    if (outStats.size > 200) {
                        frameCount++;
                        totalSprites++;

                        // Copy first frame as the main sprite
                        if (frameNum === '0') {
                            const mainFile = path.join(OUTPUT_DIR, `char_${fNum}.png`);
                            fs.copyFileSync(outputFile, mainFile);
                        }
                    }
                } catch (e) {
                    // Conversion failed, skip
                }
            });

            if (frameCount > 0) {
                console.log(`  [${String(idx).padStart(3)}] ${fFile.padEnd(12)} ✓ ${frameCount} frames extracted`);
            } else {
                console.log(`  [${String(idx).padStart(3)}] ${fFile.padEnd(12)} - Conversion failed`);
            }

        } else {
            console.log(`  [${String(idx).padStart(3)}] ${fFile.padEnd(12)} - Not YJ1 compressed`);
        }

    } catch (e) {
        console.log(`  [${String(idx).padStart(3)}] ${fFile.padEnd(12)} - Error: ${e.message.split('\n')[0]}`);
    }
});

console.log(`\n✅ Extraction complete!`);
console.log(`📁 Total sprite frames: ${totalSprites}`);
console.log(`📁 Output: ${OUTPUT_DIR}`);

// Cleanup
console.log('\n🧹 Cleaning up temp files...');
execSync(`rm -rf "${TEMP_DIR}"`);

console.log('\n✨ Done! Check the battle directory for char_XX.png files');
