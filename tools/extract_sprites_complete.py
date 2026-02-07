#!/usr/bin/env python3
"""
PAL1 Sprite Extractor - Complete Implementation
Properly extracts character sprites from SSS.MKF files
"""

import os
import sys
import struct
import subprocess

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PALRESEARCH_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'palresearch')
PACKAGE_UTILS_DIR = os.path.join(PALRESEARCH_DIR, 'PackageUtils')
PAL_DIR = '/Users/kenpeter/Downloads/PAL'
ASSETS_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'assets')
OUTPUT_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'battle-demo', 'images', 'sprites')

os.makedirs(OUTPUT_DIR, exist_ok=True)

def decompress_yj1(input_file, output_file):
    """Decompress YJ1 file using PalLibrary"""
    pallib_path = os.path.join(PALRESEARCH_DIR, 'PalLibrary', 'libpallib.dylib')
    
    # Import ctypes directly
    from ctypes import cdll, POINTER, c_byte, c_int, byref, string_at
    
    dll = cdll.LoadLibrary(pallib_path)
    
    with open(input_file, 'rb') as f:
        input_data = f.read()
    
    # Create buffer and length pointers
    buffer = POINTER(c_byte)()
    length = c_int()
    
    # Call decode function
    dll.decodeyj1(input_data, byref(buffer), byref(length))
    
    # Get result
    result = string_at(buffer, length.value)
    
    with open(output_file, 'wb') as f:
        f.write(result)
    
    return True

def parse_smkf(data):
    """Parse sMKF (Secondary MKF) format"""
    frames = []
    
    if len(data) < 2:
        return frames
    
    frame_count = struct.unpack('<H', data[0:2])[0]
    
    for i in range(frame_count):
        try:
            offset = struct.unpack('<H', data[(i + 1) * 2:(i + 2) * 2])[0] * 2
            next_offset = struct.unpack('<H', data[(i + 2) * 2:(i + 3) * 2])[0] * 2
            
            if offset > 0 and next_offset > offset and next_offset <= len(data):
                frame_data = data[offset:next_offset]
                frames.append({
                    'index': i,
                    'offset': offset,
                    'size': len(frame_data),
                    'data': frame_data
                })
        except:
            break
    
    return frames

def convert_to_png(frame_data, output_path, width, height, palette_file):
    """Convert raw frame data to PNG using derle"""
    import tempfile
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.tmp') as tmp:
        tmp.write(frame_data)
        tmp_path = tmp.name
    
    try:
        # Use derle.py
        result = subprocess.run(
            ['python3', os.path.join(PACKAGE_UTILS_DIR, 'derle.py'), 
             tmp_path, '-o', output_path, '-p', palette_file],
            capture_output=True,
            timeout=10
        )
        
        success = result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 500
        
    finally:
        os.unlink(tmp_path)
    
    return success

def extract_sprite(sss_file, char_name):
    """Extract all frames from an SSS file"""
    print(f"\n🎭 Extracting {char_name}...")
    
    input_path = os.path.join(ASSETS_DIR, 'sprites', sss_file)
    
    if not os.path.exists(input_path):
        print(f"  File not found: {sss_file}")
        return
    
    # Read file
    with open(input_path, 'rb') as f:
        data = f.read()
    
    # Check if YJ1 compressed
    if data[:4] == b'YJ_1':
        print("  YJ1 compressed, decompressing...")
        dec_path = f'/tmp/{char_name}_dec.tmp'
        try:
            decompress_yj1(input_path, dec_path)
            with open(dec_path, 'rb') as f:
                data = f.read()
            print(f"  Decompressed: {len(data)} bytes")
        except Exception as e:
            print(f"  Decompression error: {e}")
            return
    
    # Parse frames
    frames = parse_smkf(data)
    print(f"  Found {len(frames)} frames")
    
    if not frames:
        return
    
    # Try to extract each frame
    sizes = [
        (48, 72),   # Small
        (64, 96),   # Standard
        (96, 96),   # Large
        (64, 64),   # Medium
    ]
    
    extracted = 0
    for frame in frames[:6]:  # First 6 frames only
        print(f"  Frame {frame['index']}: {frame['size']} bytes")
        
        for width, height in sizes:
            output_file = os.path.join(OUTPUT_DIR, f'{char_name}_frame{frame["index"]}_{width}x{height}.png')
            
            if convert_to_png(frame['data'], output_file, width, height, os.path.join(PAL_DIR, 'PAT.MKF')):
                size_kb = os.path.getsize(output_file) / 1024
                print(f"    ✓ {width}x{height} ({size_kb:.1f}KB)")
                extracted += 1
                
                # Save best frame as main sprite
                if frame['index'] == 0 and width == 64:
                    main_file = os.path.join(OUTPUT_DIR, f'{char_name}.png')
                    import shutil
                    shutil.copy(output_file, main_file)
                
                break
        else:
            print(f"    ✗ Failed all sizes")
    
    print(f"  Extracted: {extracted}/{min(len(frames), 6)} frames")

# Main
def main():
    print("🎮 PAL1 Sprite Extractor - Complete")
    print("=" * 40)
    
    characters = [
        ('sss0.sss', 'xiaoyao'),
        ('sss1.sss', 'linger'),
        ('sss2.sss', 'yueru'),
        ('sss3.sss', 'anuanu'),
    ]
    
    for sss_file, char_name in characters:
        try:
            extract_sprite(sss_file, char_name)
        except Exception as e:
            print(f"  Error: {e}")
    
    print("\n✅ Done!")
    print(f"📁 Output: {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
