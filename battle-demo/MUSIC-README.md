# How to Add Battle Music (BGM)

The battle demo now has a music system! Follow these steps to add authentic PAL1 battle music:

## Quick Setup:

1. **Download PAL1 battle music** from one of these sources:
   - [CHEGVA - 仙剑奇侠传 Music Collection](https://chegva.com/3814.html)
   - [爱给网 - PAL1 Game BGM](https://www.aigei.com/music/game/chinese_paladin_knight_biography/)
   - [Internet Archive - PAL1 1995](https://archive.org/details/pal1_1995)

2. **Convert to MP3** (if needed):
   - If the file is `.mid`, `.wav`, or other format, convert to MP3
   - Use an online converter or tool like Audacity

3. **Rename and place the file**:
   ```bash
   # Save your music file as:
   battle-demo/battle-bgm.mp3
   ```

4. **Done!** Refresh the page and click the music button (🔊 bottom right)

## Music Controls:

- **🔇** = Music OFF (click to play)
- **🔊** = Music ON (click to pause)
- Music loops automatically
- Volume can be controlled by browser

## Recommended Battle Tracks:

From the original PAL1, common battle themes are:
- **战斗** (Battle) - Main battle theme
- **战斗_03** (Battle_03) - Boss battle theme
- Tracks 2-13 from the original CD contain the full OST

## Notes:

- File must be named exactly: `battle-bgm.mp3`
- Supported formats: MP3 (recommended), OGG, WAV
- File should be placed in the `battle-demo/` folder
- Maximum recommended file size: 5-10MB for web performance

## Troubleshooting:

**Music doesn't play:**
- Check that file is named `battle-bgm.mp3`
- Check browser console for errors (F12)
- Try clicking the music button manually (browsers block autoplay)

**Wrong music plays:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Make sure only one `battle-bgm.mp3` exists in the folder
