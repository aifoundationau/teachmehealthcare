"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Compass,
  Check,
  Globe2,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  GeoSettings,
  saveStoredGeoSettings,
  reverseGeocodeCoords,
  formatDateTime
} from "@/lib/geoSettings";

interface GeolocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeoSettings;
  onSettingsChange: (newSettings: GeoSettings) => void;
}

const AUSTRALIAN_STATES = [
  { code: "VIC", name: "Victoria" },
  { code: "NSW", name: "New South Wales" },
  { code: "QLD", name: "Queensland" },
  { code: "WA", name: "Western Australia" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
  { code: "OTHER", name: "International / Other" },
];

const TIMEZONES = [
  { value: "Australia/Melbourne", label: "Melbourne, Sydney, Canberra (AEST / AEDT)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST - No DST)" },
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

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);

  // Start from the current settings each time the dialog opens (and drop cancelled edits).
  React.useEffect(() => {
    if (!isOpen) return;
    setSuburb(settings.suburb);
    setState(settings.state);
    setPostcode(settings.postcode);
    setCountry(settings.country);
    setTimezone(settings.timezone);
    setDateFormat(settings.dateFormat);
    setTimeFormat(settings.timeFormat);
    setDetectStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    latitude: settings.latitude,
    longitude: settings.longitude,
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
          setDetectStatus("Looking up closest suburb...");

          const geo = await reverseGeocodeCoords(lat, lon);
          setSuburb(geo.suburb);
          setState(geo.state);
          setPostcode(geo.postcode);
          setCountry(geo.country);

          // Guess timezone from state
          if (["VIC", "NSW", "TAS", "ACT"].includes(geo.state)) {
            setTimezone("Australia/Melbourne");
          } else if (geo.state === "QLD") {
            setTimezone("Australia/Brisbane");
          } else if (geo.state === "SA") {
            setTimezone("Australia/Adelaide");
          } else if (geo.state === "WA") {
            setTimezone("Australia/Perth");
          } else if (geo.state === "NT") {
            setTimezone("Australia/Darwin");
          }

          setDetectStatus(`Detected: ${geo.suburb}, ${geo.state}`);
        } catch (err: any) {
          setDetectStatus("Could not reverse lookup suburb.");
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        setDetectStatus(`Location error: ${err.message}. You can enter your suburb manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = () => {
    const updated: GeoSettings = {
      suburb: suburb.trim() || "Melbourne",
      state,
      postcode: postcode.trim() || "3000",
      country,
      timezone,
      dateFormat,
      timeFormat,
      latitude: settings.latitude,
      longitude: settings.longitude,
    };
    saveStoredGeoSettings(updated);
    onSettingsChange(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#121a24] border border-[#253346] rounded-xl shadow-2xl overflow-hidden text-gray-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#182230]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Location & Regional Settings</h2>
              <p className="text-[11px] text-gray-400">
                Configure your suburb, state, timezone, and date/time display
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#253346] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* Geolocation Detection Card */}
          <div className="p-3 bg-[#182230] border border-[#253346] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Auto-Detect Closest Suburb</span>
                <span className="text-[11px] text-gray-400">
                  Uses device GPS and reverse geocoding
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Detect Location</span>
                </>
              )}
            </button>
          </div>

          {detectStatus && (
            <p className="text-[11px] text-blue-300 bg-blue-950/40 p-2 rounded border border-blue-800/40">
              {detectStatus}
            </p>
          )}

          {/* Suburb & State manual configuration */}
          <div className="space-y-3 p-3 bg-[#182230]/70 border border-[#253346] rounded-lg">
            <h3 className="font-semibold text-white flex items-center gap-1.5 border-b border-[#253346] pb-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Closest Suburb & State
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">
                  Closest Suburb <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="e.g. Richmond / Carlton / Parramatta"
                  className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">
                  State / Territory <span className="text-red-400">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {AUSTRALIAN_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Postcode</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="3000"
                  className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Timezone & Date/Time Settings */}
          <div className="space-y-3 p-3 bg-[#182230]/70 border border-[#253346] rounded-lg">
            <h3 className="font-semibold text-white flex items-center gap-1.5 border-b border-[#253346] pb-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Date, Time & Timezone Settings
            </h3>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">Application Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value as any)}
                  className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Australian Standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Time Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeFormat("12h")}
                    className={`py-1.5 rounded text-xs font-medium border transition-colors ${
                      timeFormat === "12h"
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-[#121a24] text-gray-300 border-[#253346] hover:border-gray-500"
                    }`}
                  >
                    12-Hour (AM/PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFormat("24h")}
                    className={`py-1.5 rounded text-xs font-medium border transition-colors ${
                      timeFormat === "24h"
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-[#121a24] text-gray-300 border-[#253346] hover:border-gray-500"
                    }`}
                  >
                    24-Hour
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="mt-3 p-2.5 bg-[#0d131d] border border-[#253346] rounded text-[11px] space-y-1">
              <span className="text-gray-400 block text-[10px]">Live Date/Time Preview:</span>
              <div className="font-mono text-emerald-400 font-medium">
                {formatDateTime(new Date(), currentPreviewSettings)}
              </div>
              <span className="text-gray-500 text-[10px] block">
                Region: {suburb || "Melbourne"}, {state} ({timezone})
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d131d] border-t border-[#1e293b] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#182230] hover:bg-[#253346] text-gray-300 rounded text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
