"use client";

import { EnvironmentOutlined } from "@ant-design/icons";
import { Alert, Button, Space, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

const { Text } = Typography;

type RequestLocation = {
  label?: string;
  latitude?: number;
  longitude?: number;
};

type LocationMapPreviewProps = {
  location?: RequestLocation;
};

const GOOGLE_MAPS_SCRIPT_ID = "forge-google-maps-script";
const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 };

declare global {
  interface Window {
    google?: any;
    forgeGoogleMapsReady?: () => void;
  }
}

function hasCoordinates(location?: RequestLocation) {
  return (
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number"
  );
}

function loadGoogleMapsScript(apiKey: string) {
  if (window.google?.maps) return Promise.resolve();

  const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
  if (existing) {
    return new Promise<void>((resolve) => {
      window.forgeGoogleMapsReady = () => resolve();
    });
  }

  return new Promise<void>((resolve, reject) => {
    window.forgeGoogleMapsReady = () => resolve();
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=forgeGoogleMapsReady`;
    document.head.appendChild(script);
  });
}

export function LocationMapPreview({ location }: LocationMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const coordinatesAvailable = hasCoordinates(location);

  const mapsUrl = useMemo(() => {
    if (!coordinatesAvailable) return null;
    return `https://www.google.com/maps/search/?api=1&query=${location?.latitude},${location?.longitude}`;
  }, [coordinatesAvailable, location?.latitude, location?.longitude]);

  useEffect(() => {
    if (!apiKey || !mapRef.current || !coordinatesAvailable) return;

    let cancelled = false;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.google?.maps) return;

        const center = {
          lat: location?.latitude ?? DEFAULT_CENTER.lat,
          lng: location?.longitude ?? DEFAULT_CENTER.lng,
        };

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new window.google.maps.Marker({
          map,
          position: center,
          title: location?.label || "Pinned property location",
        });
      })
      .catch((error: Error) => setMapError(error.message));

    return () => {
      cancelled = true;
    };
  }, [apiKey, coordinatesAvailable, location?.label, location?.latitude, location?.longitude]);

  return (
    <Space direction="vertical" size={10} className="full-width">
      <div className="location-map-summary">
        <EnvironmentOutlined />
        <div>
          <Text strong>{location?.label || "No address label provided"}</Text>
          <br />
          {coordinatesAvailable ? (
            <Text type="secondary">
              {location?.latitude?.toFixed(6)}, {location?.longitude?.toFixed(6)}
            </Text>
          ) : (
            <Text type="secondary">No pinned coordinates provided</Text>
          )}
        </div>
      </div>

      {coordinatesAvailable && apiKey ? (
        <div className="location-map-preview" ref={mapRef} />
      ) : null}

      {mapError ? <Alert type="warning" showIcon message={mapError} /> : null}

      {!apiKey && coordinatesAvailable ? (
        <Alert
          type="info"
          showIcon
          message="Google Maps preview is not configured"
          description="Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the dashboard environment to show the embedded map."
        />
      ) : null}

      {mapsUrl ? (
        <Button href={mapsUrl} target="_blank" rel="noreferrer">
          Open pinned location in Google Maps
        </Button>
      ) : null}
    </Space>
  );
}
