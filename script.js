const cityInput = document.querySelector(".city-input"); // Selects the input field for the city name
const searchButton = document.querySelector(".search-btn"); // Selects the button for searching weather by city
const locationButton = document.querySelector(".location-btn"); // Selects the button for getting the user's current location
const currentWeatherDiv = document.querySelector(".current-weather"); // Div to display the current weather details
const weatherCardsDiv = document.querySelector(".weather-cards"); // Div to display the weather forecast cards

// API configuration with environment variable fallback for production
const API_KEY = process?.env?.OPENWEATHER_API_KEY || "92d96435984d109b204dfce4606d8f45"; // Move to server-side in production
const API_BASE_URL = "https://api.openweathermap.org"; // Use HTTPS to prevent mixed content issues

// Input validation and sanitization utilities
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>\"']/g, ''); // Basic XSS prevention
};

const validateCityName = (cityName) => {
    const sanitized = sanitizeInput(cityName);
    // Allow letters, spaces, hyphens, and apostrophes (common in city names)
    const validPattern = /^[a-zA-Z\s\-']{1,100}$/;
    return validPattern.test(sanitized) ? sanitized : null;
};

// Function to create HTML for displaying weather details for the current day and forecast cards 
// Now with proper escaping to prevent XSS attacks
const createWeatherCard = (cityName, weatherItem, index) => {
    // Sanitize all dynamic content
    const safeCityName = sanitizeInput(cityName);
    const safeDescription = sanitizeInput(weatherItem.weather[0].description);
    const temperature = (weatherItem.main.temp - 273.15).toFixed(2);
    const windSpeed = weatherItem.wind.speed;
    const humidity = weatherItem.main.humidity;
    const date = weatherItem.dt_txt.split(" ")[0];
    const iconCode = weatherItem.weather[0].icon;
    
    // Validate numeric values to prevent injection
    if (isNaN(temperature) || isNaN(windSpeed) || isNaN(humidity)) {
        console.error('Invalid weather data received');
        return '<div class="error">Invalid weather data</div>';
    }
    
    if(index === 0) { // If it's the first item (current day weather)
        return `<div class="details">
                    <h2>${safeCityName} (${date})</h2> 
                    <h4>Temperature: ${temperature}°C</h4> 
                    <h4>Wind: ${windSpeed} M/S</h4> 
                    <h4>Humidity: ${humidity}%</h4> 
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${iconCode}@4x.png" alt="weather-icon" onerror="this.style.display='none'">
                    <h4>${safeDescription}</h4>
                </div>`;
    } else { // For other days (forecast cards)
        return `<li class="card">
                    <h3>(${date})</h3>
                    <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather-icon" onerror="this.style.display='none'">
                    <h4>Temp: ${temperature}°C</h4>
                    <h4>Wind: ${windSpeed} M/S</h4>
                    <h4>Humidity: ${humidity}%</h4>
                </li>`;
    }
};
// Enhanced error handling and loading states
const showError = (message, isUserFriendly = true) => {
    const errorMessage = isUserFriendly ? message : "Something went wrong. Please try again later.";
    alert(errorMessage);
    console.error('Weather App Error:', message); // Log technical details for debugging
};

const showLoading = (isLoading) => {
    searchButton.disabled = isLoading;
    locationButton.disabled = isLoading;
    searchButton.textContent = isLoading ? 'Loading...' : 'Search';
    locationButton.textContent = isLoading ? 'Getting Location...' : 'Use Current Location';
};

// Fetches weather details for the specified city using its coordinates (latitude and longitude)
// Now with improved error handling and security measures
const getWeatherDetails = (cityName, lat, lon) => {
    // Validate coordinates to prevent injection attacks
    if (typeof lat !== 'number' || typeof lon !== 'number' || 
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        showError('Invalid coordinates provided');
        return;
    }
    
    const WEATHER_API_URL = `${API_BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    showLoading(true);
    
    fetch(WEATHER_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Validate API response structure
            if (!data || !data.list || !Array.isArray(data.list)) {
                throw new Error('Invalid API response format');
            }
            
            const uniqueForecastDays = []; // Array to keep track of unique forecast dates
            const fiveDaysForecast = data.list.filter(forecast => {
                // Additional validation for forecast data
                if (!forecast || !forecast.dt_txt || !forecast.main || !forecast.weather) {
                    return false;
                }
                
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if(!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });
            
            // Clear previous results
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";
            
            // Display weather data
            fiveDaysForecast.forEach((weatherItem, index) => {
                const cardHTML = createWeatherCard(cityName, weatherItem, index);
                if (cardHTML.includes('error')) {
                    console.error('Error creating weather card for item:', weatherItem);
                    return;
                }
                
                if(index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", cardHTML);
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", cardHTML);
                }
            });
        })
        .catch(error => {
            console.error('Weather API Error:', error);
            if (error.message.includes('HTTP error')) {
                showError('Weather service is currently unavailable. Please try again later.');
            } else if (error.message.includes('Invalid')) {
                showError('Received invalid data from weather service.');
            } else {
                showError('Failed to fetch weather data. Please check your internet connection.');
            }
        })
        .finally(() => {
            showLoading(false);
        });
};
// Function to get the latitude and longitude of a given city
// Enhanced with proper input validation and security measures
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    
    // Validate input
    if (!cityName) {
        showError('Please enter a city name', true);
        return;
    }
    
    const validatedCityName = validateCityName(cityName);
    if (!validatedCityName) {
        showError('Please enter a valid city name (letters, spaces, hyphens only)', true);
        return;
    }
    
    // Encode the city name to prevent URL injection
    const encodedCityName = encodeURIComponent(validatedCityName);
    const GEOCODING_API_URL = `${API_BASE_URL}/geo/1.0/direct?q=${encodedCityName}&limit=1&appid=${API_KEY}`;
    
    showLoading(true);
    
    fetch(GEOCODING_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Geocoding API error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                showError(`No location found for "${validatedCityName}". Please check the spelling and try again.`, true);
                return;
            }
            
            const location = data[0];
            if (!location.name || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
                throw new Error('Invalid geocoding response format');
            }
            
            getWeatherDetails(location.name, location.lat, location.lon);
        })
        .catch(error => {
            console.error('Geocoding Error:', error);
            if (error.message.includes('API error')) {
                showError('Location service is currently unavailable. Please try again later.');
            } else {
                showError('Failed to find the location. Please try again.');
            }
        })
        .finally(() => {
            showLoading(false);
        });
};

// Function to get the user's current location coordinates using the browser's geolocation API
// Enhanced with better error handling and security considerations
const getUserCoordinates = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.', true);
        return;
    }
    
    showLoading(true);
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 300000 // Accept cached position up to 5 minutes old
    };
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            
            // Validate coordinates
            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                showError('Invalid location data received.');
                showLoading(false);
                return;
            }
            
            const REVERSE_GEOCODING_URL = `${API_BASE_URL}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            
            fetch(REVERSE_GEOCODING_URL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Reverse geocoding error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!Array.isArray(data) || data.length === 0 || !data[0].name) {
                        throw new Error('Could not determine city name from location');
                    }
                    
                    getWeatherDetails(data[0].name, latitude, longitude);
                })
                .catch(error => {
                    console.error('Reverse Geocoding Error:', error);
                    showError('Could not determine your location. Please try searching by city name.');
                })
                .finally(() => {
                    showLoading(false);
                });
        },
        error => {
            showLoading(false);
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    showError('Location access denied. Please enable location services and refresh the page.', true);
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError('Location information is unavailable. Please try searching by city name.', true);
                    break;
                case error.TIMEOUT:
                    showError('Location request timed out. Please try again or search by city name.', true);
                    break;
                default:
                    showError('An unknown error occurred while getting your location.', true);
                    break;
            }
        },
        options
    );
};
// Event listeners for button clicks and "Enter" key press
// Enhanced with debouncing to prevent rapid API calls
let searchTimeout;

const debouncedSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(getCityCoordinates, 300); // Wait 300ms after last keystroke
};

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);

// Enhanced keyboard event handling with input validation
cityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        getCityCoordinates();
    }
});

// Add input validation feedback
cityInput.addEventListener("input", (e) => {
    const value = e.target.value.trim();
    const isValid = value === '' || validateCityName(value);
    
    // Visual feedback for invalid input
    if (!isValid && value.length > 0) {
        e.target.style.borderColor = '#ff6b6b';
        e.target.title = 'Please enter a valid city name (letters, spaces, hyphens only)';
    } else {
        e.target.style.borderColor = '';
        e.target.title = '';
    }
});

// Prevent form submission if browser auto-wraps in a form
document.addEventListener('DOMContentLoaded', () => {
    const form = cityInput.closest('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            getCityCoordinates();
        });
    }
});