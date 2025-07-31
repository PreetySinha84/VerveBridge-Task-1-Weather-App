const cityInput = document.querySelector(".city-input"); // Selects the input field for the city name
const searchButton = document.querySelector(".search-btn"); // Selects the button for searching weather by city
const locationButton = document.querySelector(".location-btn"); // Selects the button for getting the user's current location
const currentWeatherDiv = document.querySelector(".current-weather"); // Div to display the current weather details
const weatherCardsDiv = document.querySelector(".weather-cards"); // Div to display the weather forecast cards
const errorMessageDiv = document.querySelector(".error-message"); // Div to display error messages
const unitToggle = document.querySelector("#unit-toggle"); // Temperature unit toggle

const API_KEY = "92d96435984d109b204dfce4606d8f45"; // OpenWeatherMap API key for accessing weather data

// Global state
let isCelsius = true; // Default to Celsius
let currentWeatherData = null; // Store current weather data for unit conversion

// Utility functions
const showError = (message, isSuccess = false) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.className = `error-message ${isSuccess ? 'success' : ''}`;
    errorMessageDiv.style.display = 'block';
    setTimeout(() => {
        errorMessageDiv.style.display = 'none';
    }, 5000);
};

const showLoading = (button, isLoading) => {
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loading-spinner');
    
    if (isLoading) {
        btnText.textContent = 'Loading...';
        spinner.style.display = 'block';
        button.disabled = true;
    } else {
        btnText.textContent = button === searchButton ? 'Search' : 'Use Current Location';
        spinner.style.display = 'none';
        button.disabled = false;
    }
};

const convertTemperature = (temp) => {
    if (isCelsius) {
        return (temp - 273.15).toFixed(2) + '°C';
    } else {
        return (((temp - 273.15) * 9/5) + 32).toFixed(2) + '°F';
    }
};

const validateCityInput = (cityName) => {
    const trimmedCity = cityName.trim();
    if (!trimmedCity) {
        showError('Please enter a city name');
        return false;
    }
    if (trimmedCity.length < 2) {
        showError('City name must be at least 2 characters long');
        return false;
    }
    if (!/^[a-zA-Z\s,-]+$/.test(trimmedCity)) {
        showError('Please enter a valid city name (letters, spaces, commas, and hyphens only)');
        return false;
    }
    return true;
};

// Function to create HTML for displaying weather details for the current day and forecast cards 
const createWeatherCard = (cityName, weatherItem, index) => {
    const temperature = convertTemperature(weatherItem.main.temp);
    const feelsLike = convertTemperature(weatherItem.main.feels_like);
    
    if(index === 0){  // If it's the first item (current day weather)
         return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2> 
                    <h4>Temperature: ${temperature}</h4>
                    <h4>Feels like: ${feelsLike}</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4> 
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                    <h4>Pressure: ${weatherItem.main.pressure} hPa</h4>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon" loading="lazy">
                    <h4>${weatherItem.weather[0].description}</h4>
                </div>`;
    } else { // For other days (forecast cards)
    return `<li class="card">
                <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon" loading="lazy">
                <h4>Temp: ${temperature}</h4>
                <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </li>` ;
    }
}
// Fetches weather details for the specified city using its coordinates (latitude and longitude)
const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            const uniqueForecastDays = []; // Array to keep track of unique forecast dates
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate(); // Extracts the date from the forecast timestamp
                if(!uniqueForecastDays.includes(forecastDate)) { // Check if the date is unique
                    return uniqueForecastDays.push(forecastDate); // Adds unique date to the array
                }
            });
            
            // Store current weather data for unit conversion
            currentWeatherData = {
                cityName,
                forecast: fiveDaysForecast
            };
            
            cityInput.value = ""; // Clear the city input field 
            currentWeatherDiv.innerHTML = ""; // Clears current weather div
            weatherCardsDiv.innerHTML = "";   // Clears forecast cards div
            
            // Loop through the filtered forecast data and display it on the page
            fiveDaysForecast.forEach((weatherItem, index) => {
                if(index === 0) { // First item is the current weather
                    currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                } else { // Other items are forecast cards
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });
            document.body.style.height = '203svh';
            document.querySelector('.weather-data').style.display = 'block';
            
            showError(`Weather data loaded successfully for ${cityName}!`, true);
            
        }).catch((error) => {
            console.error('Weather API Error:', error);
            showError("Failed to fetch weather data. Please try again later.");
        });
}
// Function to get the latitude and longitude of a given city
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim(); // Gets the city name from the input field and trims any whitespace
    
    if (!validateCityInput(cityName)) return; // Validate input before proceeding
    
    showLoading(searchButton, true); // Show loading state
    
    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            showLoading(searchButton, false); // Hide loading state
            
            if(!data.length) {
                showError(`No coordinates found for "${cityName}". Please check the spelling and try again.`);
                return;
            }
            
            const { name, lat, lon } = data[0]; // Destructures the first result from the data
            getWeatherDetails(name, lat, lon); // Calls the function to get weather details using coordinates
            
        }).catch((error) => {
            showLoading(searchButton, false); // Hide loading state
            console.error('Geocoding API Error:', error);
            showError("Failed to find city coordinates. Please check your internet connection and try again.");
        });
}

// Function to get the user's current location coordinates using the browser's geolocation API
const getUserCoordinates = () => {
    showLoading(locationButton, true); // Show loading state
    
    navigator.geolocation.getCurrentPosition(
        position => { // If the user allows geolocation access
            const { latitude, longitude} = position.coords; // Destructures the latitude and longitude
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            
            fetch(REVERSE_GEOCODING_URL)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    showLoading(locationButton, false); // Hide loading state
                    
                    if (!data.length) {
                        showError("Unable to determine your city from your location.");
                        return;
                    }
                    
                    const { name } = data[0]; // Gets the city name from reverse geocoding response
                    getWeatherDetails(name, latitude, longitude); // Calls the function to get weather details using coordinates
                    
                }).catch((error) => {
                    showLoading(locationButton, false); // Hide loading state
                    console.error('Reverse Geocoding Error:', error);
                    showError("Failed to get your location details. Please try searching by city name.");
                });
        },
        error => {
            showLoading(locationButton, false); // Hide loading state
            
            let errorMessage = "Location access denied. ";
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "Please enable location access in your browser settings and try again.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "Location information is unavailable. Please try searching by city name.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "Location request timed out. Please try again.";
                    break;
                default:
                    errorMessage += "An unknown error occurred. Please try searching by city name.";
                    break;
            }
            
            showError(errorMessage);
        },
        {
            timeout: 10000, // 10 second timeout
            enableHighAccuracy: true
        }
    );
}

// Temperature unit toggle functionality
const toggleTemperatureUnit = () => {
    isCelsius = !isCelsius;
    
    // Re-render weather data with new units if available
    if (currentWeatherData) {
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";
        
        currentWeatherData.forecast.forEach((weatherItem, index) => {
            if(index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(currentWeatherData.cityName, weatherItem, index));
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(currentWeatherData.cityName, weatherItem, index));
            }
        });
    }
};

// Enhanced input validation with debouncing
let searchTimeout;
const handleSearchInput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const cityName = cityInput.value.trim();
        if (cityName.length >= 2) {
            // Could add autocomplete suggestions here in future
            errorMessageDiv.style.display = 'none';
        }
    }, 300);
};
// Event listeners for button clicks and "Enter" key press
locationButton.addEventListener("click", getUserCoordinates); // Fetch weather based on current location
searchButton.addEventListener("click", getCityCoordinates); // Fetch weather based on city input
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates()); // Enter key triggers search
cityInput.addEventListener("input", handleSearchInput); // Enhanced input handling
unitToggle.addEventListener("change", toggleTemperatureUnit); // Temperature unit toggle

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Set initial focus to city input
    cityInput.focus();
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            getUserCoordinates();
        }
    });
    
    console.log('Weather App initialized successfully!');
});