# Cairo Fonts for PDF Generation

## Setup Instructions

### Option 1: Copy from Flutter Project

Copy the Cairo font files from the Flutter project to this directory:

```bash
# From backend directory
mkdir -p assets/fonts
cp ../../AltayarFlutter/Altayar/assets/fonts/Cairo-Regular.ttf assets/fonts/
cp ../../AltayarFlutter/Altayar/assets/fonts/Cairo-Bold.ttf assets/fonts/
```

### Option 2: Download Cairo Font

1. Download Cairo font from Google Fonts: https://fonts.google.com/specimen/Cairo
2. Extract the font files
3. Copy `Cairo-Regular.ttf` and `Cairo-Bold.ttf` to `assets/fonts/` directory

### Required Files

- `Cairo-Regular.ttf` - Regular weight font
- `Cairo-Bold.ttf` - Bold weight font

## Usage

The fonts are automatically registered when generating PDFs. The system will:
1. Try to load fonts from `assets/fonts/`
2. Fallback to Flutter project fonts if not found
3. Use Helvetica if Cairo fonts are not available

## Notes

- Cairo font supports both Arabic and English characters
- RTL (Right-to-Left) text alignment is automatically handled
- Text is cleaned and normalized before rendering

