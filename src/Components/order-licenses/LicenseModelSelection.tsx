"use client";
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/services/apiService';

interface LicenseType {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ApiResponse {
  success: boolean;
  data: LicenseType[];
  message: string;
}

interface LicenseModelSelectionProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  selectedModel: string;
  orderType: string;
  edition: string;
}

interface LicenseModelCard {
  id: string;
  title: string;
  description: string;
  detail: string;
  icon: string;
}

const LicenseModelSelection = ({
  onNext,
  onBack,
  onUpdateData,
  selectedModel,
  orderType,
  edition
}: LicenseModelSelectionProps) => {
  const [licenseModels, setLicenseModels] = useState<LicenseModelCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get API base URL from environment (same as apiService)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://licence.apextechno.co.uk/api';

  // Icon mapping for license types
  const getLicenseTypeIcon = (licenseTypeName: string): string => {
    const iconMap: Record<string, string> = {
      'named user': '👤',
      'concurrent user': '👥',
      'bundled': '📦',
      'named': '👤',
      'concurrent': '👥',
      'bundle': '📦',
      'floating': '🔄',
      'site': '🏢',
      'enterprise': '🛡️',
      'default': '📄'
    };

    const key = licenseTypeName.toLowerCase();
    return iconMap[key] || iconMap.default;
  };

  // Parse description to separate main description and detail
  const parseDescription = (description: string): { description: string; detail: string } => {
    // Split by period and take first sentence as description, rest as detail
    const sentences = description.split('.').filter(sentence => sentence.trim().length > 0);

    if (sentences.length > 1) {
      return {
        description: sentences[0].trim(),
        detail: sentences.slice(1).join('.').trim()
      };
    }

    return {
      description: description.trim(),
      detail: ''
    };
  };

  // Transform API data to component format
  const transformLicenseTypeData = (apiData: LicenseType[]): LicenseModelCard[] => {
    return apiData.map(licenseType => {
      const { description, detail } = parseDescription(licenseType.description);

      return {
        id: licenseType.id.toString(),
        title: licenseType.name,
        description: description,
        detail: detail,
        icon: getLicenseTypeIcon(licenseType.name)
      };
    });
  };

  // Fetch license types from API
  const fetchLicenseTypes = async (): Promise<void> => {
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

      console.log(`🚀 Making API call to: ${API_BASE_URL}/licence-types`);

      const response = await fetch(`${API_BASE_URL}/licence-types`, requestOptions);

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
            errorMessage = 'License types service not found.';
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
        throw new Error(result.message || 'Failed to fetch license types');
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid API response format');
      }

      const transformedData = transformLicenseTypeData(result.data);
      setLicenseModels(transformedData);

    } catch (err) {
      console.error('❌ Error fetching license types:', err);
      setError(err instanceof Error ? err.message : 'Failed to load license types');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLicenseTypes();
  }, []);

  const handleModelSelect = (modelId: string) => {
    onUpdateData({ licenseModel: modelId });
  };

  const handleContinue = () => {
    if (selectedModel) {
      onNext();
    }
  };

  const handleRetry = () => {
    fetchLicenseTypes();
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-0">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading license models...</span>
          </div>
          <p className="text-muted mt-3">Loading available license models...</p>
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

  // No license models found
  if (licenseModels.length === 0) {
    return (
      <div className="container-fluid px-0">
        <div className="text-center py-5">
          <div className="alert alert-warning" role="alert">
            <i className="fas fa-info-circle me-2"></i>
            No license models available at this time.
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
          License Model
        </h2>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          How do you want to manage user access?
        </p>
      </div>

      {/* License Model Cards */}
      <div className="row justify-content-center mb-3">
        <div className="col-lg-10 col-md-10">
          {licenseModels.map((model) => (
            <div key={model.id} className="mb-4">
              <div
                className={`card cursor-pointer border ${
                  selectedModel === model.id
                    ? 'border-primary shadow-sm'
                    : 'border-light'
                }`}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: '12px'
                }}
                onClick={() => handleModelSelect(model.id)}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    {/* Icon */}
                    <div
                      className={`rounded-3 d-flex align-items-center justify-content-center me-3 ${
                        selectedModel === model.id ? 'bg-primary' : 'bg-light'
                      }`}
                      style={{
                        width: '40px',
                        height: '40px',
                        fontSize: '20px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <span style={{ color: selectedModel === model.id ? 'white' : '#666' }}>
                        {model.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1">
                      <h5 className="mb-1 fw-bold" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                        {model.title}
                      </h5>
                      <p className="mb-1 fw-medium" style={{ fontSize: '0.75rem', color: '#666' }}>
                        {model.description}
                      </p>
                      {model.detail && (
                        <p className="mb-0 text-muted" style={{ fontSize: '0.7rem' }}>
                          {model.detail}
                        </p>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedModel === model.id && (
                      <div>
                        <i className="fas fa-check-circle text-primary" style={{ fontSize: '1rem' }}></i>
                      </div>
                    )}
                  </div>
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
            selectedModel ? 'btn-primary' : 'btn-secondary'
          }`}
          onClick={handleContinue}
          disabled={!selectedModel}
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

export default LicenseModelSelection;
