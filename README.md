# 🌤️ Weather App
A responsive weather dashboard that lets users search for current weather and a 5-day forecast by city name or use their current location. Built with HTML, CSS, and JavaScript using the OpenWeatherMap API.

## 🚀 Features
- 🔍 **Smart Search**: Type in any city with input validation and error handling
- 📍 **Location-based Weather**: Automatically fetches weather using GPS geolocation
- 🌡️ **Temperature Units**: Toggle between Celsius and Fahrenheit 
- 🕔 **5-Day Forecast**: Detailed upcoming weather with additional metrics
- 🎨 **Enhanced UI**: Modern design with loading states and smooth animations
- ⚡ **Better UX**: Improved error handling, accessibility, and keyboard shortcuts
- 📱 **Fully Responsive**: Optimized for all devices and screen sizes
- � **Performance**: Lazy loading images and optimized API calls

## ✨ New Enhancements
- **Loading Indicators**: Visual feedback during API calls
- **Smart Error Messages**: User-friendly error handling with auto-dismiss
- **Input Validation**: Real-time validation for city names
- **Accessibility**: ARIA labels and keyboard navigation support
- **Temperature Toggle**: Switch between °C and °F with one click
- **Enhanced Weather Cards**: Gradient backgrounds with hover animations
- **Additional Metrics**: Feels-like temperature and atmospheric pressure
- **Keyboard Shortcuts**: Ctrl+L for location-based search

## 🖼️ Preview
<img width="1852" height="929" alt="image" src="https://github.com/user-attachments/assets/5f499971-2ed9-4135-95a2-b00f1e44dcd2" />

## 🛠️ Technologies Used
- HTML5
- CSS3 (with media queries for responsiveness)
- JavaScript (Vanilla)
- OpenWeatherMap API

## 🧾 Setup Instructions
1. Clone the Repository
```bash
git clone https://github.com/your-username/weather-app.git
cd weather-app
```

2. Get Your API Key
Go to OpenWeatherMap
Create a free account and generate an API key

3. Add Your API Key
Replace the API key string in script.js with your own:
```bash
const API_KEY = "YOUR_API_KEY_HERE";
```

5. Open in Browser
You can open index.html directly in a browser or use a live server (VS Code extension recommended).

## 📂 File Structure
```bash
weather-app/
│
├── Readme.md          # Project documentation
├── index.html         # Main HTML page
├── style.css          # All styling
├── script.js          # Core logic, API integration
└── sky.jpg            # Background image
```

## ❗ Notes
- Make sure location permission is allowed for the geolocation feature to work.
- Temperature is shown in °C and wind in meters per second (M/S).

## Contribution
Feel free to fork this repository, give it a ⭐, or contribute with improvements!
