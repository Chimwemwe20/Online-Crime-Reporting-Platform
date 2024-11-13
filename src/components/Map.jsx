import React, { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { MapPin, X, Crosshair, Search } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const DEFAULT_VIEWPORT = {
  latitude: 40.7128,
  longitude: -74.0060,
  zoom: 12
};

const MapComponent = ({ onLocationSelect, onClose, initialLocation, readOnly = false }) => {
const [viewport, setViewport] = useState(() => {
  if (initialLocation && typeof initialLocation === 'string') {
    const [lat, lng] = initialLocation.split(',').map(coord => {
      const num = parseFloat(coord);
      return !isNaN(num) ? num : null;
    });
    if (lat !== null && lng !== null) {
      return { latitude: lat, longitude: lng, zoom: 14 };
    }
  }
  return DEFAULT_VIEWPORT;
});

const [marker, setMarker] = useState(() => {
  if (initialLocation && typeof initialLocation === 'string') {
    const [lat, lng] = initialLocation.split(',').map(coord => {
      const num = parseFloat(coord);
      return !isNaN(num) ? num : null;
    });
    if (lat !== null && lng !== null) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
});


  const [searchQuery, setSearchQuery] = useState('');

  const handleMapClick = useCallback((event) => {
    if (readOnly) return;
    const { lat, lng } = event.lngLat;
    if (!isNaN(lat) && !isNaN(lng)) {
      setMarker({ latitude: lat, longitude: lng });
    }
  }, [readOnly]);

  const handleConfirmLocation = useCallback(() => {
    if (marker && !isNaN(marker.latitude) && !isNaN(marker.longitude)) {
      const locationString = `${marker.latitude.toFixed(6)},${marker.longitude.toFixed(6)}`;
      onLocationSelect(locationString);
      onClose();
    }
  }, [marker, onLocationSelect, onClose]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      
      if (!response.ok) throw new Error('Geocoding request failed');
      
      const data = await response.json();
      if (data.features?.[0]) {
        const [lng, lat] = data.features[0].center;
        if (!isNaN(lat) && !isNaN(lng)) {
          setViewport({
            ...viewport,
            latitude: lat,
            longitude: lng,
            zoom: 14,
          });
          setMarker({ latitude: lat, longitude: lng });
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const centerOnUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!isNaN(latitude) && !isNaN(longitude)) {
            setViewport({
              latitude,
              longitude,
              zoom: 14
            });
            setMarker({ latitude, longitude });
          }
        },
        (error) => console.error('Error getting location:', error),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className={`${readOnly ? '' : 'fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm'}`}>
      <div className={`${readOnly ? 'h-[300px]' : 'absolute inset-4 sm:inset-6 md:inset-8'} bg-white rounded-xl shadow-2xl flex flex-col`}>
        {!readOnly && (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-2 border-b">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search location..."
                    className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={centerOnUserLocation}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Use current location"
                >
                  <Crosshair className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}

        <div className="flex-1 relative">
          {viewport && (
            <Map
              {...viewport}
              onMove={evt => setViewport(evt.viewState)}
              onClick={handleMapClick}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />
              
              {marker && !isNaN(marker.latitude) && !isNaN(marker.longitude) && (
                <Marker
                  latitude={marker.latitude}
                  longitude={marker.longitude}
                  anchor="bottom"
                >
                  <MapPin className="w-6 h-6 text-red-500" />
                </Marker>
              )}
            </Map>
          )}

          {!readOnly && marker && (
            <div className="absolute bottom-20 left-4 right-4 mx-auto max-w-md bg-white/95 backdrop-blur 
                          p-3 rounded-lg shadow-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700">Selected Location:</p>
              <p className="font-mono text-sm text-gray-600">
                {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click anywhere on the map to update the location
              </p>
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="px-4 py-3 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg
                       hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLocation}
              disabled={!marker || isNaN(marker.latitude) || isNaN(marker.longitude)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              Confirm Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;