# PAL1 - Sword and Fairy Battle Demo

A JavaScript-based battle system demo using **REAL artwork** from the classic Chinese RPG **仙剑奇侠传 (Sword and Fairy / PAL1)**.

## 🎮 Play Online

**▶️ [Play Now on GitHub Pages](https://kenpeter.github.io/mypal/)**

Click the link above to play the demo directly in your browser - no installation required!

## 🎮 How to Play Locally

1. Clone this repository: `git clone git@github.com:kenpeter/mypal.git`
2. Navigate to the battle-demo directory: `cd mypal/battle-demo`
3. Start the server: `node server.js`
4. Open **http://localhost:8080** in your browser

## 🕹️ Controls

- Use **Arrow Keys** (↑↓) to navigate the menu
- Press **Enter** or **Space** to select an action
- Alternatively, use your **mouse** to click menu options and targets

## ⚔️ Battle System

### Heroes (REAL PAL1 Battle Sprites with Animations!)
- **Li Xiaoyao** (李逍遥) - Full-body battle sprite from F.MKF with smooth attack animation
- **Zhao Linger** (赵灵儿) - Full-body battle sprite from F.MKF with magic effects
- **Lin Yueru** (林月如) - Full-body battle sprite from F.MKF with special attacks

**Features:**
- ✨ Authentic multi-frame attack animations from original DOS game
- 🎬 Smooth frame-by-frame sprite sequences (4-5 frames per attack)
- 💥 Super attack effects with screen shake and flash
- 🔄 Standing pose → Attack sequence → Return to standing
- 📏 Sprites scaled 3x for modern displays with pixelated rendering preserved

### Boss Enemy (REAL PAL1 Sprite!)
- **Tree Demon Boss** (enemy571.png) - Massive boss sprite from MGO.MKF (320x320)
- Epic battle against authentic PAL1 boss monster!

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

**Hero Battle Sprites (F.MKF - Full Animation Sequences):**
- Successfully extracted from F.MKF (YJ1 compressed battle animations)
- 19 battle character files with 10-11 frames each (149 total frames)
- Multi-frame attack animations for Li Xiaoyao, Zhao Linger, Lin Yueru
- Standing poses + attack sequences + magic effects
- Files: `images/sprites/battle/char_X_frameY.png`

**Hero Portraits (RGM.MKF):**
- 88 character portrait busts extracted from RGM.MKF
- Used for character status and UI elements
- Files: `images/sprites/hero_XX.png`

**Enemy Sprites (263 images - MGO.MKF):**
- Successfully extracted 263 enemy sprites from MGO.MKF
- YJ1 compressed → sMKF structure → RLE frames → PNG
- Includes Tree Demon Boss (enemy571.png - 20KB, massive sprite!)
- Files: `images/enemies/enemy1.png` through `images/enemies/enemy631.png`

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
├── FBP.MKF → YJ1 compressed → 320x200 battle backgrounds ✅ (10 backgrounds)
├── F.MKF → YJ1 compressed → sMKF → Battle animations ✅ (149 frames, 19 characters)
├── RGM.MKF → sMKF structure → Character portraits ✅ (88 portraits)
├── MGO.MKF → YJ1 compressed → sMKF → Enemy sprites ✅ (263 enemies)
├── SSS.MKF → sMKF structure → Game data (objects/events) ⚠️
├── ABC.MKF → YJ1 compressed → UI elements ⚠️
├── FIRE.MKF → Spell effects (not yet converted)
├── PAT.MKF → Color palettes ✅ (used for all conversions)
└── RNG.MKF → Map tiles (not yet converted)
```

### Sprite Extraction Breakthrough

**Key Discovery:** Battle sprites are in F.MKF, NOT SSS.MKF!
- `SSS.MKF` = Game object/event data (not battle graphics)
- `F.MKF` = Battle character animations with 10-11 frames each
- `RGM.MKF` = Character portrait busts for UI
- `MGO.MKF` = Enemy battle sprites

**Battle Animation Structure (F.MKF):**
Each character file contains multiple animation frames:
- Frames 0-3: Death/defeat animation
- Frames 4-5: Standing/ready pose
- Frames 6-7: Normal attack sequence
- Frames 8-9: Magic casting animation
- Frame 10: Special attack (for some characters)

**Extraction Process:**
1. Extract F.MKF → individual F0.f, F1.f, F2.f files (one per character)
2. Decompress YJ1 format → raw data
3. Extract sMKF structure → individual RLE frames
4. Convert RLE → PNG using PAT.MKF palette
5. Result: Multi-frame battle animations!

**Animation Implementation:**
- Normal attacks use frames 6-7 for coherent sword/physical attack sequence
- Magic spells use frames 8-9 for casting animations
- Each action type uses its own dedicated frame sequence to ensure smooth, coherent animations

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
