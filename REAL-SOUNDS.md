# Real PAL1 Sound Effects

I extracted 276 sound effects from the original PAL1 VOC.MKF file!

## Current Sounds (from PAL1)

- **hero-attack.mp3** = VOC15 (0.82s sword swing sound)
- **boss-attack.mp3** = VOC22 (monster/heavy attack)
- **hit.mp3** = VOC12 (impact/damage sound)

## Try Different Sounds

All 276 original PAL1 sounds are in `/Users/kenpeter/Downloads/PAL/VOC*.mp3`

**To test different sounds:**

```bash
# Try different attack sounds (VOC1-30 are common UI/battle sounds)
cp /Users/kenpeter/Downloads/PAL/VOC16.mp3 hero-attack.mp3
cp /Users/kenpeter/Downloads/PAL/VOC23.mp3 boss-attack.mp3
cp /Users/kenpeter/Downloads/PAL/VOC13.mp3 hit.mp3
```

**Good candidates to try:**
- Attack sounds: VOC10, VOC13, VOC15, VOC16, VOC17, VOC18
- Monster sounds: VOC22, VOC23, VOC24, VOC25, VOC26
- Hit sounds: VOC1, VOC2, VOC3, VOC12

## Playing Sounds to Find the Right One

```bash
cd /Users/kenpeter/Downloads/PAL
# Play a sound to hear it
afplay VOC15.mp3
# Press Ctrl+C to stop
```

Test different VOC files until you find the perfect attack sounds!
