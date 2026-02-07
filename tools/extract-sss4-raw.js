#!/usr/bin/env node
/**
 * Extract SSS4 Raw Sequential Sprites
 * SSS4.sss contains 55 sprites stored as raw pixel data (no RLE, no headers)
 * Each sprite is 64x96 pixels = 6144 bytes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = '/Users/kenpeter/Documents/work/mypal/assets/sprites';
const OUTPUT_DIR = '/Users/kenpeter/Documents/work/mypal/battle-demo/images/sprites';
const TOOLS_DIR = '/Users/kenpeter/Documents/work/mypal/palresearch/PackageUtils';
const PAL_FILE = '/Users/kenpeter/Downloads/PAL/PAT.MKF';

const SPRITE_WIDTH = 64;
const SPRITE_HEIGHT = 96;
const SPRITE_SIZE = SPRITE_WIDTH * SPRITE_HEIGHT; // 6144 bytes per sprite

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert raw sprite data to PNG using Python + PIL
 */
function convertRawSprite(rawData, outputPath, width, height) {
    const tempRaw = `/tmp/sprite_raw_${Date.now()}.bin`;
    const pythonScript = `/tmp/convert_sprite_${Date.now()}.py`;

    try {
        // Write raw pixel data
        fs.writeFileSync(tempRaw, rawData);

        // Create Python script to convert raw data to PNG
        const script = `#!/usr/bin/env python3
import struct
from PIL import Image
import sys

# Load palette
with open("${PAL_FILE}", "rb") as f:
    pat_data = f.read()
    # Skip MKF header and get first palette (each palette is 768 bytes = 256 colors * 3 RGB)
    palette_offset = 8  # Skip MKF header
    palette_data = pat_data[palette_offset:palette_offset + 768]

    # Convert to PIL palette format (already in RGB order)
    palette = []
    for i in range(0, 768, 3):
        r = palette_data[i] * 4    # VGA palette uses 0-63, convert to 0-252
        g = palette_data[i+1] * 4
        b = palette_data[i+2] * 4
        palette.extend([r, g, b])

# Load raw sprite data
with open("${tempRaw}", "rb") as f:
    raw_data = f.read()

# Create image
width = ${width}
height = ${height}
expected_size = width * height

if len(raw_data) < expected_size:
    print(f"Error: Not enough data. Got {len(raw_data)}, need {expected_size}", file=sys.stderr)
    sys.exit(1)

# Take only what we need
sprite_data = raw_data[:expected_size]

# PAL1 sprites are stored in COLUMN-MAJOR order (read down columns, not across rows)
# We need to transpose the data
import array
pixels = array.array('B', sprite_data)
transposed = array.array('B', [0] * expected_size)

# Transpose: read column-by-column, write row-by-row
for y in range(height):
    for x in range(width):
        # Original: data stored as columns (x changes faster)
        src_index = y + (x * height)
        # Target: normal row-major (y changes faster)
        dst_index = x + (y * width)
        transposed[dst_index] = pixels[src_index]

# Create palette image with transposed data
im = Image.frombytes("P", (width, height), transposed.tobytes())
im.putpalette(palette)

# Save with transparency (index 0 is typically transparent)
im.info['transparency'] = 0
im.save("${outputPath}")
print(f"✓ Saved {width}x{height} sprite")
`;

        fs.writeFileSync(pythonScript, script);

        // Run Python script
        execSync(`python3 "${pythonScript}"`, {
            stdio: 'pipe',
            timeout: 10000
        });

        // Check if output exists and has reasonable size
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            if (stats.size > 500) {
                return true;
            }
        }

    } catch (e) {
        console.error(`  ✗ Conversion failed: ${e.message}`);
        return false;
    } finally {
        try { fs.unlinkSync(tempRaw); } catch(e) {}
        try { fs.unlinkSync(pythonScript); } catch(e) {}
    }

    return false;
}

/**
 * Extract all sprites from SSS4
 */
function extractSSS4() {
    console.log('🎭 Extracting SSS4 Sequential Sprites\n');

    const inputFile = path.join(ASSETS_DIR, 'sss4.sss');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: ${inputFile} not found`);
        return;
    }

    const data = fs.readFileSync(inputFile);
    console.log(`📦 File size: ${data.length} bytes (${Math.round(data.length/1024)}KB)`);

    const spriteCount = Math.floor(data.length / SPRITE_SIZE);
    console.log(`🎨 Expected sprites: ${spriteCount} (at ${SPRITE_WIDTH}x${SPRITE_HEIGHT})\n`);

    let successCount = 0;

    for (let i = 0; i < spriteCount; i++) {
        const offset = i * SPRITE_SIZE;
        const spriteData = data.slice(offset, offset + SPRITE_SIZE);

        // Skip if all zeros (empty sprite)
        const hasData = spriteData.some(byte => byte !== 0);
        if (!hasData) {
            console.log(`  [${String(i).padStart(2, '0')}] Empty sprite, skipping`);
            continue;
        }

        const outputFile = path.join(OUTPUT_DIR, `char_${String(i).padStart(2, '0')}.png`);

        process.stdout.write(`  [${String(i).padStart(2, '0')}] Extracting... `);

        if (convertRawSprite(spriteData, outputFile, SPRITE_WIDTH, SPRITE_HEIGHT)) {
            const stats = fs.statSync(outputFile);
            console.log(`${Math.round(stats.size/1024)}KB`);
            successCount++;
        } else {
            console.log('FAILED');
        }
    }

    console.log(`\n✅ Extracted ${successCount}/${spriteCount} sprites`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);

    // Select best 3 as hero sprites
    console.log('\n🦸 Selecting hero sprites...');
    const heroes = [
        { from: 'char_00.png', to: 'xiaoyao.png', name: 'Li Xiaoyao' },
        { from: 'char_01.png', to: 'linger.png', name: 'Zhao Linger' },
        { from: 'char_02.png', to: 'yueru.png', name: 'Lin Yueru' },
    ];

    heroes.forEach(hero => {
        const src = path.join(OUTPUT_DIR, hero.from);
        const dst = path.join(OUTPUT_DIR, hero.to);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dst);
            console.log(`  ✓ ${hero.name}: ${hero.to}`);
        }
    });
}

// Run extraction
extractSSS4();

console.log('\n✨ Done!');
