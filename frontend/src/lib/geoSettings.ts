export interface GeoSettings {
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  latitude: number | null;
  longitude: number | null;
}

export const DEFAULT_GEO_SETTINGS: GeoSettings = {
  suburb: "Melbourne",
  state: "VIC",
  postcode: "3000",
  country: "Australia",
  timezone: "Australia/Melbourne",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  latitude: -37.8136,
  longitude: 144.9631,
};

const STORAGE_KEY = "tmh_geo_settings";

export function getStoredGeoSettings(): GeoSettings {
  if (typeof window === "undefined") return DEFAULT_GEO_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GEO_SETTINGS, ...JSON.parse(raw) };
    }
    // Auto-detect browser timezone if possible
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return { ...DEFAULT_GEO_SETTINGS, timezone: browserTz || DEFAULT_GEO_SETTINGS.timezone };
  } catch {
    return DEFAULT_GEO_SETTINGS;
  }
}

export function saveStoredGeoSettings(settings: GeoSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("geoSettingsChanged"));
  } catch (err) {
    console.error("Failed to save geo settings:", err);
  }
}

/**
 * Format a Date object according to user preferences
 */
export function formatDateTime(
  date: Date | string | number,
  settings: GeoSettings,
  includeTime = true
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  try {
    const tz = settings.timezone || "Australia/Melbourne";

    // Format Date part
    let datePart = "";
    const day = d.toLocaleDateString("en-AU", { day: "2-digit", timeZone: tz });
    const month = d.toLocaleDateString("en-AU", { month: "2-digit", timeZone: tz });
    const year = d.toLocaleDateString("en-AU", { year: "numeric", timeZone: tz });

    if (settings.dateFormat === "MM/DD/YYYY") {
      datePart = `${month}/${day}/${year}`;
    } else if (settings.dateFormat === "YYYY-MM-DD") {
      datePart = `${year}-${month}-${day}`;
    } else {
      datePart = `${day}/${month}/${year}`;
    }

    if (!includeTime) return datePart;

    // Format Time part
    const is12h = settings.timeFormat === "12h";
    const timePart = d.toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      hour12: is12h,
      timeZone: tz,
    });

    return `${datePart} ${timePart}`;
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Reverse geocode latitude & longitude to Australian suburb & state
 */
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<{
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "TeachMeHealth-LMS-App/1.0",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const suburb =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.city_district ||
        addr.town ||
        addr.city ||
        "Melbourne";
      const state = addr.state || "VIC";
      const postcode = addr.postcode || "3000";
      const country = addr.country || "Australia";

      // Shorten Australian state if spelled out
      let stateCode = state;
      if (state.toLowerCase().includes("victoria")) stateCode = "VIC";
      else if (state.toLowerCase().includes("new south wales")) stateCode = "NSW";
      else if (state.toLowerCase().includes("queensland")) stateCode = "QLD";
      else if (state.toLowerCase().includes("western australia")) stateCode = "WA";
      else if (state.toLowerCase().includes("south australia")) stateCode = "SA";
      else if (state.toLowerCase().includes("tasmania")) stateCode = "TAS";
      else if (state.toLowerCase().includes("australian capital territory")) stateCode = "ACT";
      else if (state.toLowerCase().includes("northern territory")) stateCode = "NT";

      return { suburb, state: stateCode, postcode, country };
    }
  } catch (err) {
    console.warn("Reverse geocode warning:", err);
  }

  return {
    suburb: "Melbourne",
    state: "VIC",
    postcode: "3000",
    country: "Australia",
  };
}
