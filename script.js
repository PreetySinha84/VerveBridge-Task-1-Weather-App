// Grabbing DOM elements for interaction
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const weatherDataContainer = document.querySelector(".weather-data");
const weatherInputContainer = document.querySelector(".weather-input");

const unitToggleDiv = document.querySelector(".unit-toggle");
const unitToggle = document.getElementById("unit-toggle");
const unitLabel = document.querySelector(".unit-label");

// Track whether Celsius is the selected unit
let useCelsius = true;

// Your OpenWeatherMap API key
const API_KEY = "92d96435984d109b204dfce4606d8f45";

// Hide results and unit toggle by default
weatherDataContainer.classList.add("hidden");
unitToggleDiv.classList.add("hidden");
weatherInputContainer.classList.add("center-input");

// Handle temperature unit toggle
unitToggle.addEventListener("change", () => {
    useCelsius = !unitToggle.checked; // If toggle is checked, use Fahrenheit
    unitLabel.textContent = useCelsius ? "°C" : "°F"; // Update label

    // If weather is already shown, update it with the new unit
    if (!weatherDataContainer.classList.contains("hidden")) {
        const cityName = document.querySelector(".current-weather h2")?.textContent;
        if (cityName) {
            const GEO_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
            fetch(GEO_URL)
                .then(res => res.json())
                .then(data => {
                    if (!data.length) return;
                    const { name, lat, lon } = data[0];
                    getWeatherDetails(name, lat, lon); // Refresh with new unit
                });
        }
    }
});

// Template to build weather cards (both current and forecast)
const createWeatherCard = (cityName, weatherItem, index) => {
    const kelvin = weatherItem.main.temp;

    // Convert temperature based on unit toggle
    const temp = useCelsius
        ? (kelvin - 273.15).toFixed(2) + "°C"
        : ((kelvin - 273.15) * 9 / 5 + 32).toFixed(2) + "°F";

    // Format the date for forecast cards
    const dateObj = new Date(weatherItem.dt_txt);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
    });

    // First card: current weather (larger, full-width)
    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName}</h2> 
                    <h4>Temperature: ${temp}</h4> 
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4> 
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4> 
                </div>`;
    } else {
        // Remaining cards: 5-day forecast
        return `<li class="card">
                    <h3>${formattedDate}</h3>
                    <h4>Temp: ${temp}</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </li>`;
    }
};

// Fetch weather using latitude and longitude
const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            const uniqueForecastDays = [];

            // Filter out one forecast per day (only 5 days)
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            // Clear old results
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            // Show weather section and toggle
            weatherDataContainer.classList.remove("hidden");
            unitToggleDiv.classList.remove("hidden");
            weatherInputContainer.classList.remove("center-input");

            // Render weather cards
            fiveDaysForecast.forEach((weatherItem, index) => {
                const cardHTML = createWeatherCard(cityName, weatherItem, index);
                if (index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", cardHTML);
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", cardHTML);
                }
            });
        })
        .catch(() => alert("An error occurred while fetching the weather forecast!"));
};

// Get coordinates from city name (search input)
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim(); // Remove extra spaces
    if (!cityName) return; // Do nothing if input is empty

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon); // Fetch weather using coordinates
        })
        .catch(() => alert("An error occurred while fetching the coordinates!"));
};

// Use browser geolocation to get current position
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;

            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => alert("An error occurred while fetching the city!"));
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            }
        }
    );
};

// Event listeners for user actions
locationButton.addEventListener("click", getUserCoordinates); // Use location
searchButton.addEventListener("click", getCityCoordinates); // Click search
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates()); // Enter key
