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

let useCelsius = true;

const API_KEY = "92d96435984d109b204dfce4606d8f45";

// Initial hidden states
weatherDataContainer.classList.add("hidden");
unitToggleDiv.classList.add("hidden");
weatherInputContainer.classList.add("center-input");

unitToggle.addEventListener("change", () => {
    useCelsius = !unitToggle.checked;
    unitLabel.textContent = useCelsius ? "°C" : "°F";

    if (!weatherDataContainer.classList.contains("hidden")) {
        const cityName = document.querySelector(".current-weather h2")?.textContent;
        if (cityName) {
            const GEO_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
            fetch(GEO_URL)
                .then(res => res.json())
                .then(data => {
                    if (!data.length) return;
                    const { name, lat, lon } = data[0];
                    getWeatherDetails(name, lat, lon);
                });
        }
    }
});

const createWeatherCard = (cityName, weatherItem, index) => {
    const kelvin = weatherItem.main.temp;
    const temp = useCelsius
        ? (kelvin - 273.15).toFixed(2) + "°C"
        : ((kelvin - 273.15) * 9 / 5 + 32).toFixed(2) + "°F";

    const dateObj = new Date(weatherItem.dt_txt);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric"
    });

    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName}</h2> 
                    <h4>Temperature: ${temp}</h4> 
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4> 
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4> 
                </div>`;
    } else {
        return `<li class="card">
                    <h3>${formattedDate}</h3>
                    <h4>Temp: ${temp}</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </li>`;
    }
};

const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            weatherDataContainer.classList.remove("hidden");
            unitToggleDiv.classList.remove("hidden");
            weatherInputContainer.classList.remove("center-input");

            fiveDaysForecast.forEach((weatherItem, index) => {
                if (index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                }
            });
        })
        .catch(() => alert("An error occurred while fetching the weather forecast!"));
};

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;
    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
        .then(res => res.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon);
        })
        .catch(() => alert("An error occurred while fetching the coordinates!"));
};

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

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());
