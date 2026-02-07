#!/usr/bin/env node
/**
 * Extract PAL1 Enemy Sprites from MGO.MKF
 *
 * MGO.MKF contains enemy battle sprites
 * Format: MKF → YJ1 compressed → sMKF → RLE frames → PNG
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PAL_DIR = '/Users/kenpeter/Downloads/PAL';
const MGO_FILE = path.join(PAL_DIR, 'MGO.MKF');
const PAL_FILE = path.join(PAL_DIR, 'PAT.MKF');
const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images/enemies';
const TEMP_DIR = '/tmp/mgo_extract';

// Create directories
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (fs.existsSync(TEMP_DIR)) {
    execSync(`rm -rf "${TEMP_DIR}"`);
}
fs.mkdirSync(TEMP_DIR);

console.log('👹 PAL1 Enemy Sprite Extractor');
console.log('==============================\n');

// Step 1: Extract MGO.MKF
console.log('📦 Step 1: Extracting MGO.MKF...');
execSync(`cd "${TEMP_DIR}" && python3 "${TOOLS_DIR}/demkf.py" "${MGO_FILE}" -p mgo`, {
    stdio: 'pipe'
});

const mgoFiles = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.mgo'));
console.log(`   Found ${mgoFiles.length} MGO files\n`);

// Step 2: Process each MGO file
console.log('👾 Step 2: Extracting enemy sprites...\n');

let totalSprites = 0;

mgoFiles.forEach((mgoFile, idx) => {
    const mgoPath = path.join(TEMP_DIR, mgoFile);
    const mgoNum = mgoFile.match(/MGO(\d+)/)[1];

    // Skip empty files
    const stats = fs.statSync(mgoPath);
    if (stats.size < 200) {
        return; // Skip silently
    }

    try {
        // Check if YJ1 compressed
        const header = fs.readFileSync(mgoPath).slice(0, 4).toString('ascii');

        if (header === 'YJ_1') {
            // Decompress YJ1
            const decFile = path.join(TEMP_DIR, `MGO${mgoNum}_dec.tmp`);
            execSync(
                `cd "${TOOLS_DIR}" && python3 deyj1.py "${mgoPath}" -o "${decFile}"`,
                { stdio: 'pipe' }
            );

            // Extract sMKF frames
            const frameDir = path.join(TEMP_DIR, `mgo${mgoNum}_frames`);
            fs.mkdirSync(frameDir);

            execSync(
                `cd "${frameDir}" && python3 "${TOOLS_DIR}/desmkf.py" "${decFile}" -p rle`,
                { stdio: 'pipe' }
            );

            // Get RLE files
            const rleFiles = fs.readdirSync(frameDir).filter(f => f.endsWith('.rle'));

            if (rleFiles.length === 0) {
                return;
            }

            // Convert first frame only (standing pose)
            const firstRle = rleFiles[0];
            const rlePath = path.join(frameDir, firstRle);
            const outputFile = path.join(OUTPUT_DIR, `enemy${mgoNum}.png`);

            try {
                execSync(
                    `cd "${TOOLS_DIR}" && python3 derle.py "${rlePath}" -o "${outputFile}" -p "${PAL_FILE}"`,
                    { stdio: 'pipe', timeout: 5000 }
                );

                // Check if valid
                const outStats = fs.statSync(outputFile);
                if (outStats.size > 200) {
                    totalSprites++;
                    console.log(`  [${String(idx).padStart(3)}] MGO${mgoNum.padEnd(3)} ✓ Extracted (${Math.round(outStats.size/1024)}KB)`);
                }
            } catch (e) {
                // Conversion failed, skip
            }
        }

    } catch (e) {
        // Skip errors silently
    }
});

console.log(`\n✅ Extraction complete!`);
console.log(`📁 Total enemy sprites: ${totalSprites}`);
console.log(`📁 Output: ${OUTPUT_DIR}`);

// Cleanup
console.log('\n🧹 Cleaning up temp files...');
execSync(`rm -rf "${TEMP_DIR}"`);

console.log('\n✨ Done! Check the enemies directory for enemy*.png files');
