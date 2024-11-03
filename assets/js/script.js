const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");
const locationBtn = document.querySelector(".location-btn");

const weatherInfoSection = document.querySelector(".weather-info");
const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");

const countryTxt = document.querySelector(".country-txt");
const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");
const weatherSummaryImg = document.querySelector(".weather-summary-img");
const currentDateTxt = document.querySelector(".current-date-txt");

const forecastItemsContainer = document.querySelector(
    ".forecast-items-container"
);

const apiKey = "78b15f43b6ac82c203d35a970b5d8e08";

document.addEventListener("DOMContentLoaded", () => {
    useIPGeolocation();
});

searchBtn.addEventListener("click", () => {
    if (cityInput.value != "") {
        updateWeatherInfo(cityInput.value);
        cityInput.value = "";
        cityInput.blur();
    }
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && cityInput.value != "") {
        updateWeatherInfo(cityInput.value);
        cityInput.value = "";
        cityInput.blur();
    }
});

locationBtn.addEventListener("click", () => {
    useIPGeolocation();
});

async function getUserIP() {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error getting IP address:", error);
        return null;
    }
}

async function useIPGeolocation() {
    try {
        const ip = await getUserIP();
        if (!ip) {
            alert("Unable to retrieve IP address.");
            return;
        }

        // Use IP in ipapi URL
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        const { city, latitude, longitude } = data;

        if (latitude && longitude) {
            updateWeatherInfo("", latitude, longitude);
        } else {
            alert("Unable to retrieve location from IP.");
        }
    } catch (error) {
        console.error("IP-based geolocation error:", error);
        alert(
            "Unable to retrieve your location. Please enter a city manually."
        );
    }
}

async function fetchWeatherData(endPoint, city = null, lat = null, lon = null) {
    try {
        let url = `https://api.openweathermap.org/data/2.5/${endPoint}?appid=${apiKey}&units=metric`;
        if (city) {
            url += `&q=${city}`;
        } else if (lat && lon) {
            url += `&lat=${lat}&lon=${lon}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        return await response.json();
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
}

async function updateWeatherInfo(city = null, lat = null, lon = null) {
    const weatherData = await fetchWeatherData("weather", city, lat, lon);
    const forecastData = await fetchWeatherData("forecast", city, lat, lon);

    if (!weatherData || weatherData.cod != 200) {
        showSection(notFoundSection);
        return;
    }

    loadWeatherData(weatherData);
    if (forecastData) loadForecastData(forecastData);

    showSection(weatherInfoSection);
}

function showSection(section) {
    [weatherInfoSection, notFoundSection, searchCitySection].forEach(
        (s) => (s.style.display = "none")
    );
    section.style.display = "flex";
}

function loadWeatherData(data) {
    const {
        name: country,
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed },
    } = data;

    countryTxt.textContent = country;
    tempTxt.textContent = `${Math.round(temp)}°C`;
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = `${humidity}%`;
    windValueTxt.textContent = `${speed} M/s`;
    weatherSummaryImg.src = `/assets/weather/${getWeatherIcon(id)}.svg`;
    currentDateTxt.textContent = getCurrentDate();
}

function getWeatherIcon(id) {
    if (id <= 232) {
        return "thunderstorm";
    } else if (id <= 321) {
        return "drizzle";
    } else if (id <= 531) {
        return "rain";
    } else if (id <= 622) {
        return "snow";
    } else if (id <= 781) {
        return "atmosphere";
    } else if (id === 800) {
        return "clear";
    } else {
        return "clouds";
    }
}

function getCurrentDate() {
    const date = new Date();
    const options = { weekday: "short", month: "short", day: "2-digit" };
    return date.toLocaleDateString("en-GB", options);
}

function loadForecastData(data) {
    const today = new Date().toISOString().split("T")[0];
    const timeTaken = "12:00:00";

    const filteredForecastData = data.list.filter(
        (item) =>
            item.dt_txt.includes(timeTaken) &&
            item.dt_txt.split(" ")[0] !== today
    );

    forecastItemsContainer.innerHTML = "";
    updateForecastItems(filteredForecastData);
}

function updateForecastItems(forecastData) {
    const fragment = document.createDocumentFragment();

    forecastData.forEach((item) => {
        const forecastItem = document.createElement("div");
        forecastItem.classList.add("forecast-item");

        forecastItem.innerHTML = `
            <h5 class="forecast-item-date regular-txt">${new Date(
                item.dt_txt
            ).toLocaleDateString("en-GB", {
                month: "short",
                day: "2-digit",
            })}</h5>
            <img
                src="/assets/weather/${getWeatherIcon(item.weather[0].id)}.svg"
                class="forecast-item-img"
            />
            <h5 class="forecast-item-temp">${Math.round(
                item.main.temp
            )} &deg;C</h5>
        `;

        fragment.appendChild(forecastItem);
    });

    forecastItemsContainer.appendChild(fragment);
}
