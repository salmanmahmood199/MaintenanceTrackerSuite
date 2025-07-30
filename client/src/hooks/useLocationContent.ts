import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { detectSearchIntent, generateStructuredData, updateStructuredData } from '@/utils/seoOptimization';

interface LocationData {
  city: string;
  state: string;
  region: string;
  country: string;
  timezone: string;
}

interface ServiceContent {
  title: string;
  description: string;
  keywords: string[];
  services: string[];
  emergencyText: string;
}

interface LocationContent {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  locationText: string;
  serviceArea: string;
  timezone: string;
}

interface LocationContentResponse {
  location: LocationData | null;
  service: ServiceContent;
  content: LocationContent;
  ip: string;
}

export function useLocationContent(searchTerm?: string) {
  const [urlSearchTerm, setUrlSearchTerm] = useState<string>();

  // Check URL parameters for search terms on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search') || 
                  urlParams.get('q') || 
                  urlParams.get('service') ||
                  searchTerm;
    
    // Use SEO optimization utility to detect search intent
    const detectedIntent = detectSearchIntent(window.location.href, search || undefined);
    
    if (detectedIntent) {
      setUrlSearchTerm(detectedIntent);
    } else if (search) {
      setUrlSearchTerm(search);
    }
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/location-content', urlSearchTerm],
    queryFn: async (): Promise<LocationContentResponse> => {
      const params = new URLSearchParams();
      if (urlSearchTerm) {
        params.append('search', urlSearchTerm);
      }
      
      const response = await fetch(`/api/location-content?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location content');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update document metadata when content changes
  useEffect(() => {
    if (data?.content) {
      document.title = data.content.metaTitle;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', data.content.metaDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = data.content.metaDescription;
        document.head.appendChild(meta);
      }

      // Update Open Graph tags
      updateOrCreateMetaTag('property', 'og:title', data.content.metaTitle);
      updateOrCreateMetaTag('property', 'og:description', data.content.metaDescription);
      updateOrCreateMetaTag('name', 'keywords', data.service.keywords.join(', '));
      
      // Update structured data for SEO
      if (data.location) {
        const structuredData = generateStructuredData(data.location, data.service, data.content);
        updateStructuredData(structuredData);
      }
    }
  }, [data]);

  return {
    location: data?.location || null,
    service: data?.service || {
      title: 'Commercial Maintenance Management Platform',
      description: 'Comprehensive maintenance management solution for businesses',
      keywords: ['commercial maintenance', 'facility management'],
      services: ['HVAC Maintenance', 'Electrical Services', 'Plumbing Repair'],
      emergencyText: 'Emergency services available 24/7'
    },
    content: data?.content || {
      metaTitle: 'TaskScout - Commercial Maintenance Management',
      metaDescription: 'Professional maintenance management platform for businesses',
      heroTitle: 'Professional Maintenance Services',
      heroSubtitle: 'Connect with certified maintenance professionals',
      locationText: 'Serving businesses nationwide',
      serviceArea: 'Nationwide Service',
      timezone: 'America/New_York'
    },
    isLoading,
    error,
    clientIP: data?.ip
  };
}

function updateOrCreateMetaTag(attribute: string, attributeValue: string, content: string) {
  let metaTag = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  if (metaTag) {
    metaTag.setAttribute('content', content);
  } else {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, attributeValue);
    metaTag.setAttribute('content', content);
    document.head.appendChild(metaTag);
  }
}