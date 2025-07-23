const cityInput = document.querySelector(".city-input"); // Selects the input field for the city name
const searchButton = document.querySelector(".search-btn"); // Selects the button for searching weather by city
const locationButton = document.querySelector(".location-btn"); // Selects the button for getting the user's current location
const currentWeatherDiv = document.querySelector(".current-weather"); // Div to display the current weather details
const weatherCardsDiv = document.querySelector(".weather-cards"); // Div to display the weather forecast cards

const API_KEY = "92d96435984d109b204dfce4606d8f45"; // OpenWeatherMap API key for accessing weather data

// Function to create HTML for displaying weather details for the current day and forecast cards 

const  createWeatherCard = (cityName, weatherItem, index) => {
    if(index === 0){  // If it's the first item (current day weather)
         return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2> 
                    <h4>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°𝐂</h4> 
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4> 
                    <h4>Humidity: ${weatherItem.main.humidity}%</h4> 
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h4>${weatherItem.weather[0].description}</h4>
                </div>`;
    } else { // For other days (forecast cards)
    return `<li class="card">
                <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                <h4>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°𝐂</h4>
                <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
                </li>` ;
    }
}
// Fetches weather details for the specified city using its coordinates (latitude and longitude)
const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch( WEATHER_API_URL).then(res => res.json()).then(data => {
        const uniqueForecastDays = []; // Array to keep track of unique forecast dates
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate(); // Extracts the date from the forecast timestamp
            if(!uniqueForecastDays.includes(forecastDate)) { // Check if the date is unique
                return uniqueForecastDays.push(forecastDate); // Adds unique date to the array
            }
        });
        
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
}).catch(() => {
            alert("An error occurred while fetching the weather forecast!"); // Error handling for failed API request
        });
}
// Function to get the latitude and longitude of a given city

const getCityCoordinates = () => {
       const cityName = cityInput.value.trim(); // Gets the city name from the input field and trims any whitespace
       if(!cityName) return; // If the input is empty, exit the function
       const GEOCODING_API_URL = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

       fetch(GEOCODING_API_URL).then(res => res.json()).then(data => {
        if(!data.length) return alert(`No coordinates found for ${cityName}`); // If no coordinates are found, show an alert
        const { name, lat, lon } = data[0]; // Destructures the first result from the data
        getWeatherDetails(name, lat, lon); // Calls the function to get weather details using coordinates
}).catch(() => {
    alert("An error occurred while fetching the coordinates!"); // Error handling for failed API request
});
}

// Function to get the user's current location coordinates using the browser's geolocation API

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => { // If the user allows geolocation access
            const { latitude, longitude} = position.coords; // Destructures the latitude and longitude
            const REVERSE_GEOCODING_URL = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(REVERSE_GEOCODING_URL).then(res => res.json()).then(data => {
                const { name } = data[0]; // Gets the city name from reverse geocoding response
                getWeatherDetails(name, latitude, longitude); // Calls the function to get weather details using coordinates
        }).catch(() => {
            alert("An error occurred while fetching the city!"); // Error handling for failed API request
        });
        },
        error => {
            if(error.code === error.PERMISSION_DENIED) { // If user denies geolocation access
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            }
        }
    );
}
// Event listeners for button clicks and "Enter" key press
locationButton.addEventListener("click", getUserCoordinates); // Fetch weather based on current location
searchButton.addEventListener("click", getCityCoordinates); // Fetch weather based on city input
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates()); // Enter key triggers search
const toggle = document.getElementById("unitToggle");
const unitLabel = document.getElementById("unitLabel");
let isFahrenheit = localStorage.getItem("tempUnit") === "F";

if (isFahrenheit) toggle.checked = true;

toggle.addEventListener("change", () => {
  isFahrenheit = toggle.checked;
  localStorage.setItem("tempUnit", isFahrenheit ? "F" : "C");
  unitLabel.textContent = isFahrenheit ? "°F" : "°C";
  updateTemperatures();
});

function updateTemperatures() {
  document.querySelectorAll("h4").forEach(el => {
    const match = el.textContent.match(/Temperature: ([\d.]+)°[CF]/);
    if (match) {
      let temp = parseFloat(match[1]);
      if (isFahrenheit) {
        temp = (temp * 9/5) + 32;
        el.textContent = `Temperature: ${temp.toFixed(1)}°F`;
      } else {
        temp = (temp - 32) * 5/9;
        el.textContent = `Temperature: ${temp.toFixed(1)}°C`;
      }
    }
  });
}
// Call once on load if needed
if (isFahrenheit) {
  unitLabel.textContent = "°F";
  updateTemperatures();
}
