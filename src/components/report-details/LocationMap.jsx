import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export function LocationMap({ location }) {
  const [map, setMap] = useState(null);
  
  const coordinates = location?.includes(',') 
    ? location.split(',').map(coord => parseFloat(coord.trim()))
    : null;

  useEffect(() => {
    if (coordinates?.length === 2) {
      const [latitude, longitude] = coordinates;
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

      const newMap = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude],
        zoom: 13
      });

      new mapboxgl.Marker()
        .setLngLat([longitude, latitude])
        .addTo(newMap);

      setMap(newMap);

      return () => newMap.remove();
    }
  }, [coordinates]);

  if (!coordinates || coordinates.length !== 2) return null;

  return <div id="map" className="h-[400px] rounded-lg" />;
}