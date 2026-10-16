"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Clock,
  Compass,
  Check,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
} from "lucide-react";
import {
  GeoSettings,
  saveStoredGeoSettings,
  reverseGeocodeCoords,
  formatDateTime,
} from "@/lib/geoSettings";
import {
  WeatherData,
  fetchLocalWeather,
  AUSTRALIAN_STATE_COORDS,
} from "@/lib/weather";

interface GeolocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeoSettings;
  onSettingsChange: (newSettings: GeoSettings) => void;
}

const AUSTRALIAN_STATES = [
  { code: "QLD", name: "Queensland" },
  { code: "NSW", name: "New South Wales" },
  { code: "VIC", name: "Victoria" },
  { code: "WA", name: "Western Australia" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
  { code: "OTHER", name: "International / Other" },
];

const TIMEZONES = [
  { value: "Australia/Brisbane", label: "Brisbane, Gold Coast (AEST - No DST)" },
  { value: "Australia/Melbourne", label: "Melbourne, Sydney, Canberra (AEST / AEDT)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST / ACDT)" },
  { value: "Australia/Darwin", label: "Darwin (ACST - No DST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Australia/Hobart", label: "Hobart (AEST / AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland, Wellington (NZST / NZDT)" },
  { value: "UTC", label: "UTC / GMT (Universal Coordinated Time)" },
  { value: "America/New_York", label: "New York (EST / EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST / PDT)" },
  { value: "Europe/London", label: "London (GMT / BST)" },
];

function WeatherIcon({
  code,
  isDay,
  className = "w-6 h-6",
}: {
  code: number;
  isDay: boolean;
  className?: string;
}) {
  if (code === 0) {
    return isDay ? (
      <Sun className={`${className} text-amber-400`} />
    ) : (
      <Moon className={`${className} text-indigo-300`} />
    );
  }
  if (code <= 2) {
    return isDay ? (
      <CloudSun className={`${className} text-amber-300`} />
    ) : (
      <Cloud className={`${className} text-slate-300`} />
    );
  }
  if (code === 3) {
    return <Cloud className={`${className} text-slate-400`} />;
  }
  if (code === 45 || code === 48) {
    return <CloudFog className={`${className} text-slate-300`} />;
  }
  if (code >= 51 && code <= 57) {
    return <CloudDrizzle className={`${className} text-cyan-400`} />;
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return <CloudRain className={`${className} text-blue-400`} />;
  }
  if (code >= 71 && code <= 77) {
    return <CloudSnow className={`${className} text-sky-200`} />;
  }
  if (code >= 95) {
    return <CloudLightning className={`${className} text-amber-400`} />;
  }
  return isDay ? (
    <Sun className={`${className} text-amber-400`} />
  ) : (
    <Moon className={`${className} text-indigo-300`} />
  );
}

export default function GeolocationModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: GeolocationModalProps) {
  const [suburb, setSuburb] = useState(settings.suburb);
  const [state, setState] = useState(settings.state);
  const [postcode, setPostcode] = useState(settings.postcode);
  const [country, setCountry] = useState(settings.country);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [dateFormat, setDateFormat] = useState<"DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD">(
    settings.dateFormat
  );
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">(settings.timeFormat);
  const [latitude, setLatitude] = useState<number | null>(settings.latitude);
  const [longitude, setLongitude] = useState<number | null>(settings.longitude);

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Live clock state for real-time preview
  const [previewTime, setPreviewTime] = useState<Date>(new Date());

  const loadWeather = useCallback(async (lat: number | null, lon: number | null, st: string) => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchLocalWeather(lat, lon, st);
      setWeather(data);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Sync state and load initial weather whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    setSuburb(settings.suburb);
    setState(settings.state);
    setPostcode(settings.postcode);
    setCountry(settings.country);
    setTimezone(settings.timezone);
    setDateFormat(settings.dateFormat);
    setTimeFormat(settings.timeFormat);
    setLatitude(settings.latitude);
    setLongitude(settings.longitude);
    setDetectStatus(null);

    loadWeather(settings.latitude, settings.longitude, settings.state);
  }, [isOpen, settings, loadWeather]);

  // Live timer for modal clock preview
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPreviewTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPreviewSettings: GeoSettings = {
    suburb,
    state,
    postcode,
    country,
    timezone,
    dateFormat,
    timeFormat,
    latitude,
    longitude,
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    // Align timezone with selected Australian state
    if (newState === "QLD") {
      setTimezone("Australia/Brisbane");
    } else if (["VIC", "NSW", "TAS", "ACT"].includes(newState)) {
      setTimezone("Australia/Melbourne");
    } else if (newState === "SA") {
      setTimezone("Australia/Adelaide");
    } else if (newState === "WA") {
      setTimezone("Australia/Perth");
    } else if (newState === "NT") {
      setTimezone("Australia/Darwin");
    }

    // Refresh weather with state coordinate defaults
    const stateCoords = AUSTRALIAN_STATE_COORDS[newState];
    if (stateCoords) {
      setLatitude(stateCoords.lat);
      setLongitude(stateCoords.lon);
      loadWeather(stateCoords.lat, stateCoords.lon, newState);
    } else {
      loadWeather(latitude, longitude, newState);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectStatus("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetecting(true);
    setDetectStatus("Detecting GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setDetectStatus("Looking up closest suburb...");

          const geo = await reverseGeocodeCoords(lat, lon);
          setSuburb(geo.suburb);
          setState(geo.state);
          setPostcode(geo.postcode);
          setCountry(geo.country);

          let detectedTz = "Australia/Brisbane";
          if (["VIC", "NSW", "TAS", "ACT"].includes(geo.state)) {
            detectedTz = "Australia/Melbourne";
          } else if (geo.state === "QLD") {
            detectedTz = "Australia/Brisbane";
          } else if (geo.state === "SA") {
            detectedTz = "Australia/Adelaide";
          } else if (geo.state === "WA") {
            detectedTz = "Australia/Perth";
          } else if (geo.state === "NT") {
            detectedTz = "Australia/Darwin";
          }
          setTimezone(detectedTz);

          setDetectStatus(`Detected: ${geo.suburb}, ${geo.state}`);
          loadWeather(lat, lon, geo.state);
        } catch {
          setDetectStatus("Could not reverse lookup suburb.");
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        setDetectStatus(`Location error: ${err.message}. Manual entry available.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = () => {
    const updated: GeoSettings = {
      suburb: suburb.trim() || "Parkwood",
      state,
      postcode: postcode.trim() || "4214",
      country,
      timezone,
      dateFormat,
      timeFormat,
      latitude,
      longitude,
    };
    saveStoredGeoSettings(updated);
    onSettingsChange(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Modal Card - Zero scrollbar, strictly centered, responsive 2-column layout */}
      <div className="relative w-full max-w-2xl lg:max-w-3xl bg-[#0f1622] border border-[#223348] rounded-2xl shadow-2xl overflow-hidden text-gray-200 flex flex-col select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1b2637] bg-[#141d2c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Regional Geotag & Settings
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[9px] font-mono font-semibold text-cyan-300 uppercase">
                  {suburb || "Parkwood"}, {state}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-tight">
                Live local weather, regional suburb geotag, timezone & synchronized clinic clock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f2d42] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - 2 Column Balanced Grid, fits standard viewports without vertical scrolling */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Left Column: Location & Local Weather */}
          <div className="flex flex-col gap-3">
            
            {/* Auto-Detect Device Bar */}
            <div className="p-2.5 bg-[#141e2d] border border-[#223348] rounded-xl flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-white text-[11px] block leading-tight">
                    GPS Auto-Detect
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate">
                    Query device sensors & reverse geocode
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="px-2.5 py-1.2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow shrink-0 disabled:opacity-50"
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Locate Me</span>
                  </>
                )}
              </button>
            </div>

            {detectStatus && (
              <div className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/60 leading-tight">
                {detectStatus}
              </div>
            )}

            {/* Suburb & State inputs */}
            <div className="p-3 bg-[#141e2d]/80 border border-[#223348] rounded-xl space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    Closest Suburb <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    placeholder="e.g. Parkwood"
                    className="w-full bg-[#0c121b] border border-[#26374d] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    State / Territory <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full bg-[#0c121b] border border-[#26374d] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {AUSTRALIAN_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="4214"
                    className="w-full bg-[#0c121b] border border-[#26374d] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#0c121b] border border-[#26374d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* LIVE LOCAL WEATHER CARD */}
            <div className="p-3 bg-gradient-to-br from-[#121d2d] to-[#0d1521] border border-cyan-800/40 rounded-xl shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                    Local Weather
                  </span>
                  <span className="text-[10px] text-cyan-400 font-medium">
                    ({suburb || "Parkwood"}, {state})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => loadWeather(latitude, longitude, state)}
                  disabled={isWeatherLoading}
                  className="text-gray-400 hover:text-cyan-400 transition-colors p-0.5"
                  title="Refresh weather"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isWeatherLoading ? "animate-spin text-cyan-400" : ""}`}
                  />
                </button>
              </div>

              {weather ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <WeatherIcon
                        code={weather.weatherCode}
                        isDay={weather.isDay}
                        className="w-7 h-7"
                      />
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                            {weather.temperature}°C
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Feels {weather.feelsLike}°C
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-cyan-300 block leading-none">
                          {weather.description}
                        </span>
                      </div>
                    </div>

                    <div className="px-2 py-1 rounded bg-[#0b121b]/80 border border-[#223145] text-right font-mono text-[9px] text-gray-400">
                      <span>Updated</span>
                      <div className="text-gray-300">
                        {weather.time.includes("T") ? weather.time.split("T")[1] : "Live"}
                      </div>
                    </div>
                  </div>

                  {/* Weather Metrics strip */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#1b283b] text-[10px]">
                    <div className="flex items-center gap-1 text-gray-400 bg-[#0c1420]/60 px-2 py-1 rounded">
                      <Thermometer className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{weather.feelsLike}°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 bg-[#0c1420]/60 px-2 py-1 rounded">
                      <Droplets className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{weather.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 bg-[#0c1420]/60 px-2 py-1 rounded">
                      <Wind className="w-3 h-3 text-teal-400 shrink-0" />
                      <span>{weather.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-3 flex items-center justify-center gap-2 text-gray-400 text-[11px]">
                  {isWeatherLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Fetching regional weather...</span>
                    </>
                  ) : (
                    <span>Weather service unavailable for this coordinate.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Timezone, Date/Time & Synchronized Clinic Clock */}
          <div className="flex flex-col gap-3">
            
            {/* Timezone settings card */}
            <div className="p-3 bg-[#141e2d]/80 border border-[#223348] rounded-xl space-y-2.5">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                  Healthcare LMS Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#0c121b] border border-[#26374d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    Date Format
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as any)}
                    className="w-full bg-[#0c121b] border border-[#26374d] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (AU/UK)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                    Time Format
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTimeFormat("12h")}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        timeFormat === "12h"
                          ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                          : "bg-[#0c121b] text-gray-400 border-[#26374d] hover:border-gray-500"
                      }`}
                    >
                      12h AM/PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeFormat("24h")}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        timeFormat === "24h"
                          ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                          : "bg-[#0c121b] text-gray-400 border-[#26374d] hover:border-gray-500"
                      }`}
                    >
                      24h Military
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Synchronized Digital Clock & Preview Badge */}
            <div className="p-3 bg-[#141e2d]/90 border border-cyan-900/50 rounded-xl space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Synchronized Regional Clock
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  SYNCED
                </span>
              </div>

              <div className="p-2.5 bg-[#0b1018] border border-[#1f2d40] rounded-lg">
                <div className="font-mono text-lg sm:text-xl text-emerald-400 font-bold tracking-tight text-center">
                  {formatDateTime(previewTime, currentPreviewSettings, true)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 border-t border-[#182332] pt-1">
                  <span>Zone: {timezone.split("/")[1]?.replace("_", " ") || timezone}</span>
                  <span>{state} Standard</span>
                </div>
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="text-[10px] text-gray-400 bg-[#0d1420]/60 p-2 rounded-lg border border-[#1b2637] leading-relaxed">
              <span className="text-gray-300 font-medium">Healthcare Context:</span> Clinical case studies, caseroom timestamps, and DICOM series telemetry automatically align with your selected regional geotag.
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#0c131e] border-t border-[#1b2637] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#141d2c] hover:bg-[#1c293c] text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-[#223348]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Geotag
          </button>
        </div>

      </div>
    </div>
  );
}
