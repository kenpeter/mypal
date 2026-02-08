# Battle Sound Effects

The game includes 3 sound effects that play during combat:

## Sound Files

1. **hero-attack.mp3** - Plays when any hero attacks
   - Current: Simple tone (800Hz, 0.3s)
   - Purpose: Sword swing / attack whoosh sound

2. **boss-attack.mp3** - Plays when the boss attacks
   - Current: Low tone (200Hz, 0.4s)
   - Purpose: Monster roar / heavy attack sound

3. **hit.mp3** - Plays when damage is dealt to target
   - Current: Mid tone (400Hz, 0.15s)
   - Purpose: Impact / damage hit sound

## Replacing Sounds

The current sounds are simple tones. To use better sound effects:

1. **Find PAL1 sound effects** from:
   - Original game assets (if available)
   - Sound effect libraries
   - Record/create custom sounds

2. **Replace the files**:
   ```bash
   # Copy your sound files with these exact names:
   cp your-sword-sound.mp3 hero-attack.mp3
   cp your-monster-sound.mp3 boss-attack.mp3
   cp your-hit-sound.mp3 hit.mp3
   ```

3. **File requirements**:
   - Format: MP3 (OGG or WAV also supported)
   - Duration: Keep short (0.1s - 0.5s recommended)
   - Volume: Normalized, not too loud

## Sound Timing

- Hero attack sound: Plays immediately when hero starts attack animation
- Boss attack sound: Plays immediately when boss starts attack animation
- Hit sound: Plays 500ms later when damage numbers appear

All sounds are set to restart from beginning (currentTime = 0) so they can overlap if attacks happen quickly.
