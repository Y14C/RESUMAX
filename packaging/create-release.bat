@echo off
echo Creating essentialpackage release bundle...

cd ../essentialpackage
tar -czf ../essentialpackage.zip Tesseract-OCR TinyTeX

echo.
echo Upload essentialpackage.zip to GitHub Releases:
echo https://github.com/[your-repo]/resumax/releases
echo.
pause
