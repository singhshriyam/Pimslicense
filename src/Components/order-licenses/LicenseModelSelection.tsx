"use client";
import React from 'react';

interface LicenseModelSelectionProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  selectedModel: string;
  orderType: string;
  edition: string;
}

const LicenseModelSelection = ({ onNext, onBack, onUpdateData, selectedModel, orderType, edition }: LicenseModelSelectionProps) => {
  const licenseModels = [
    {
      id: 'named',
      title: 'Named User',
      description: 'Assign licenses to specific users',
      detail: 'Each license is tied to a specific user account',
      icon: '👤'
    },
    {
      id: 'concurrent',
      title: 'Concurrent User',
      description: 'Share licenses across your team',
      detail: 'Multiple users can share a pool of licenses',
      icon: '👥'
    },
    {
      id: 'bundled',
      title: 'Bundled',
      description: 'Combined named and concurrent licenses',
      detail: 'Pre-configured combinations for optimal flexibility',
      icon: '📦'
    }
  ];

  const handleModelSelect = (modelId: string) => {
    onUpdateData({ licenseModel: modelId });
  };

  const handleContinue = () => {
    if (selectedModel) {
      onNext();
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.5rem', color: '#1a1a1a' }}>License Model</h2>
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
                      <p className="mb-0 text-muted" style={{ fontSize: '0.7rem' }}>
                        {model.detail}
                      </p>
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
          className={`btn px-5 py-2 ${
            selectedModel ? 'btn-dark' : 'btn-secondary'
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
