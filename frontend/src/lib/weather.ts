export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
  time: string;
}

export const AUSTRALIAN_STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  QLD: { lat: -27.9547, lon: 153.3773 }, // Parkwood / Gold Coast / Brisbane
  NSW: { lat: -33.8688, lon: 151.2093 }, // Sydney
  VIC: { lat: -37.8136, lon: 144.9631 }, // Melbourne
  WA: { lat: -31.9505, lon: 115.8605 }, // Perth
  SA: { lat: -34.9285, lon: 138.6007 }, // Adelaide
  TAS: { lat: -42.8821, lon: 147.3272 }, // Hobart
  ACT: { lat: -35.2809, lon: 149.1300 }, // Canberra
  NT: { lat: -12.4634, lon: 130.8456 }, // Darwin
  OTHER: { lat: -37.8136, lon: 144.9631 },
};

export function getWeatherDescription(code: number): string {
  switch (code) {
    case 0:
      return "Clear Sky";
    case 1:
      return "Mainly Clear";
    case 2:
      return "Partly Cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Foggy";
    case 51:
    case 53:
    case 55:
      return "Light Drizzle";
    case 56:
    case 57:
      return "Freezing Drizzle";
    case 61:
    case 63:
    case 65:
      return "Rain";
    case 66:
    case 67:
      return "Freezing Rain";
    case 71:
    case 73:
    case 75:
      return "Snowfall";
    case 77:
      return "Snow Grains";
    case 80:
    case 81:
    case 82:
      return "Rain Showers";
    case 85:
    case 86:
      return "Snow Showers";
    case 95:
      return "Thunderstorm";
    case 96:
    case 99:
      return "Thunderstorm / Hail";
    default:
      return "Fair";
  }
}

export async function fetchLocalWeather(
  lat: number | null | undefined,
  lon: number | null | undefined,
  state = "QLD"
): Promise<WeatherData | null> {
  try {
    let resolvedLat = lat;
    let resolvedLon = lon;

    if (resolvedLat == null || resolvedLon == null) {
      const fallback = AUSTRALIAN_STATE_COORDS[state] || AUSTRALIAN_STATE_COORDS.QLD;
      resolvedLat = fallback.lat;
      resolvedLon = fallback.lon;
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat.toFixed(4)}&longitude=${resolvedLon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const curr = data?.current;
    if (!curr) return null;

    return {
      temperature: Math.round(curr.temperature_2m * 10) / 10,
      feelsLike: Math.round(curr.apparent_temperature * 10) / 10,
      humidity: Math.round(curr.relative_humidity_2m),
      windSpeed: Math.round(curr.wind_speed_10m),
      weatherCode: curr.weather_code,
      description: getWeatherDescription(curr.weather_code),
      isDay: Boolean(curr.is_day),
      time: curr.time,
    };
  } catch (err) {
    console.warn("Failed to fetch local weather:", err);
    return null;
  }
}
