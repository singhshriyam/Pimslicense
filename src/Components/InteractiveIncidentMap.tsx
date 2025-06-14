// Fixed InteractiveIncidentMap.tsx - Corrected map initialization and simplified code
import React, { useEffect, useRef } from 'react';
import { type Incident } from '../app/(MainBody)/services/incidentService';

interface InteractiveIncidentMapProps {
  incidents: Incident[];
  onPinClick?: (incident: Incident) => void;
  height?: string;
}

const InteractiveIncidentMap: React.FC<InteractiveIncidentMapProps> = ({
  incidents,
  onPinClick,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || !window.L) return;

      try {
        // Check if map is already initialized and clean up properly
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (error) {
            console.warn('Error removing existing map:', error);
          }
          mapInstanceRef.current = null;
        }

        // Clear any existing Leaflet data from the container
        if ((mapRef.current as any)._leaflet_id) {
          (mapRef.current as any)._leaflet_id = null;
        }

        // Clear the container content
        mapRef.current.innerHTML = '';

        // Small delay to ensure cleanup is complete
        setTimeout(() => {
          if (!mapRef.current || !window.L) return;

          try {
            // Create map centered on London
            const map = window.L.map(mapRef.current, {
              center: [51.5074, -0.1278], // London coordinates
              zoom: 10,
              zoomControl: true,
              scrollWheelZoom: true
            });

            // Add OpenStreetMap tiles
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 18
            }).addTo(map);

            mapInstanceRef.current = map;
            updateMarkers();
          } catch (error) {
            console.error('Error creating map:', error);
          }
        }, 100);

      } catch (error) {
        console.error('Error in map initialization:', error);
      }
    };

    // Load Leaflet JS if not already loaded
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = initMap;
      script.onerror = () => console.error('Failed to load Leaflet');
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Simplified updateMarkers function
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !incidents.length) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          mapInstanceRef.current.removeLayer(marker);
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      markersRef.current = [];

      const bounds: [number, number][] = [];
      let hasValidCoordinates = false;

      incidents.forEach((incident) => {
        // Only use real GPS coordinates - no fallback positions
        if (incident.latitude && incident.longitude) {
          const lat = parseFloat(incident.latitude);
          const lng = parseFloat(incident.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            const position: [number, number] = [lat, lng];
            hasValidCoordinates = true;

            try {
              // Create more prominent custom icon
              const iconHtml = `
                <div style="
                  width: 24px;
                  height: 24px;
                  background-color: ${getPinColor(incident.priority)};
                  border: 4px solid white;
                  border-radius: 50%;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                  cursor: pointer;
                  position: relative;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 10px;
                    height: 10px;
                    background: #28a745;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `;

              const customIcon = window.L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });

              // Create marker
              const marker = window.L.marker(position, { icon: customIcon }).addTo(mapInstanceRef.current);

              // Simplified popup content
              const popupContent = `
                <div style="max-width: 250px; font-family: sans-serif;">
                  <h6 style="margin: 0 0 8px 0; color: #007bff; font-size: 14px; font-weight: 600;">${incident.number}</h6>
                  <p style="margin: 0 0 6px 0; font-weight: 500; font-size: 13px;">${incident.shortDescription}</p>
                  <div style="font-size: 12px; color: #6c757d;">
                    <div><strong>Category:</strong> ${incident.category}</div>
                    <div><strong>Status:</strong> ${incident.status}</div>
                    <div><strong>Priority:</strong> ${incident.priority}</div>
                    <div><strong>Caller:</strong> ${incident.caller}</div>
                    ${incident.address ? `<div><strong>Address:</strong> ${incident.address}</div>` : ''}
                    <div style="color: #28a745; margin-top: 6px;">📍 GPS Located</div>
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent);

              // Add click event
              marker.on('click', () => {
                if (onPinClick) {
                  onPinClick(incident);
                }
              });

              markersRef.current.push(marker);
              bounds.push(position);
            } catch (error) {
              console.warn('Error creating marker for incident:', incident.number, error);
            }
          }
        }
      });

      // Fit map to show all markers if we have valid coordinates
      if (hasValidCoordinates && bounds.length > 0) {
        try {
          const group = window.L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));

          // Don't zoom in too much for a single marker
          if (bounds.length === 1) {
            const currentZoom = mapInstanceRef.current.getZoom();
            if (currentZoom > 15) {
              mapInstanceRef.current.setZoom(10);
            }
          }
        } catch (error) {
          console.warn('Error fitting bounds:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateMarkers:', error);
    }
  };

  // Update markers when incidents change
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Add a small delay to ensure map is fully initialized
      setTimeout(() => {
        updateMarkers();
      }, 200);
    }
  }, [incidents]);

  // Simplified pin color function
  const getPinColor = (priority: string): string => {
    const priorityLower = priority?.toLowerCase() || '';
    if (priorityLower.includes('high') || priorityLower.includes('critical')) return '#dc3545';
    if (priorityLower.includes('medium') || priorityLower.includes('moderate')) return '#ffc107';
    if (priorityLower.includes('low')) return '#28a745';
    return '#007bff';
  };

  return (
    <div style={{ position: 'relative', height, borderRadius: '8px', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Simplified Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px' }}>
          Only GPS-located incidents shown
        </div>
      </div>
    </div>
  );
};

export default InteractiveIncidentMap;
