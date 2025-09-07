# Oracle Mode - Image Converter

A powerful Progressive Web App (PWA) for converting images between various formats directly in your browser.

## ✨ Features

- **Image Conversion**: Convert between JPG, PNG, GIF, BMP, WEBP, and SVG formats
- **Icon Generator**: Create app icons in multiple sizes
- **Batch Processor**: Process multiple images at once
- **Progressive Web App**: Install as a native app on your device
- **Offline Support**: Works without internet connection
- **Responsive Design**: Optimized for desktop and mobile

## 🚀 Live Demo

Visit the live app: [https://francismul.github.io/oracle_image_converter/](https://francismul.github.io/oracle_image_converter/)

## 📱 Installation

### Web Installation
1. Open the app in Chrome/Edge browser
2. Click the "📱 Install App" button when prompted
3. Or use browser menu → "Install Oracle Mode..."

### Mobile Installation
- **Android**: Tap "Add to Home screen" from browser menu
- **iOS**: Tap share button → "Add to Home Screen"

## 🛠️ Development

### Prerequisites
- Modern web browser with PWA support
- HTTPS for full PWA functionality (automatically provided by GitHub Pages)

### Local Development
1. Clone the repository
2. Open `index.html` in your browser
3. For full PWA testing, serve over HTTPS

### Deployment
The app automatically deploys to GitHub Pages on every push to the main branch via GitHub Actions.

## 📁 Project Structure

```
oracle_image_converter/
├── index.html                 # Main application
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
├── assets/
│   ├── css/
│   │   └── oracle-image-processing.css
│   ├── js/
│   │   └── oracle-image-processing.js
│   └── images/               # App icons
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages deployment
└── README.md
```

## 🏗️ PWA Features

- **Offline Functionality**: App works without internet
- **Installable**: Can be installed as a native app
- **Fast Loading**: Cached resources for quick startup
- **Responsive**: Adapts to different screen sizes
- **Secure**: Served over HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test PWA functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.