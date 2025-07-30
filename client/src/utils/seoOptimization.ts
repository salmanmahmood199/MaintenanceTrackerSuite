// SEO optimization utilities for dynamic content

export function detectSearchIntent(url: string, query?: string): string | null {
  const path = url.toLowerCase();
  const searchTerm = query?.toLowerCase();
  
  // Check URL path for service terms
  if (path.includes('hvac') || path.includes('heating') || path.includes('cooling') || path.includes('air-conditioning')) {
    return 'hvac';
  }
  
  if (path.includes('electric') || path.includes('electrical') || path.includes('wiring')) {
    return 'electrical';
  }
  
  if (path.includes('plumb') || path.includes('plumbing') || path.includes('water') || path.includes('drain')) {
    return 'plumbing';
  }
  
  // Check search terms
  if (searchTerm) {
    if (searchTerm.includes('hvac') || searchTerm.includes('heating') || searchTerm.includes('cooling')) {
      return 'hvac';
    }
    if (searchTerm.includes('electric') || searchTerm.includes('electrical')) {
      return 'electrical';
    }
    if (searchTerm.includes('plumb') || searchTerm.includes('water') || searchTerm.includes('drain')) {
      return 'plumbing';
    }
  }
  
  return null;
}

export function generateStructuredData(location: any, service: any, content: any) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "TaskScout",
    "description": content.metaDescription,
    "url": "https://taskscout.ai",
    "areaServed": location ? {
      "@type": "Place",
      "name": location.region
    } : undefined,
    "serviceType": service.services,
    "availableLanguage": "English",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Maintenance Services",
      "itemListElement": service.services.map((serviceItem: string, index: number) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": serviceItem
        }
      }))
    }
  };
}

export function updateStructuredData(structuredData: any) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}