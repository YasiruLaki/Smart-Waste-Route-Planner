import React, { useEffect, useState, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

interface StoredBinData {
  id: string;
  location: string;
  amount: number;
  lat: number;
  lng: number;
}

interface RouteSummary {
  distance: string;
  duration: string;
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};


const Maps_API_KEY = import.meta.env.VITE_Maps_API_KEY as string;

const DEFAULT_CENTER = { lat: 6.902146919051226, lng: 79.86086322142651 };

const DriverPortal: React.FC = () => {
  const [bins, setBins] = useState<StoredBinData[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [routePlanned, setRoutePlanned] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [driverLocation] = useState<{ lat: number; lng: number }>(
    DEFAULT_CENTER
  );
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: Maps_API_KEY,
    libraries: ["places", "geometry"],
  });

  useEffect(() => {
    try {
      const storedBins = localStorage.getItem("fullBins");
      if (storedBins) {
        const parsedBins: StoredBinData[] = JSON.parse(storedBins);
        setBins(parsedBins);
        if (parsedBins.length === 0) {
          setNotification({
            type: "info",
            message: "No bins reported yet. Waiting for submissions.",
          });
        }
      } else {
        setNotification({
          type: "info",
          message: "No bins reported yet. Waiting for submissions.",
        });
      }
    } catch (error) {
      console.error("Error parsing bins from localStorage:", error);
      setNotification({ type: "error", message: "Could not load bin data." });
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (map && bins.length > 0 && !routePlanned) {
      const bounds = new google.maps.LatLngBounds();
      bins.forEach((bin) =>
        bounds.extend(new google.maps.LatLng(bin.lat, bin.lng))
      );
      bounds.extend(driverLocation);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      } else {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(10);
      }
    }
  }, [map, bins, routePlanned, driverLocation]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const planRoute = () => {
    if (!map)
      return setNotification({ type: "error", message: "Map not ready." });
    if (bins.length === 0)
      return setNotification({
        type: "info",
        message: "No bins to plan route.",
      });

    setIsLoadingRoute(true);
    setDirectionsResponse(null);
    setRouteSummary(null);
    setNotification(null);

    const binLocations = bins.map((b) => ({ lat: b.lat, lng: b.lng }));
    const origin = driverLocation;
    const destination = binLocations[binLocations.length - 1];
    const waypoints = binLocations.slice(0, -1).map((loc) => ({
      location: new google.maps.LatLng(loc.lat, loc.lng),
      stopover: true,
    }));

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsLoadingRoute(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirectionsResponse(result);
          setRoutePlanned(true);
          let totalDistance = 0,
            totalDuration = 0;
          result.routes[0].legs.forEach((leg) => {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
          });
          setRouteSummary({
            distance: `${(totalDistance / 1000).toFixed(2)} km`,
            duration: `${Math.round(totalDuration / 60)} min`,
          });
          setNotification({
            type: "success",
            message: "Route planned successfully!",
          });
        } else {
          console.error("Route failed:", status, result);
          setNotification({
            type: "error",
            message: `Route planning failed: ${status}`,
          });
        }
      }
    );
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setRoutePlanned(false);
    setRouteSummary(null);
    setNotification({ type: "info", message: "Route cleared." });
    if (map && bins.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bins.forEach((bin) =>
        bounds.extend(new google.maps.LatLng(bin.lat, bin.lng))
      );
      bounds.extend(driverLocation);
      map.fitBounds(bounds);
    }
  };

  if (loadError)
    return (
      <div className="text-red-500 p-4">
        Map Load Error: {loadError.message}
      </div>
    );
  if (!isLoaded)
    return (
      <div className="text-center p-6 text-xl">Loading Google Maps...</div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-blue-800 mb-6">
        Driver Route Planner
      </h1>

      {notification && (
        <div
          className={`mb-4 px-4 py-3 rounded-md shadow-md text-center max-w-2xl w-full transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-200 text-green-900"
              : notification.type === "error"
              ? "bg-red-200 text-red-900"
              : "bg-blue-200 text-blue-900"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center mb-5">
        <button
          onClick={planRoute}
          disabled={isLoadingRoute || routePlanned || bins.length === 0}
          className="bg-blue-700 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-800 disabled:bg-gray-400"
        >
          {isLoadingRoute
            ? "Planning..."
            : routePlanned
            ? "Route Planned"
            : "Plan Route"}
        </button>
        {routePlanned && (
          <button
            onClick={clearRoute}
            className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700"
          >
            Clear Route
          </button>
        )}
      </div>

      {routeSummary && (
        <div className="bg-white p-5 rounded-lg shadow-md max-w-xl w-full mb-4 text-center">
          <h3 className="text-xl font-semibold text-gray-800">Route Summary</h3>
          <p className="text-gray-600 mt-2">
            Distance: <strong>{routeSummary.distance}</strong>
          </p>
          <p className="text-gray-600">
            Duration: <strong>{routeSummary.duration}</strong>
          </p>
        </div>
      )}

      <div className="w-full max-w-5xl h-[500px] rounded-lg shadow-lg border overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={DEFAULT_CENTER}
          zoom={10}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {bins.map((bin) => (
            <Marker
              key={bin.id}
              position={{ lat: bin.lat, lng: bin.lng }}
              title={`Bin: ${bin.location} - ${bin.amount} kg`}
              icon={{
                url: "https://img.icons8.com/fluency/48/waste--v1.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              label={{
                  text: `Bin `,
                  color: "#1e40af",
                  fontWeight: "bold",
                  fontSize: "16px",
                  // Set label position above the marker
                  className: "depot-label",
                }}
            />
          ))}
          {driverLocation && (
            <>
              <Marker
                position={driverLocation}
                title="Driver's Starting Location"
                icon={{
                  url: "https://img.icons8.com/plasticine/100/garage.png",
                  scaledSize: new window.google.maps.Size(60, 60),
                }}
                label={{
                  text: "Depot",
                  color: "#1e40af",
                  fontWeight: "bold",
                  fontSize: "16px",
                  // Set label position above the marker
                  className: "depot-label",
                }}
              />
              <style>
                {`
                    .depot-label {
                      transform: translateY(-30px);
                    }
                  `}
              </style>
            </>
          )}
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default DriverPortal;
