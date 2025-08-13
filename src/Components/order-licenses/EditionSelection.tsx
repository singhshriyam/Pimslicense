"use client";
import React from 'react';

interface EditionSelectionProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  selectedEdition: string;
  orderType?: string;
}

const EditionSelection = ({ onNext, onBack, onUpdateData, selectedEdition, orderType }: EditionSelectionProps) => {
  const editions = [
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: 'Full-featured solution for large organizations',
      features: ['Advanced Analytics', 'Priority Support', 'Custom Integrations', 'Unlimited API Calls'],
      icon: '🛡️',
      popular: false
    },
    {
      id: 'professional',
      title: 'Professional',
      description: 'Perfect for growing businesses',
      features: ['Standard Analytics', 'Business Support', 'Standard Integrations', '10K API Calls/month'],
      icon: '🛡️',
      popular: true
    }
  ];

  const handleEditionSelect = (editionId: string) => {
    onUpdateData({ edition: editionId });
  };

  const handleContinue = () => {
    if (selectedEdition) {
      onNext();
    }
  };

  const isDemo = orderType === 'demo-license';

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.5rem', color: '#1a1a1a' }}>Select Edition</h2>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          Choose the right tier for your organization
        </p>
      </div>

      {/* Edition Cards - Stacked Layout */}
      <div className="row justify-content-center mb-3">
        <div className="col-lg-10 col-md-10">
          {editions.map((edition, index) => (
            <div key={edition.id} className="mb-4">
              <div
                className={`card cursor-pointer border ${
                  selectedEdition === edition.id
                    ? 'border-primary shadow-sm'
                    : 'border-light'
                }`}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: '12px'
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
                  <div className="d-flex flex-wrap gap-3 ms-4">
                    {edition.features.map((feature, featureIndex) => (
                      <span
                        key={featureIndex}
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

                  {/* Demo Badge */}
                  {isDemo && (
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge bg-success px-2 py-1">FREE DEMO</span>
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
          className={`btn px-5 py-2 ${
            selectedEdition ? 'btn-dark' : 'btn-secondary'
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

      {/* Demo Information only */}
      {isDemo && selectedEdition && (
        <div className="alert alert-info mt-4" role="alert">
          <div className="d-flex">
            <i className="fas fa-info-circle me-3 mt-1"></i>
            <div>
              <h6 className="alert-heading mb-1">Demo License Details</h6>
              <p className="mb-1"><strong>Duration:</strong> 30 days from activation</p>
              <p className="mb-1"><strong>Features:</strong> Full access to {selectedEdition === 'enterprise' ? 'Enterprise' : 'Professional'} features</p>
              <p className="mb-0"><strong>Limitations:</strong> Limited to 2 users for evaluation purposes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditionSelection;
