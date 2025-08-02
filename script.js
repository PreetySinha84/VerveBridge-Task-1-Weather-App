const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const errorMessageDiv = document.querySelector(".error-message");
const unitToggle = document.querySelector("#unit-toggle");

const API_KEY = "15f12d856d7592b2e14dcda4352446ec";

let isCelsius = true;
let currentWeatherData = null;

// Show error/success messages
const showError = (message, isSuccess = false) => {
    errorMessageDiv.textContent = message;
    errorMessageDiv.className = `error-message ${isSuccess ? 'success' : ''}`;
    errorMessageDiv.style.display = 'block';
    setTimeout(() => { errorMessageDiv.style.display = 'none'; }, 5000);
};

// Loading spinner
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

// Convert temperature
const convertTemperature = (temp) => {
    return isCelsius
        ? (temp - 273.15).toFixed(2) + '°C'
        : (((temp - 273.15) * 9 / 5) + 32).toFixed(2) + '°F';
};

// Validate city input
const validateCityInput = (cityName) => {
    const trimmedCity = cityName.trim();
    if (!trimmedCity) { showError('Please enter a city name'); return false; }
    if (trimmedCity.length < 2) { showError('City name must be at least 2 characters long'); return false; }
    if (!/^[a-zA-Z\s,-]+$/.test(trimmedCity)) {
        showError('Please enter a valid city name (letters, spaces, commas, and hyphens only)');
        return false;
    }
    return true;
};

// Weather card template
const createWeatherCard = (cityName, weatherItem, index) => {
    const safeCityName = cityName && cityName.trim() !== "" ? cityName : "Unknown Location";
    const temperature = convertTemperature(weatherItem.main.temp);
    const feelsLike = convertTemperature(weatherItem.main.feels_like);
    const weatherDescription = weatherItem.weather[0].description;
    const bg=document.querySelector("#weather-bg");

    let arr=[];
        arr.push(weatherItem.weather[0].main);
        console.log(arr[0]);
    
    if (index === 0) {
        if(arr[0]==="Rain"){
            document.body.style.backgroundImage="none";
            bg.style.backgroundImage="url('rain.gif')";
            console.log("bg changed");
        }
        return `<div class="details">
                    <h2>${safeCityName} (${weatherItem.dt_txt.split(" ")[0]})</h2> 
                    <h4>Temperature: ${temperature}</h4>
                    <h4>Feels like: ${feelsLike}</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4> 
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                    <h4>Pressure: ${weatherItem.main.pressure} hPa</h4>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon" loading="lazy">
                    <h4>${weatherDescription}</h4>
                </div>`;
    } else {
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon" loading="lazy">
                    <h4>Temp: ${temperature}</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </li>`;
    }

};

// Fetch weather data
const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status}: Failed to fetch weather data`);
            return res.json();
        })
        .then(data => {
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            currentWeatherData = { cityName, forecast: fiveDaysForecast };
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            fiveDaysForecast.forEach((weatherItem, index) => {
                if (index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });

            showError(`Weather data loaded successfully for ${cityName}!`, true);
        })
        .catch((error) => {
            console.error('Weather API Error:', error);
            showError("Failed to fetch weather data. Please check your internet or API key.");
        });
};

// Get coordinates from city name
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!validateCityInput(cityName)) return;

    showLoading(searchButton, true);

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status}: Unable to fetch city coordinates`);
            return res.json();
        })
        .then(data => {
            showLoading(searchButton, false);

            if (!data.length || !data[0].name) {
                showError(`City not found: "${cityName}". Please check the spelling.`);
                return;
            }

            const result = data[0];

            // ✅ Ensure near-exact match (block fuzzy matches)
            if (!result.name.toLowerCase().startsWith(cityName.toLowerCase())) {
                showError(`No exact match found for "${cityName}". Did you mean "${result.name}, ${result.country}"?`);
                return;
            }

            const { name, lat, lon, country } = result;
            getWeatherDetails(`${name}, ${country}`, lat, lon);
        })
        .catch((error) => {
            showLoading(searchButton, false);
            console.error('Geocoding API Error:', error);
            showError("Network error or invalid city. Please check your connection.");
        });
};

// Get user's current location
const getUserCoordinates = () => {
    showLoading(locationButton, true);

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL)
                .then(res => {
                    if (!res.ok) throw new Error(`Error ${res.status}: Failed to reverse geocode location`);
                    return res.json();
                })
                .then(data => {
                    showLoading(locationButton, false);

                    if (!data.length || !data[0].name) {
                        showError("Unable to determine your city from your location.");
                        return;
                    }

                    const { name, country } = data[0];
                    getWeatherDetails(`${name}, ${country}`, latitude, longitude);
                })
                .catch((error) => {
                    showLoading(locationButton, false);
                    console.error('Reverse Geocoding Error:', error);
                    showError("Failed to get your location details. Try searching manually.");
                });
        },
        error => {
            showLoading(locationButton, false);
            let errorMessage = "Location access denied. ";

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "Please enable location access in your browser settings.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "Location unavailable. Try manual search.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "Location request timed out. Please try again.";
                    break;
                default:
                    errorMessage += "An unknown error occurred. Try manual search.";
                    break;
            }
            showError(errorMessage);
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
};

// Toggle temperature unit
const toggleTemperatureUnit = () => {
    isCelsius = !isCelsius;
    if (currentWeatherData) {
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";
        currentWeatherData.forecast.forEach((weatherItem, index) => {
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(currentWeatherData.cityName, weatherItem, index));
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(currentWeatherData.cityName, weatherItem, index));
            }
        });
    }
};

// Input handling with debounce
let searchTimeout;
const handleSearchInput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const cityName = cityInput.value.trim();
        if (cityName.length >= 2) errorMessageDiv.style.display = 'none';
    }, 300);
};

// Event listeners
locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());
cityInput.addEventListener("input", handleSearchInput);
unitToggle.addEventListener("change", toggleTemperatureUnit);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    cityInput.focus();
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            getUserCoordinates();
        }
    });
    console.log('Weather App initialized successfully!');
});
