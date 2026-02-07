#!/usr/bin/env node
/**
 * Proper PAL1 Sprite Extractor
 * Extracts complete character sprites from SSS.MKF
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';
const PAL_FILE = '/Users/kenpeter/Downloads/PAL/PAT.MKF';
const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images/sprites';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse sMKF (Secondary MKF) format
 * Uses 2-byte offsets instead of 4-byte
 */
function parseSMKF(data) {
    const frames = [];
    const frameCount = data.readUInt16LE(0);
    
    console.log(`  Found ${frameCount} frames`);
    
    for (let i = 0; i < frameCount; i++) {
        const offset = data.readUInt16LE((i + 1) * 2) * 2;
        const nextOffset = data.readUInt16LE((i + 2) * 2) * 2;
        
        if (offset > 0 && nextOffset > offset) {
            frames.push({
                index: i,
                offset: offset,
                size: nextOffset - offset,
                data: data.slice(offset, nextOffset)
            });
        }
    }
    
    return frames;
}

/**
 * Calculate best dimensions for sprite
 * PAL1 sprites are usually 48x72, 64x96, or 96x96
 */
function getBestDimensions(dataSize) {
    // Common PAL1 sprite sizes
    const sizes = [
        { w: 48, h: 72 },   // Small characters
        { w: 64, h: 96 },   // Standard characters
        { w: 96, h: 96 },   // Large characters/bosses
        { w: 64, h: 64 },   // Medium
        { w: 48, h: 96 },   // Tall
        { w: 80, h: 96 },   // Wide
    ];
    
    // Find size that matches data closest
    for (const size of sizes) {
        const expectedSize = size.w * size.h;
        // Allow some variance for RLE compression
        if (Math.abs(dataSize - expectedSize) < expectedSize * 0.3) {
            return size;
        }
    }
    
    // Default to most common
    return { w: 64, h: 96 };
}

/**
 * Convert frame to PNG
 */
function convertFrame(frameData, outputPath, width, height) {
    const tempFile = `/tmp/sprite_frame_${Date.now()}.tmp`;
    
    try {
        // Write raw frame data
        fs.writeFileSync(tempFile, frameData);
        
        // Convert using derle
        execSync(
            `cd "${TOOLS_DIR}" && python3 derle.py "${tempFile}" -o "${outputPath}" -p "${PAL_FILE}"`,
            { stdio: 'pipe', timeout: 10000 }
        );
        
        // Check if valid
        const stats = fs.statSync(outputPath);
        if (stats.size > 1000) {
            return true;
        }
    } catch (e) {
        // Failed
    } finally {
        try { fs.unlinkSync(tempFile); } catch(e) {}
    }
    
    return false;
}

/**
 * Process SSS file and extract all frames
 */
function extractSSS(filename, charName) {
    console.log(`\n🎭 Extracting ${charName}...`);
    
    const inputFile = path.join(ASSETS_DIR, 'sprites', filename);
    const data = fs.readFileSync(inputFile);
    
    // Check if YJ1 compressed
    const sig = data.slice(0, 4).toString('ascii');
    let decompressed = data;
    
    if (sig === 'YJ_1') {
        console.log('  YJ1 compressed, decompressing...');
        const tempYJ1 = `/tmp/${charName}_yj1.tmp`;
        const tempDec = `/tmp/${charName}_dec.tmp`;
        
        fs.writeFileSync(tempYJ1, data);
        
        try {
            execSync(
                `cd "${TOOLS_DIR}" && python3 deyj1.py "${tempYJ1}" -o "${tempDec}"`,
                { stdio: 'pipe' }
            );
            decompressed = fs.readFileSync(tempDec);
            console.log(`  Decompressed: ${data.length} → ${decompressed.length} bytes`);
        } catch (e) {
            console.log('  Decompression failed, using raw data');
        } finally {
            try { fs.unlinkSync(tempYJ1); } catch(e) {}
            try { fs.unlinkSync(tempDec); } catch(e) {}
        }
    }
    
    // Parse sMKF frames
    const frames = parseSMKF(decompressed);
    
    if (frames.length === 0) {
        console.log('  No frames found');
        return;
    }
    
    console.log(`  Extracting ${frames.length} frames...`);
    
    // Extract each frame with multiple size attempts
    let successCount = 0;
    
    frames.slice(0, 8).forEach((frame, idx) => {  // First 8 frames only
        const sizes = [
            { w: 48, h: 72 },
            { w: 64, h: 96 },
            { w: 96, h: 96 },
            { w: 64, h: 64 },
        ];
        
        for (const size of sizes) {
            const outputFile = path.join(OUTPUT_DIR, `${charName}_${idx}_${size.w}x${size.h}.png`);
            
            if (convertFrame(frame.data, outputFile, size.w, size.h)) {
                const stats = fs.statSync(outputFile);
                console.log(`  ✓ Frame ${idx}: ${size.w}x${size.h} (${Math.round(stats.size/1024)}KB)`);
                successCount++;
                
                // Also create a generic named copy for the best size
                if (idx === 0 && size.w === 64) {
                    const bestFile = path.join(OUTPUT_DIR, `${charName}.png`);
                    fs.copyFileSync(outputFile, bestFile);
                }
                break;
            }
        }
    });
    
    console.log(`  Success: ${successCount}/${Math.min(frames.length, 8)} frames`);
}

// Extract all characters
console.log('🎮 PAL1 Sprite Extractor');
console.log('========================\n');

const characters = [
    { file: 'sss0.sss', name: 'xiaoyao' },
    { file: 'sss1.sss', name: 'linger' },
    { file: 'sss2.sss', name: 'yueru' },
    { file: 'sss3.sss', name: 'anuanu' },
    { file: 'sss4.sss', name: 'other' }
];

characters.forEach(char => {
    extractSSS(char.file, char.name);
});

console.log('\n✅ Extraction complete!');
console.log(`📁 Check: ${OUTPUT_DIR}`);
