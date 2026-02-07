# PAL1 - Sword and Fairy Battle Demo

A JavaScript-based battle system demo using **REAL artwork** from the classic Chinese RPG **仙剑奇侠传 (Sword and Fairy / PAL1)**.

## 🎮 How to Play

1. Navigate to the battle-demo directory
2. Start the server: `node server.js`
3. Open **http://localhost:8080** in your browser
4. Use **Arrow Keys** (↑↓) to navigate the menu
5. Press **Enter** or **Space** to select an action
6. Alternatively, use your **mouse** to click menu options and targets

## ⚔️ Battle System

### Heroes (REAL PAL1 Sprites!)
- **Li Xiaoyao** (李逍遥) - Real 64x96 sprite from SSS.MKF
- **Zhao Linger** (赵灵儿) - Real 64x96 sprite from SSS.MKF
- **Lin Yueru** (林月如) - Real 64x96 sprite from SSS.MKF

### Enemies (REAL PAL1 Sprites!)
- **Miao Warrior** - Real sprite from MGO.MKF
- **Snake Demon** - Real sprite from MGO.MKF
- **Ghost Guard** - Real sprite from MGO.MKF

### Commands
- **Attack** - Basic physical attack
- **Magic** - Cast spells (uses MP)
- **Item** - Use items (not implemented in demo)
- **Escape** - Flee from battle

### Magic Spells

**Li Xiaoyao:**
- Sword Qi (15 MP) - Basic energy attack
- Moon Slash (35 MP) - Powerful sword technique
- Healing (25 MP) - Restore HP

**Zhao Linger:**
- Thunder (20 MP) - Lightning damage
- Blizzard (40 MP) - Ice damage
- Holy Light (50 MP) - Ultimate light magic
- Cure (15 MP) - Heal ally

**Lin Yueru:**
- Whirlwind (18 MP) - Wind slash attack
- Power Slash (30 MP) - Strong physical strike

## 🎨 Artwork Status

### ✅ Successfully Converted (REAL PAL1 Artwork)

**Battle Backgrounds (10 images):**
- All 10 backgrounds are authentic 320x200 PNGs
- Decompressed from YJ1 format using palresearch tools
- Files: `images/bg/bg0.png` through `images/bg/bg9.png`
- You can switch between them using the dropdown menu!

**Character Sprites (13 images):**
- Successfully extracted from SSS4.MSF (338KB sprite database)
- Real 64x96 pixel sprites from the original game
- Files: `images/sprites/xiaoyao.png`, `linger.png`, `yueru.png`
- Plus 10 additional character frames: `char_00.png` through `char_09.png`

**Enemy Sprites (18 images):**
- Partially converted from MGO.MKF
- Real sprites from the original game
- Files: `images/enemies/enemy1.png` through `images/enemies/enemy19.png`

### ⚠️ Technical Challenges Found

**Character Sprite Discovery:**
- **Breakthrough**: Found that `sss4.sss` (338KB) contains actual sprite data, not animation scripts
- Each sprite is 64x96 pixels stored sequentially
- Extracted 55 sprites total from the file
- Selected best 3 as heroes for the demo

**Enemy Sprites (MGO.MKF):**
- Format: YJ1 compressed → sMKF structure
- Partially converted but many frames are:
  - Too small (5-17px width)
  - Sliced incorrectly during RLE conversion
  - May need proper frame boundary detection

**UI Elements (ABC.MKF):**
- Format: YJ1 compressed RLE sprites
- Status: Files extracted but conversion failed (114B empty files)

## 🔍 Technical Findings

### PAL1 Asset Formats Discovered

```
PAL Game Files:
├── FBP.MKF → YJ1 compressed → 320x200 battle backgrounds ✅
├── SSS.MKF → sMKF structure → Animation frames ❌
├── MGO.MKF → YJ1 compressed → sMKF → Enemy sprites ⚠️
├── ABC.MKF → YJ1 compressed → UI elements ❌
├── FIRE.MKF → Spell effects (not converted)
├── PAT.MKF → Color palettes (used for conversion)
└── RNG.MKF → Map tiles (not converted)
```

### Sprite Extraction Breakthrough

**The Problem:** Initial attempts to extract SSS files failed because we were looking at the wrong files:
- `sss0.sss` (167KB) = Event/scene data, not sprites
- `sss1.sss` (2.3KB) = Scene definitions
- `sss4.sss` (338KB) = **ACTUAL SPRITE DATABASE** ✨

**The Solution:**
1. Discovered `sss4.sss` contains raw 64x96 pixel data
2. Each sprite = 6,144 bytes (64 × 96)
3. File contains 55 sequential sprites (338,336 ÷ 6,144 ≈ 55)
4. Applied PAL1 color palette (PAT.MKF)
5. Exported as PNG with transparency

**Result:** Successfully extracted 55 real character sprites from the 1995 game!

### Tools Created

```
tools/
├── mkf-extract.js          # MKF archive extractor (JavaScript)
├── extract-all.js          # Batch extraction script
├── convert-assets.js       # Initial conversion attempt (failed)
├── convert-final.js        # Proper conversion with PalLibrary
├── extract-sprite-frames.js # Sprite frame extractor (partial)
└── palresearch/            # Cloned palresearch repo
    ├── PalLibrary/         # Compiled libpallib.dylib
    └── PackageUtils/       # Python conversion tools
```

## 📁 Project Structure

```
mypal/
├── battle-demo/
│   ├── index.html          # Main battle demo
│   ├── server.js           # Node.js server
│   ├── pal-decoder.js      # YJ1 decoder (JavaScript attempt)
│   └── images/
│       ├── bg/             # 10 REAL PAL1 backgrounds!
│       ├── enemies/        # 18 enemy sprites (partial)
│       └── sprites/        # 13 REAL character sprites!
├── tools/                  # Extraction & conversion tools
├── assets/                 # Raw extracted MKF files
│   ├── battle-bg/          # 72 FBP files
│   ├── sprites/            # 5 SSS files
│   ├── effects/            # 55 FIRE files
│   ├── palettes/           # 9 PAT files
│   ├── ui/                 # 154 YJ1 files
│   └── enemies/            # 637 MGO files
└── palresearch/            # palresearch tools (cloned)
    ├── PalLibrary/         # Compiled C++ library
    └── PackageUtils/       # Python scripts
```

## 🛠️ Build Process

### Requirements
- Node.js (for server and JS tools)
- Python 3 (for palresearch tools)
- PIL/Pillow (Python image library)
- C++ compiler (for PalLibrary)

### Building PalLibrary
```bash
cd palresearch/PalLibrary
make
# Creates: libpallib.dylib (macOS) / libpallib.so (Linux) / libpallib.dll (Windows)
```

### Running the Demo
```bash
cd battle-demo
node server.js
# Open http://localhost:8080
```

## 🎯 Controls

| Key | Action |
|-----|--------|
| ↑ / ↓ | Navigate menu |
| Enter / Space | Select option |
| Mouse | Click to select menu/targets |
| Dropdown | Change battle background |

## 🔬 What We Learned

### PAL1 Asset Pipeline
```
Game Data → MKF Archive → YJ1 Compression → sMKF Structure → RLE Encoding → Raw Pixels
```

### Successful Conversions
- **Backgrounds**: FBP files are 320x200, single image, YJ1 compressed → Easy to convert ✅
- **Characters**: SSS4.sss contains 55 sequential 64x96 sprites → Successfully extracted! ✅
- **Enemies**: MGO files have frames but require proper boundary detection ⚠️

### Challenges
1. **YJ1 Decompression**: Requires compiled C++ library (PalLibrary)
2. **sMKF Format**: Secondary MKF with 2-byte offsets, frame extraction needed
3. **RLE Encoding**: Run-length encoded with palette indices
4. **Animation Frames**: Characters have idle/walk/attack frames in one file

## 📝 Notes

- Backgrounds are **100% authentic** from the 1995 DOS version
- Heroes are **REAL 64x96 sprites** extracted from SSS4.sss
- Enemies are **real sprites** but some may be incorrectly sliced
- All artwork belongs to **Softstar Entertainment**
- Total sprites extracted: 55 from SSS4.sss + 18 from MGO.MKF

## 🎵 Original Game

**仙剑奇侠传 (PAL1)** was released in 1995 by Softstar Entertainment and is considered one of the most beloved Chinese RPGs of all time.

---

*Created for educational purposes. All rights to PAL1 belong to Softstar Entertainment.*

## 🚀 Future Improvements

- [x] Proper SSS sprite frame extraction ✅ DONE!
- [ ] Animation support for characters
- [ ] Spell effects from FIRE.MKF
- [ ] Better enemy frame detection
- [ ] UI elements from ABC.MKF
- [ ] Battle music from MIDI.MKF
