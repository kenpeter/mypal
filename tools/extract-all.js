#!/usr/bin/env node
/**
 * Asset Extractor - Extracts all PAL1 assets for battle demo
 */

const fs = require('fs');
const path = require('path');
const { extractMKF } = require('./mkf-extract');

const PAL_DIR = '/Users/kenpeter/Downloads/PAL';
const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function extractAssets() {
    console.log('=== PAL1 Asset Extractor ===\n');
    
    ensureDir(ASSETS_DIR);
    
    // Extract battle backgrounds (FBP.MKF)
    console.log('1. Extracting battle backgrounds (FBP.MKF)...');
    const fbpDir = path.join(ASSETS_DIR, 'battle-bg');
    ensureDir(fbpDir);
    try {
        extractMKF(path.join(PAL_DIR, 'FBP.MKF'), path.join(fbpDir, 'fbp'), 'fbp');
    } catch(e) {
        console.log('   FBP.MKF not found or error:', e.message);
    }
    
    // Extract sprites (SSS.MKF)
    console.log('\n2. Extracting character sprites (SSS.MKF)...');
    const sssDir = path.join(ASSETS_DIR, 'sprites');
    ensureDir(sssDir);
    try {
        extractMKF(path.join(PAL_DIR, 'SSS.MKF'), path.join(sssDir, 'sss'), 'sss');
    } catch(e) {
        console.log('   SSS.MKF not found or error:', e.message);
    }
    
    // Extract spell effects (FIRE.MKF)
    console.log('\n3. Extracting spell effects (FIRE.MKF)...');
    const fireDir = path.join(ASSETS_DIR, 'effects');
    ensureDir(fireDir);
    try {
        extractMKF(path.join(PAL_DIR, 'FIRE.MKF'), path.join(fireDir, 'fire'), 'fire');
    } catch(e) {
        console.log('   FIRE.MKF not found or error:', e.message);
    }
    
    // Extract palettes (PAT.MKF)
    console.log('\n4. Extracting palettes (PAT.MKF)...');
    const patDir = path.join(ASSETS_DIR, 'palettes');
    ensureDir(patDir);
    try {
        extractMKF(path.join(PAL_DIR, 'PAT.MKF'), path.join(patDir, 'pat'), 'pat');
    } catch(e) {
        console.log('   PAT.MKF not found or error:', e.message);
    }
    
    // Extract UI/graphics (ABC.MKF)
    console.log('\n5. Extracting UI graphics (ABC.MKF)...');
    const abcDir = path.join(ASSETS_DIR, 'ui');
    ensureDir(abcDir);
    try {
        extractMKF(path.join(PAL_DIR, 'ABC.MKF'), path.join(abcDir, 'abc'), 'yj1');
    } catch(e) {
        console.log('   ABC.MKF not found or error:', e.message);
    }
    
    // Extract enemy graphics (MGO.MKF)
    console.log('\n6. Extracting enemy graphics (MGO.MKF)...');
    const mgoDir = path.join(ASSETS_DIR, 'enemies');
    ensureDir(mgoDir);
    try {
        extractMKF(path.join(PAL_DIR, 'MGO.MKF'), path.join(mgoDir, 'mgo'), 'mgo');
    } catch(e) {
        console.log('   MGO.MKF not found or error:', e.message);
    }
    
    console.log('\n=== Extraction Complete ===');
    console.log(`Assets saved to: ${ASSETS_DIR}`);
}

extractAssets();
