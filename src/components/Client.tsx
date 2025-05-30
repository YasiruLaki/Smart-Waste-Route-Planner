import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

interface BinData {
  id: string; // Added an ID for better list keying and potential future operations
  location: string;
  amount: number;
  lat: number;
  lng: number;
  createdAt: string;
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

const mapContainerStyle = {
  width: "100%",
  height: "350px", // Slightly taller for better interaction
};

const LIBRARIES: "places"[] = ["places"];
const Maps_API_KEY = import.meta.env.VITE_Maps_API_KEY as string;

const MAX_TRUCK_CAPACITY = 100; // in kg
const COLOMBO_COORDS = { lat: 6.9271, lng: 79.8612 };

const ClientPortal: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [bins, setBins] = useState<BinData[]>([]);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [location, setLocation] = useState("");
  const [, setIsGeocoding] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [initialCenter, setInitialCenter] = useState(COLOMBO_COORDS);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect for attempting to get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInitialCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.warn(
            "Geolocation permission denied or unavailable. Defaulting to Colombo."
          );
          setNotification({
            type: "info",
            message:
              "Could not get current location. Defaulting map to Colombo.",
          });
        }
      );
    }
  }, []);

  // Effect for loading bins from localStorage
  useEffect(() => {
    try {
      const storedBins = localStorage.getItem("fullBins");
      if (storedBins) {
        setBins(JSON.parse(storedBins));
      }
    } catch (error) {
      console.error("Failed to parse bins from localStorage:", error);
      setNotification({
        type: "error",
        message: "Could not load previously submitted bins.",
      });
    }
  }, []);

  // Effect for auto-clearing notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000); // Clear notification after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const totalAmount = bins.reduce((sum, bin) => sum + bin.amount, 0);
  const remainingCapacity = Math.max(0, MAX_TRUCK_CAPACITY - totalAmount); // Ensure it doesn't go below 0
  const capacityPercentage = (totalAmount / MAX_TRUCK_CAPACITY) * 100;

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setLatLng({ lat, lng });
      setLocation(""); // Clear previous location text

      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        setIsGeocoding(true);
        setLocation("Fetching address...");
        try {
          const results = await geocoder.geocode({ location: { lat, lng } });
          if (results && results.results.length > 0) {
            setLocation(results.results[0].formatted_address);
          } else {
            setLocation("Address not found");
          }
        } catch (error) {
          console.error("Geocoder failed:", error);
        } finally {
          setIsGeocoding(false);
        }
      } else {
        setLocation(
          `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Geocoder not ready)`
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    const amountNumber = parseFloat(amount);
    if (!amount || !latLng) {
      setNotification({
        type: "error",
        message: "Please pin a location and enter the waste amount.",
      });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setNotification({
        type: "error",
        message: "Please enter a valid positive waste amount.",
      });
      setIsSubmitting(false);
      return;
    }
    if (amountNumber > remainingCapacity) {
      setNotification({
        type: "error",
        message: `Amount exceeds remaining truck capacity of ${remainingCapacity.toFixed(
          2
        )} kg.`,
      });
      setIsSubmitting(false);
      return;
    }

    const newBin: BinData = {
      id: new Date().toISOString(), // Simple unique ID
      location:
        location ||
        `Pinned: ${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`,
      amount: amountNumber,
      lat: latLng.lat,
      lng: latLng.lng,
      createdAt: new Date().toISOString(),
    };

    const updatedBins = [...bins, newBin];
    setBins(updatedBins);
    try {
      localStorage.setItem("fullBins", JSON.stringify(updatedBins));
      setNotification({
        type: "success",
        message: "Bin details submitted successfully!",
      });
    } catch (error) {
      console.error("Failed to save bins to localStorage:", error);
      setNotification({
        type: "error",
        message: "Failed to save bin. Data might be lost on refresh.",
      });
      // Potentially revert bins state if saving fails critically, or warn user more strongly.
    }

    // Reset form
    setLocation("");
    setAmount("");
    setLatLng(null);
    if (mapInstance) {
      // Recenter map slightly if needed or zoom out
      mapInstance.panTo(initialCenter);
      mapInstance.setZoom(12);
    }
    setIsSubmitting(false);
  };

  const handleClear = () => {
    localStorage.removeItem("fullBins");
    setBins([]);
    setNotification({
      type: "info",
      message: "All submitted bin data has been cleared.",
    });
    // Also clear current form fields
    setAmount("");
    setLatLng(null);
    setLocation("");
  };

  if (!Maps_API_KEY) {
    return (
      <div className="min-h-screen bg-red-100 p-6 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">
            Configuration Error
          </h1>
          <p className="text-red-600">The Google Maps API Key is missing.</p>
          <p className="text-sm text-gray-600 mt-2">
            Please ensure the VITE_Maps_API_KEY environment variable is set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={Maps_API_KEY}
      libraries={LIBRARIES}
      loadingElement={
        <div className="text-center p-4">Loading map script...</div>
      }
    >
      <div className="min-h-screen bg-emerald-50 p-4 sm:p-6 flex flex-col items-center justify-start font-sans">
        <header className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-700">
            ♻️ Submit Full Bin Details
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6"
        >
          <div>
            <label
              htmlFor="wasteAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Waste Amount (kg)
            </label>
            <input
              id="wasteAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="e.g., 12.5"
              required
              disabled={remainingCapacity <= 0 || isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Truck Capacity Status
            </label>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${
                    capacityPercentage > 100 ? 100 : capacityPercentage
                  }%`,
                }}
              ></div>
            </div>
            <div className="text-sm text-emerald-700 font-semibold text-right">
              Available: {remainingCapacity.toFixed(2)} kg /{" "}
              {MAX_TRUCK_CAPACITY} kg
            </div>
          </div>

          {notification && (
            <div
              className={`p-3 rounded-md text-sm ${
                notification.type === "success"
                  ? "bg-green-100 text-green-700"
                  : notification.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {notification.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pin Bin Location
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Click on the map to select your bin's location. The map will
              attempt to center on your current location.
            </p>
            <div className="rounded-md overflow-hidden border border-gray-300">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={initialCenter}
                zoom={latLng ? 17 : 12} // Zoom in more when a location is pinned
                onClick={handleMapClick}
                onLoad={handleMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {latLng && <Marker position={latLng} />}
              </GoogleMap>
            </div>
            {latLng && (
              <p className="mt-2 text-sm text-emerald-700">
                <span className="font-semibold">📍 Pinned:</span>{" "}
                {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={remainingCapacity <= 0 || isSubmitting || !latLng}
              className={`w-full sm:flex-1 py-2.5 px-4 rounded-md text-white font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  remainingCapacity > 0 && latLng
                    ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Bin Details"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting}
              className="w-full sm:flex-1 bg-red-500 text-white py-2.5 px-4 rounded-md font-semibold hover:bg-red-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              Clear All Submissions
            </button>
          </div>
        </form>

        <div className="w-full max-w-lg mt-10">
          <h2 className="text-2xl font-semibold text-emerald-700 mb-4">
            📋 Submitted Bins ({bins.length})
          </h2>
          {bins.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded-md shadow">
              No bins submitted yet. Be the first!
            </p>
          ) : (
            <ul className="space-y-3">
              {bins.map((bin) => (
                <li
                  key={bin.id}
                  className="p-4 bg-white rounded-lg shadow-md text-gray-800 border-l-4 border-emerald-500"
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-emerald-600">
                      📍 Lat: {bin.lat.toFixed(5)}, Lng: {bin.lng.toFixed(5)}
                    </strong>
                    <span className="text-sm text-gray-500">
                      {new Date(bin.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {/* <p className="mt-1 text-gray-700">{bin.location}</p> */}
                  <p className="mt-1 font-semibold">
                    ♻️ Waste: {bin.amount} kg
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="text-center text-gray-500 text-xs mt-12 pb-6">
          <p>
            &copy; {new Date().getFullYear()} Waste Management Portal. All
            rights reserved.
          </p>
        </footer>
      </div>
    </LoadScript>
  );
};

export default ClientPortal;
