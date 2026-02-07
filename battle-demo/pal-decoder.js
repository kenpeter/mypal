/**
 * YJ1 Decompressor - JavaScript implementation
 * YJ1 is a compression format used in PAL1 DOS version
 */

function decompressYJ1(data) {
    const input = new Uint8Array(data);
    const output = [];
    let pos = 0;
    
    // Read header
    const signature = String.fromCharCode(...input.slice(0, 4));
    if (signature !== 'YJ_1') {
        throw new Error('Invalid YJ1 signature');
    }
    
    pos = 4;
    
    // Read uncompressed length (4 bytes, little-endian)
    const uncompressedLen = input[pos] | (input[pos + 1] << 8) | 
                           (input[pos + 2] << 16) | (input[pos + 3] << 24);
    pos += 4;
    
    // Skip compressed length (4 bytes)
    pos += 4;
    
    // Read number of blocks
    const blockCount = input[pos] | (input[pos + 1] << 8) | 
                      (input[pos + 2] << 16) | (input[pos + 3] << 24);
    pos += 4;
    
    // Skip unknown field (4 bytes)
    pos += 4;
    
    // Read block offsets
    const blockOffsets = [];
    for (let i = 0; i < blockCount; i++) {
        const offset = input[pos] | (input[pos + 1] << 8) | 
                      (input[pos + 2] << 16) | (input[pos + 3] << 24);
        blockOffsets.push(offset);
        pos += 4;
    }
    
    // Decompress each block
    let outputPos = 0;
    for (let i = 0; i < blockCount; i++) {
        const blockStart = blockOffsets[i];
        const blockEnd = (i < blockCount - 1) ? blockOffsets[i + 1] : input.length;
        
        // Simple RLE decompression for YJ1
        let blockPos = blockStart;
        while (blockPos < blockEnd && outputPos < uncompressedLen) {
            const byte = input[blockPos++];
            
            if (byte & 0x80) {
                // Repeat
                const count = (byte & 0x7F) + 3;
                const value = input[blockPos++];
                for (let j = 0; j < count && outputPos < uncompressedLen; j++) {
                    output.push(value);
                    outputPos++;
                }
            } else if (byte & 0x40) {
                // Copy from output
                const count = (byte & 0x3F) + 3;
                const offset = input[blockPos] | (input[blockPos + 1] << 8);
                blockPos += 2;
                const srcPos = outputPos - offset;
                for (let j = 0; j < count && outputPos < uncompressedLen; j++) {
                    output.push(output[srcPos + j] || 0);
                    outputPos++;
                }
            } else {
                // Literal bytes
                const count = byte + 1;
                for (let j = 0; j < count && outputPos < uncompressedLen; j++) {
                    output.push(input[blockPos++]);
                    outputPos++;
                }
            }
        }
    }
    
    return new Uint8Array(output);
}

/**
 * Convert RLE data to RGBA with palette
 */
function rleToRGBA(rleData, palette, width, height) {
    const rgba = new Uint8Array(width * height * 4);
    let pos = 0;
    
    for (let i = 0; i < rleData.length && pos < rgba.length; i++) {
        const byte = rleData[i];
        
        if (byte & 0x80) {
            // Run of same color
            const count = (byte & 0x7F) + 1;
            const colorIdx = rleData[++i];
            const r = palette[colorIdx * 3];
            const g = palette[colorIdx * 3 + 1];
            const b = palette[colorIdx * 3 + 2];
            
            for (let j = 0; j < count && pos < rgba.length; j++) {
                rgba[pos++] = r;
                rgba[pos++] = g;
                rgba[pos++] = b;
                rgba[pos++] = 255; // Alpha
            }
        } else {
            // Single pixel
            const count = byte + 1;
            for (let j = 0; j < count && pos < rgba.length; j++) {
                const colorIdx = rleData[++i];
                rgba[pos++] = palette[colorIdx * 3];
                rgba[pos++] = palette[colorIdx * 3 + 1];
                rgba[pos++] = palette[colorIdx * 3 + 2];
                rgba[pos++] = 255;
            }
        }
    }
    
    return rgba;
}

/**
 * Load palette from PAT file
 */
function loadPalette(patData, paletteIndex = 0) {
    const data = new Uint8Array(patData);
    const paletteSize = 768; // 256 colors * 3 bytes
    const offset = paletteIndex * paletteSize;
    
    const palette = new Uint8Array(768);
    for (let i = 0; i < 768; i++) {
        // Convert 6-bit to 8-bit color
        const val = data[offset + i] || 0;
        palette[i] = (val << 2) | (val >> 4);
    }
    
    return palette;
}

/**
 * Convert RGBA data to PNG (simplified - creates BMP instead for compatibility)
 */
function rgbaToBMP(rgba, width, height) {
    const rowSize = Math.ceil((width * 3) / 4) * 4;
    const pixelDataSize = rowSize * height;
    const headerSize = 54;
    const fileSize = headerSize + pixelDataSize;
    
    const buffer = new Uint8Array(fileSize);
    let pos = 0;
    
    // BMP Header
    buffer[pos++] = 0x42; // 'B'
    buffer[pos++] = 0x4D; // 'M'
    
    // File size
    buffer[pos++] = fileSize & 0xFF;
    buffer[pos++] = (fileSize >> 8) & 0xFF;
    buffer[pos++] = (fileSize >> 16) & 0xFF;
    buffer[pos++] = (fileSize >> 24) & 0xFF;
    
    // Reserved
    pos += 4;
    
    // Data offset
    buffer[pos++] = headerSize & 0xFF;
    buffer[pos++] = (headerSize >> 8) & 0xFF;
    buffer[pos++] = (headerSize >> 16) & 0xFF;
    buffer[pos++] = (headerSize >> 24) & 0xFF;
    
    // DIB Header size
    buffer[pos++] = 40;
    buffer[pos++] = 0;
    buffer[pos++] = 0;
    buffer[pos++] = 0;
    
    // Width
    buffer[pos++] = width & 0xFF;
    buffer[pos++] = (width >> 8) & 0xFF;
    buffer[pos++] = (width >> 16) & 0xFF;
    buffer[pos++] = (width >> 24) & 0xFF;
    
    // Height
    buffer[pos++] = height & 0xFF;
    buffer[pos++] = (height >> 8) & 0xFF;
    buffer[pos++] = (height >> 16) & 0xFF;
    buffer[pos++] = (height >> 24) & 0xFF;
    
    // Planes
    buffer[pos++] = 1;
    buffer[pos++] = 0;
    
    // Bits per pixel
    buffer[pos++] = 24;
    buffer[pos++] = 0;
    
    // Compression (none)
    pos += 4;
    
    // Image size
    buffer[pos++] = pixelDataSize & 0xFF;
    buffer[pos++] = (pixelDataSize >> 8) & 0xFF;
    buffer[pos++] = (pixelDataSize >> 16) & 0xFF;
    buffer[pos++] = (pixelDataSize >> 24) & 0xFF;
    
    // Pixels per meter (X, Y)
    pos += 8;
    
    // Colors in palette
    pos += 4;
    
    // Important colors
    pos += 4;
    
    // Pixel data (BGR, bottom-up)
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            buffer[pos++] = rgba[srcIdx + 2]; // B
            buffer[pos++] = rgba[srcIdx + 1]; // G
            buffer[pos++] = rgba[srcIdx];     // R
        }
        // Pad row
        const padding = rowSize - (width * 3);
        for (let p = 0; p < padding; p++) {
            buffer[pos++] = 0;
        }
    }
    
    return buffer;
}

/**
 * Convert buffer to base64 data URL
 */
function bufferToDataURL(buffer, mimeType) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        decompressYJ1,
        rleToRGBA,
        loadPalette,
        rgbaToBMP,
        bufferToDataURL
    };
}
