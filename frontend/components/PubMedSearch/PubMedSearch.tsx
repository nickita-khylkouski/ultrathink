'use client';

import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { BookOpen, ExternalLink, FileText } from 'lucide-react';

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubdate: string;
  abstract?: string;
  url: string;
}

export function PubMedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PubMedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAbstracts, setShowAbstracts] = useState<Set<string>>(new Set());

  const searchPubMed = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // Use NCBI E-utilities API
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=20&retmode=json`;

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.esearchresult?.idlist?.length) {
        setError('No results found');
        setIsLoading(false);
        return;
      }

      const pmids = searchData.esearchresult.idlist;

      // Fetch article details
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json();

      const articles: PubMedArticle[] = pmids.map((pmid: string) => {
        const article = summaryData.result[pmid];
        return {
          pmid,
          title: article.title || 'No title',
          authors: article.authors?.slice(0, 3).map((a: any) => a.name).join(', ') + (article.authors?.length > 3 ? ' et al.' : '') || 'Unknown',
          journal: article.fulljournalname || article.source || 'Unknown Journal',
          pubdate: article.pubdate || 'Unknown',
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        };
      });

      setResults(articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search PubMed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAbstract = (pmid: string) => {
    const newShowAbstracts = new Set(showAbstracts);
    if (newShowAbstracts.has(pmid)) {
      newShowAbstracts.delete(pmid);
    } else {
      newShowAbstracts.add(pmid);
    }
    setShowAbstracts(newShowAbstracts);
  };

  return (
    <Card className="border-2 border-black">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-xl font-bold">PubMed Research Search</h2>
        </div>

        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          Search over 36 million biomedical literature citations from PubMed.
          Find research papers on drug candidates, disease mechanisms, ADMET properties, and more.
        </p>

        <div className="flex gap-2 mb-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPubMed()}
            placeholder="e.g., 'ADMET prediction machine learning' or 'Alzheimer drug discovery'"
            className="flex-1 border-black"
          />
          <Button
            onClick={searchPubMed}
            disabled={isLoading}
            className="bg-black text-white hover:bg-secondary px-6"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {error && <ErrorMessage message={error} className="mb-4" />}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b-2 border-black">
              <h3 className="font-bold">Results ({results.length})</h3>
              <p className="text-xs text-text-secondary">Source: PubMed / NCBI E-utilities</p>
            </div>

            {results.map((article) => (
              <div
                key={article.pmid}
                className="border-2 border-black p-4 hover:bg-panel transition-colors"
              >
                {/* Title */}
                <h4 className="font-bold text-research mb-2 leading-snug">
                  {article.title}
                </h4>

                {/* Metadata */}
                <div className="text-xs text-text-secondary space-y-1 mb-3">
                  <p>
                    <span className="font-mono">Authors:</span> {article.authors}
                  </p>
                  <p>
                    <span className="font-mono">Journal:</span> {article.journal}
                  </p>
                  <p>
                    <span className="font-mono">Published:</span> {article.pubdate}
                  </p>
                  <p>
                    <span className="font-mono">PMID:</span> {article.pmid}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on PubMed
                  </a>

                  <button
                    onClick={() => toggleAbstract(article.pmid)}
                    className="inline-flex items-center gap-1 text-xs border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                  >
                    <FileText className="h-3 w-3" />
                    {showAbstracts.has(article.pmid) ? 'Hide' : 'Show'} Abstract
                  </button>
                </div>

                {/* Abstract (if toggled) */}
                {showAbstracts.has(article.pmid) && (
                  <div className="mt-3 p-3 bg-panel border-l-4 border-black">
                    <p className="text-xs text-text-secondary italic">
                      Abstract loading requires additional API call (not implemented in demo).
                      Click "View on PubMed" to read the full abstract.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !isLoading && !error && (
          <div className="text-center py-12 text-text-secondary">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Enter a search query to find research papers from PubMed
            </p>
            <p className="text-xs mt-2">
              Example: "ADMET prediction", "drug discovery AI", "Alzheimer's beta-amyloid"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
