"use client";
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/services/apiService';

interface Module {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pivot: {
    edition_id: number;
    module_id: number;
  };
}

interface Edition {
  id: number;
  name: string;
  description: string;
  created_at: string;
  modules: Module[];
}

interface ApiResponse {
  success: boolean;
  data: Edition[];
  message: string;
}

interface EditionSelectionProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  selectedEdition: string;
  orderType?: string;
}

interface EditionCard {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
}

const EditionSelection = ({
  onNext,
  onBack,
  onUpdateData,
  selectedEdition,
  orderType
}: EditionSelectionProps) => {
  const [editions, setEditions] = useState<EditionCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get API base URL from environment (same as apiService)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://licence.apextechno.co.uk/api';

  // Icon mapping for editions
  const getEditionIcon = (editionName: string): string => {
    const iconMap: Record<string, string> = {
      enterprise: '🛡️',
      professional: '💼',
      basic: '⚡',
      starter: '🚀',
      default: '📦'
    };

    const key = editionName.toLowerCase();
    return iconMap[key] || iconMap.default;
  };

  // Remove duplicate modules by ID
  const removeDuplicateModules = (modules: Module[]): Module[] => {
    const seen = new Set<number>();
    return modules.filter(module => {
      if (seen.has(module.id)) {
        return false;
      }
      seen.add(module.id);
      return true;
    });
  };

  // Transform API data to component format
  const transformEditionData = (apiData: Edition[]): EditionCard[] => {
    return apiData.map(edition => ({
      id: edition.id.toString(),
      title: edition.name,
      description: edition.description,
      features: removeDuplicateModules(edition.modules).map(module => module.name),
      icon: getEditionIcon(edition.name),
    }));
  };

  // Fetch editions from API
  const fetchEditions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get token from apiService
      const token = getAuthToken();

      const headers = new Headers();
      headers.append("Accept", "application/json");

      // Add authorization token if available
      if (token) {
        headers.append("Authorization", `Bearer ${token}`);
      }

      const requestOptions: RequestInit = {
        method: "GET",
        headers: headers,
        redirect: "follow"
      };

      console.log(`🚀 Making API call to: ${API_BASE_URL}/editions`);

      const response = await fetch(`${API_BASE_URL}/editions`, requestOptions);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        // Handle specific error codes
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please login again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Please contact support.';
            break;
          case 404:
            errorMessage = 'Editions service not found.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }

        throw new Error(errorMessage);
      }

      const result: ApiResponse = await response.json();
      console.log('📥 API Response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch editions');
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid API response format');
      }

      const transformedData = transformEditionData(result.data);
      setEditions(transformedData);

    } catch (err) {
      console.error('❌ Error fetching editions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load editions');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchEditions();
  }, []);

  const handleEditionSelect = (editionId: string) => {
    onUpdateData({ edition: editionId });
  };

  const handleContinue = () => {
    if (selectedEdition) {
      onNext();
    }
  };

  const handleRetry = () => {
    fetchEditions();
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-0">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading editions...</span>
          </div>
          <p className="text-muted mt-3">Loading available editions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid px-0">
        <div className="text-center py-5">
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Error:</strong> {error}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRetry}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Retry
          </button>
        </div>

        {/* Navigation for error state */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button
            className="btn btn-link text-muted px-0"
            onClick={onBack}
            style={{
              fontSize: '1rem',
              textDecoration: 'none',
              backgroundColor: 'transparent',
              border: 'none'
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // No editions found
  if (editions.length === 0) {
    return (
      <div className="container-fluid px-0">
        <div className="text-center py-5">
          <div className="alert alert-warning" role="alert">
            <i className="fas fa-info-circle me-2"></i>
            No editions available at this time.
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRetry}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>

        {/* Navigation */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button
            className="btn btn-link text-muted px-0"
            onClick={onBack}
            style={{
              fontSize: '1rem',
              textDecoration: 'none',
              backgroundColor: 'transparent',
              border: 'none'
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.5rem', color: '#1a1a1a' }}>
          Select Edition
        </h2>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          Choose the right tier for your organization
        </p>
      </div>

      {/* Edition Cards - Stacked Layout */}
      <div className="row justify-content-center mb-3">
        <div className="col-lg-10 col-md-10">
          {editions.map((edition) => (
            <div key={edition.id} className="mb-4 position-relative">
              <div
                className={`card cursor-pointer border ${
                  selectedEdition === edition.id
                    ? 'border-primary border-2'
                    : 'border-light'
                }`}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: '12px',
                }}
                onClick={() => handleEditionSelect(edition.id)}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    {/* Icon */}
                    <div
                      className={`rounded-3 d-flex align-items-center justify-content-center me-3 ${
                        selectedEdition === edition.id ? 'bg-primary' : 'bg-dark'
                      }`}
                      style={{ width: '40px', height: '40px', fontSize: '24px' }}
                    >
                      <span style={{ color: 'white' }}>{edition.icon}</span>
                    </div>

                    {/* Title and Description */}
                    <div className="flex-grow-1">
                      <h4 className="mb-1 fw-bold" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                        {edition.title}
                      </h4>
                      <p className="text-muted mb-0" style={{ fontSize: '.7rem' }}>
                        {edition.description}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {selectedEdition === edition.id && (
                      <div>
                        <i className="fas fa-check-circle text-primary" style={{ fontSize: '1rem' }}></i>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {edition.features.length > 0 && (
                    <div className="d-flex flex-wrap gap-3 ms-4">
                      {edition.features.map((feature, featureIndex) => (
                        <span
                          key={`${edition.id}-feature-${featureIndex}`}
                          className="badge bg-light text-dark px-3 py-2"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 'normal',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between align-items-center">
        <button
          className="btn btn-link text-muted px-0"
          onClick={onBack}
          style={{
            fontSize: '1rem',
            textDecoration: 'none',
            backgroundColor: 'transparent',
            border: 'none'
          }}
        >
          Back
        </button>

        <button
          className={`btn px-5 py-1 ${
            selectedEdition ? 'btn-primary' : 'btn-secondary'
          }`}
          onClick={handleContinue}
          disabled={!selectedEdition}
          style={{
            fontSize: '1rem',
            fontWeight: '500',
            borderRadius: '8px',
            minWidth: '100px'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default EditionSelection;
