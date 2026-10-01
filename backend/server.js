const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// ROOT API
// ===============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Weather App Backend is running!",
    version: "1.0.0"
  });
});


// ===============================
// WEATHER API
// ===============================
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,visibility,cloud_cover` +
      `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error("Weather API Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch weather data"
    });
  }
});


// ===============================
// CITY SEARCH / GEOCODING API
// ===============================
app.get("/api/search", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "City name is required"
      });
    }

    const url =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(name)}` +
      `&count=5`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Geocoding API request failed");
    }

    const data = await response.json();

    res.json({
      success: true,
      results: data.results || []
    });

  } catch (error) {
    console.error("Search API Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search city"
    });
  }
});


// ===============================
// AIR QUALITY API
// ===============================
app.get("/api/air-quality", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
      `&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Air Quality API request failed");
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error("Air Quality API Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch air quality data"
    });
  }
});


// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Weather App Backend running on port ${PORT}`);
});