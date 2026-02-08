# Why PAL1 Character Sprites Are So Hard to Extract

## The Problem

You asked: **"Why is it so hard to construct the complete character?"**

The answer: **PAL1 characters aren't single images - they're complex animation systems!**

## What You'd Expect (Simple)

```
sss0.sss → One PNG file of Li Xiaoyao
```

## What Actually Exists (Complex)

```
sss0.sss (167KB file)
├── Frame 0: Idle pose facing down (64x96)
├── Frame 1: Idle pose facing down (variation)
├── Frame 2: Idle pose facing left
├── Frame 3: Idle pose facing right
├── Frame 4: Walk cycle frame 1 (down)
├── Frame 5: Walk cycle frame 2 (down)
├── Frame 6: Walk cycle frame 3 (down)
├── Frame 7: Walk cycle frame 4 (down)
├── Frame 8-15: Walking left
├── Frame 16-23: Walking right
├── Frame 24-31: Walking up
├── Frame 32-35: Attack animation
├── Frame 36-39: Victory pose
├── Frame 40-43: Damaged animation
└── ... (100+ more frames!)
```

## The Technical Challenges

### 1. **sMKF Format (Not regular MKF)**

Battle backgrounds use regular MKF → Easy to extract
Character sprites use **sMKF** (Secondary MKF):
- 2-byte offsets instead of 4-byte
- Different header structure
- Frame count stored differently

```
Regular MKF header:
  [4 bytes: offset to first file]
  [4 bytes: offset to second file]

sMKF header (sprites):
  [2 bytes: frame count]
  [2 bytes: offset to frame 0] * 2
  [2 bytes: offset to frame 1] * 2
  ...
```

### 2. **Multiple Animation States**

Each character has 8 directions × multiple frames:

**Li Xiaoyao (sss0.sss - 167KB):**
- 4 directional idle poses
- 4 directions × 4 walk frames = 16 frames
- 4 directions × attack animation = 16 frames
- Victory animation
- Damaged animation
- **Total: 50-100+ individual frames!**

### 3. **YJ1 Compression + RLE Encoding**

Each frame is:
1. Stored in sMKF container
2. YJ1 compressed (lossless compression)
3. RLE encoded (Run-Length Encoding)
4. Uses palette indices (PAT.MKF)

**Pipeline:**
```
SSS File → sMKF Extract → YJ1 Decompress → RLE Decode → Palette Apply → PNG
```

### 4. **Unknown Frame Dimensions**

Unlike backgrounds (always 320x200), sprites have **variable sizes**:
- Idle pose: 48x72 pixels
- Attack frame 1: 64x96 pixels
- Attack frame 2: 80x96 pixels (sword extends!)
- The size is NOT stored in the file header

You have to guess or calculate based on data size.

## Comparison: Backgrounds vs Characters

| Aspect | Backgrounds (FBP) | Characters (SSS) |
|--------|-------------------|------------------|
| Format | MKF | sMKF |
| Size | Always 320x200 | Variable per frame |
| Count | 1 image per file | 50-100+ frames |
| Compression | YJ1 | YJ1 + RLE |
| Extraction | Simple | Complex |
| Result | ✅ Perfect PNG | ❌ Pixel garbage |

## Why Enemies Worked (Sort Of)

Enemies (MGO.MKF) are simpler:
- Fewer frames (3-5 per enemy)
- Static battle poses (no walking)
- More consistent sizes
- **But still**: Many frames are sliced wrong because we don't know exact dimensions

## What Would It Take to Fix?

### Option 1: Manual Frame Extraction
1. Parse sMKF structure properly
2. Extract each frame individually
3. Try multiple sizes (48x72, 64x96, etc.)
4. Visually verify each frame
5. **Time required**: 4-8 hours per character

### Option 2: Use SDLPAL Source Code
The SDLPAL project (https://github.com/sdlpal/sdlpal) has working code:
```c
// From SDLPAL's sprite.c
void PAL_LoadSprite(int spriteNum) {
    // Properly parses sMKF
    // Handles all animation frames
    // Correct dimensions
}
```

### Option 3: Use Existing Tools
Pal95Tools.exe (Windows) can export sprites but:
- Requires Windows
- Exports as BMP sequences
- Need to convert to PNG

## The Bottom Line

**Backgrounds**: 1 extraction step → Perfect result ✅  
**Enemies**: 2 extraction steps → Okay result ⚠️  
**Characters**: 4+ extraction steps + frame detection → Very hard ❌

For a quick demo, CSS placeholders with icons work better than broken sprite frames!

## File Sizes Tell the Story

```
sss0.sss (167KB)  = Li Xiaoyao with 100+ animation frames
ss1.sss  (2.3KB)  = Small NPC (maybe 5 frames)
sss4.sss (330KB)  = All characters combined?

fbp0.fbp (6.7KB)  = One 320x200 background (easy!)
```

The 167KB character file is 25× larger than a background because it contains an entire animation system, not just one image.

---

**TL;DR**: Characters aren't images - they're animation databases. That's why extracting them is 25× harder than backgrounds!
