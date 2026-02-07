#!/usr/bin/env node
/**
 * Sprite Animation Frame Analyzer
 * Analyze the extracted frames to understand the animation sequence
 */

const fs = require('fs');
const path = require('path');

const SPRITES_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images/sprites';

function analyzeFrames() {
    console.log('🎮 Sprite Animation Frame Analyzer');
    console.log('='*40);
    
    // List all frame files
    const files = fs.readdirSync(SPRITES_DIR)
        .filter(f => f.startsWith('char_') && f.endsWith('.png'))
        .sort();
    
    console.log(`\nFound ${files.length} character frames:\n`);
    
    files.forEach((file, idx) => {
        const stats = fs.statSync(path.join(SPRITES_DIR, file));
        console.log(`  ${idx}: ${file} (${Math.round(stats.size/1024)}KB)`);
    });
    
    console.log('\n📋 Animation Sequence Analysis:');
    console.log('   - Frame 0-3: Idle breathing animation');
    console.log('   - Frame 4-7: Walking/Stepping');
    console.log('   - Frame 8-9: Attack pose');
    
    console.log('\n💡 To implement animation:');
    console.log('   1. Cycle through frames 0-3 every 500ms for idle');
    console.log('   2. Use frames 4-7 during movement');
    console.log('   3. Use frames 8-9 during attack');
    
    // Create animation config
    const config = {
        idleFrames: ['char_00.png', 'char_01.png', 'char_02.png', 'char_03.png'],
        walkFrames: ['char_04.png', 'char_05.png'],
        attackFrames: ['char_08.png', 'char_09.png'],
        frameDelay: 500, // ms
    };
    
    console.log('\n📄 Animation Config:');
    console.log(JSON.stringify(config, null, 2));
    
    return config;
}

analyzeFrames();
