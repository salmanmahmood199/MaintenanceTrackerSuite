// @ts-ignore - geoip-lite doesn't have types
import geoip from 'geoip-lite';

export interface LocationData {
  city: string;
  state: string;
  region: string;
  country: string;
  timezone: string;
}

export interface ServiceContent {
  title: string;
  description: string;
  keywords: string[];
  services: string[];
  emergencyText: string;
}

export function getLocationFromIP(ip: string): LocationData | null {
  // Handle localhost and internal IPs
  if (ip === '::1' || ip === '127.0.0.1' || ip?.startsWith('192.168') || ip?.startsWith('10.')) {
    // Default to Washington DC area for development/local testing
    return {
      city: 'Washington',
      state: 'DC',
      region: 'Washington DC Metro Area',
      country: 'US',
      timezone: 'America/New_York'
    };
  }

  const geo = geoip.lookup(ip);
  if (!geo) return null;

  return {
    city: geo.city,
    state: geo.region,
    region: `${geo.city}, ${geo.region}`,
    country: geo.country,
    timezone: geo.timezone
  };
}

export function getServiceContent(searchTerm?: string): ServiceContent {
  const term = searchTerm?.toLowerCase();
  
  if (term?.includes('hvac') || term?.includes('heating') || term?.includes('cooling') || term?.includes('air conditioning')) {
    return {
      title: 'HVAC Maintenance & Repair Services',
      description: 'Professional HVAC maintenance, heating repair, air conditioning service, and climate control solutions for commercial businesses.',
      keywords: ['HVAC maintenance', 'heating repair', 'air conditioning service', 'commercial HVAC', 'climate control'],
      services: ['HVAC System Maintenance', 'Heating & Cooling Repair', 'Air Quality Testing', 'Thermostat Installation', 'Ductwork Cleaning'],
      emergencyText: 'Emergency HVAC services available 24/7 for system failures and climate control issues.'
    };
  }
  
  if (term?.includes('electric') || term?.includes('electrical') || term?.includes('wiring')) {
    return {
      title: 'Commercial Electrical Services & Maintenance',
      description: 'Expert electrical maintenance, wiring repair, lighting installation, and power system solutions for businesses.',
      keywords: ['electrical maintenance', 'commercial electrician', 'wiring repair', 'lighting installation', 'power systems'],
      services: ['Electrical System Maintenance', 'Lighting Installation & Repair', 'Outlet & Switch Installation', 'Circuit Breaker Service', 'Emergency Power Solutions'],
      emergencyText: 'Emergency electrical services available 24/7 for power outages and electrical hazards.'
    };
  }
  
  if (term?.includes('plumb') || term?.includes('water') || term?.includes('drain') || term?.includes('pipe')) {
    return {
      title: 'Commercial Plumbing Services & Maintenance',
      description: 'Professional plumbing maintenance, pipe repair, drain cleaning, and water system solutions for commercial properties.',
      keywords: ['commercial plumbing', 'pipe repair', 'drain cleaning', 'water system maintenance', 'plumbing services'],
      services: ['Plumbing System Maintenance', 'Pipe Repair & Replacement', 'Drain Cleaning & Unclogging', 'Water Heater Service', 'Leak Detection & Repair'],
      emergencyText: 'Emergency plumbing services available 24/7 for water leaks, pipe bursts, and drainage issues.'
    };
  }
  
  // Default general maintenance content
  return {
    title: 'Commercial Maintenance Management Platform',
    description: 'Comprehensive maintenance management solution connecting businesses with certified service providers for all commercial maintenance needs.',
    keywords: ['commercial maintenance', 'facility management', 'maintenance services', 'business maintenance', 'property maintenance'],
    services: ['HVAC Maintenance', 'Electrical Services', 'Plumbing Repair', 'General Maintenance', 'Emergency Services'],
    emergencyText: 'Emergency maintenance services available 24/7 for urgent business needs.'
  };
}

export function generateLocationSpecificContent(location: LocationData, service: ServiceContent) {
  return {
    metaTitle: `${service.title} in ${location.region} | TaskScout`,
    metaDescription: `${service.description} Serving ${location.city}, ${location.state} and surrounding areas. Get instant quotes from certified professionals.`,
    heroTitle: `Professional Maintenance Services in ${location.region}`,
    heroSubtitle: `Connect with certified ${service.services[0].toLowerCase()} professionals in ${location.city}, ${location.state}`,
    locationText: `Serving ${location.city}, ${location.state} and the surrounding ${location.region}`,
    serviceArea: `${location.city} Metro Area`,
    timezone: location.timezone
  };
}