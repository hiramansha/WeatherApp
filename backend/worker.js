const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);

  // ===============================
  // ROOT API
  // ===============================
  if (url.pathname === "/") {
    return jsonResponse({
      success: true,
      message: "Weather App Backend is running!",
      version: "1.0.0",
    });
  }

  // ===============================
  // WEATHER API
  // ===============================
  if (url.pathname === "/api/weather") {
    try {
      const lat = url.searchParams.get("lat");
      const lon = url.searchParams.get("lon");

      if (!lat || !lon) {
        return jsonResponse(
          {
            success: false,
            message: "Latitude and longitude are required",
          },
          400
        );
      }

      const apiUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,visibility,cloud_cover` +
        `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
        `&timezone=auto` +
        `&forecast_days=7`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Weather API request failed");
      }

      const data = await response.json();

      return jsonResponse({
        success: true,
        data: data,
      });
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: "Failed to fetch weather data",
        },
        500
      );
    }
  }

  // ===============================
  // CITY SEARCH API
  // ===============================
  if (url.pathname === "/api/search") {
    try {
      const name = url.searchParams.get("name");

      if (!name) {
        return jsonResponse(
          {
            success: false,
            message: "City name is required",
          },
          400
        );
      }

      const apiUrl =
        `https://geocoding-api.open-meteo.com/v1/search` +
        `?name=${encodeURIComponent(name)}` +
        `&count=5`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Geocoding API request failed");
      }

      const data = await response.json();

      return jsonResponse({
        success: true,
        results: data.results || [],
      });
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: "Failed to search city",
        },
        500
      );
    }
  }

  // ===============================
  // AIR QUALITY API
  // ===============================
  if (url.pathname === "/api/air-quality") {
    try {
      const lat = url.searchParams.get("lat");
      const lon = url.searchParams.get("lon");

      if (!lat || !lon) {
        return jsonResponse(
          {
            success: false,
            message: "Latitude and longitude are required",
          },
          400
        );
      }

      const apiUrl =
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
        `&timezone=auto`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Air Quality API request failed");
      }

      const data = await response.json();

      return jsonResponse({
        success: true,
        data: data,
      });
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: "Failed to fetch air quality data",
        },
        500
      );
    }
  }

  return jsonResponse(
    {
      success: false,
      message: "Route not found",
    },
    404
  );
}

export default {
  fetch: handleRequest,
};
