'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface AbstractLoaderProps {
  pmid: string;
}

export function AbstractLoader({ pmid }: AbstractLoaderProps) {
  const [abstract, setAbstract] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache first
    const cacheKey = `pubmed_abstract_${pmid}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { abstract: cachedAbstract, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        // Cache for 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          setAbstract(cachedAbstract);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // Invalid cache, proceed to fetch
      }
    }

    // Fetch abstract from PubMed E-utilities
    const fetchAbstract = async () => {
      try {
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch abstract');
        }

        const xmlText = await response.text();

        // Parse XML to extract abstract
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Try multiple possible abstract locations in PubMed XML
        const abstractTexts: string[] = [];

        // Method 1: AbstractText elements
        const abstractElements = xmlDoc.getElementsByTagName('AbstractText');
        for (let i = 0; i < abstractElements.length; i++) {
          const element = abstractElements[i];
          const label = element.getAttribute('Label');
          const text = element.textContent?.trim();
          if (text) {
            if (label) {
              abstractTexts.push(`${label}: ${text}`);
            } else {
              abstractTexts.push(text);
            }
          }
        }

        // Method 2: If no AbstractText, try Abstract element
        if (abstractTexts.length === 0) {
          const abstractElement = xmlDoc.getElementsByTagName('Abstract')[0];
          if (abstractElement) {
            const text = abstractElement.textContent?.trim();
            if (text) {
              abstractTexts.push(text);
            }
          }
        }

        if (abstractTexts.length === 0) {
          setAbstract('No abstract available for this article.');
        } else {
          const fullAbstract = abstractTexts.join('\n\n');
          setAbstract(fullAbstract);

          // Cache the result
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              abstract: fullAbstract,
              timestamp: Date.now()
            }));
          } catch (e) {
            // Storage quota exceeded, ignore
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching abstract:', err);
        setError('Failed to load abstract. Please try again.');
        setIsLoading(false);
      }
    };

    fetchAbstract();
  }, [pmid]);

  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-panel border-l-4 border-black">
        <LoadingSpinner size="sm" message="Loading abstract..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-panel border-l-4 border-danger">
        <p className="text-xs text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-panel border-l-4 border-black">
      <p className="text-xs font-bold text-text-secondary mb-2">ABSTRACT</p>
      <p className="text-xs text-primary leading-relaxed whitespace-pre-line">
        {abstract}
      </p>
    </div>
  );
}
