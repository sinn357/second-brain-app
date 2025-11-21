# PWA Icons

This directory contains placeholder icons for the PWA.

## Required Icons

- `icon-192.png` - 192x192 icon (for mobile devices)
- `icon-512.png` - 512x512 icon (for high-res displays)
- `icon.svg` - Vector icon (created)

## To Generate PNG Icons

You can use the included SVG to generate PNG icons:

```bash
# Using ImageMagick (if available)
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png

# Or use online tools:
# - https://realfavicongenerator.net/
# - https://www.favicon-generator.org/
```

## Screenshot Placeholders

For better PWA listing:
- `screenshot-wide.png` - 1280x720 (desktop view)
- `screenshot-narrow.png` - 750x1334 (mobile view)

These are optional but recommended for app stores.
