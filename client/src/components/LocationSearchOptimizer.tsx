import { useEffect } from 'react';
import { useLocationContent } from '@/hooks/useLocationContent';

interface LocationSearchOptimizerProps {
  searchTerm?: string;
}

export function LocationSearchOptimizer({ searchTerm }: LocationSearchOptimizerProps) {
  const { location, service, content } = useLocationContent(searchTerm);

  useEffect(() => {
    // Update page URL to include location and service for SEO
    if (location && service && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      
      // Add location parameter for better SEO
      if (location.city && location.state) {
        currentUrl.searchParams.set('location', `${location.city}-${location.state}`);
      }
      
      // Add service parameter if specific service detected
      if (searchTerm) {
        currentUrl.searchParams.set('service', searchTerm);
      }
      
      // Update URL without reloading page
      const newUrl = currentUrl.toString();
      if (newUrl !== window.location.href) {
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location, service, searchTerm]);

  // This component doesn't render anything - it's just for SEO optimization
  return null;
}

export default LocationSearchOptimizer;