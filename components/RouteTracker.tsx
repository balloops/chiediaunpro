
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';

const RouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Invia un evento di page view ogni volta che cambia il percorso
    if (analyticsService.hasConsent()) {
        analyticsService.trackPageView(location.pathname + location.search);
    }
  }, [location]);

  return null;
};

export default RouteTracker;
