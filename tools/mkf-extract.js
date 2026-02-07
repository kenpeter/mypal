#!/usr/bin/env node
/**
 * MKF Extractor - JavaScript version
 * Extracts files from PAL1 MKF archives
 */

const fs = require('fs');
const path = require('path');

function extractMKF(inputFile, outputPrefix, postfix) {
    const content = fs.readFileSync(inputFile);
    
    // Read first 4 bytes to get number of entries
    const firstIndex = content.readUInt32LE(0);
    const subfiles = Math.floor(firstIndex / 4) - 1;
    
    console.log(`Extracting ${subfiles} files from ${path.basename(inputFile)}...`);
    
    // outputPrefix includes the full path and base name
    const outputDir = path.dirname(outputPrefix);
    const baseName = path.basename(outputPrefix);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (let i = 0; i < subfiles; i++) {
        const begin = content.readUInt32LE(i * 4);
        const end = content.readUInt32LE((i + 1) * 4);
        
        if (begin === 0 || begin >= content.length) continue;
        if (begin === end) continue; // Empty entry
        
        const fileData = content.slice(begin, end);
        const outputFile = path.join(outputDir, `${baseName}${i}.${postfix}`);
        
        fs.writeFileSync(outputFile, fileData);
        console.log(`  Extracted: ${baseName}${i}.${postfix} (${fileData.length} bytes)`);
    }
    
    console.log(`  Done! Extracted to: ${outputDir}`);
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log('Usage: node mkf-extract.js <input.mkf> <prefix> <postfix>');
        console.log('Example: node mkf-extract.js FBP.MKF fbp fbp');
        process.exit(1);
    }
    
    extractMKF(args[0], args[1], args[2]);
}

module.exports = { extractMKF };
