# WorkLog - Icons

The PWA requires icons for home screen installation.

## Generate Icons

You can generate icons using any of these methods:

### Method 1: Using an online tool
1. Create a logo/icon (512x512px recommended)
2. Use https://realfavicongenerator.net
3. Generate all sizes
4. Place in `/public` directory

### Method 2: Using ImageMagick (if installed)

```bash
# Create a base icon first (e.g., icon.png - 512x512)
# Then resize:

convert icon.png -resize 192x192 public/icon-192.png
convert icon.png -resize 512x512 public/icon-512.png
```

### Method 3: Simple SVG placeholder

For development, you can use a simple colored square:

```bash
# Create a blue square as placeholder
convert -size 192x192 xc:#4f46e5 public/icon-192.png
convert -size 512x512 xc:#4f46e5 public/icon-512.png
```

## Icon Requirements

- **icon-192.png**: 192x192px (required)
- **icon-512.png**: 512x512px (required)
- Format: PNG with transparency
- Theme: Should match app branding (indigo/blue)

## Quick Placeholder (for testing)

If you just want to test PWA functionality without icons:

```bash
# Create simple colored squares
cd worklog/public
curl "https://via.placeholder.com/192/4f46e5/ffffff?text=WL" -o icon-192.png
curl "https://via.placeholder.com/512/4f46e5/ffffff?text=WorkLog" -o icon-512.png
```

These placeholder icons will work for testing PWA installation.
