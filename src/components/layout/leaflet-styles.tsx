'use client';

// This component exists solely to load Leaflet CSS on the client.
// Leaflet CSS files reference local image assets via url(), which
// causes Next.js webpack-runtime.js to crash when imported in a Server
// Component. Importing them here (a Client Component) keeps them in the
// client bundle only and avoids the SSR prerendering crash.
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-draw/dist/leaflet.draw.css';

export function LeafletStyles() {
  return null;
}
