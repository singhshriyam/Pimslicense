"use client";
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  stepTitles?: string[];
}

const StepIndicator = ({
  currentStep,
  totalSteps = 5,
  stepTitles = ['Select Order Type', 'Select Edition', 'License Model', 'License Setup', 'License Details']
}: StepIndicatorProps) => {

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'inactive';
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return '🛡️'; // Order Type / Edition
      case 2: return '⚙️'; // Model
      case 3: return '👥'; // Setup
      case 4: return '📄'; // Details
      case 5: return '💰'; // Review
      default: return '•';
    }
  };

  const getStepLabel = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return 'Edition';
      case 2: return 'Model';
      case 3: return 'Setup';
      case 4: return 'Details';
      case 5: return 'Review';
      default: return `Step ${stepNumber}`;
    }
  };

  return (
    <div className="mb-5">
      {/* Top Step Navigation - Matches your screenshot */}
      <div className="d-flex justify-content-center align-items-center mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);

          return (
            <React.Fragment key={stepNumber}>
              {/* Step Circle */}
              <div className="d-flex flex-column align-items-center">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${
                    status === 'active'
                      ? 'bg-primary text-white'
                      : status === 'completed'
                      ? 'bg-success text-white'
                      : 'bg-light text-muted'
                  }`}
                  style={{
                    width: '48px',
                    height: '48px',
                    fontSize: '20px',
                    border: status === 'active' ? '2px solid #007bff' : '2px solid #e9ecef'
                  }}
                >
                  {status === 'completed' ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <span>{getStepIcon(stepNumber)}</span>
                  )}
                </div>

                {/* Step Label */}
                <small
                  className={`fw-bold ${
                    status === 'active'
                      ? 'text-primary'
                      : status === 'completed'
                      ? 'text-success'
                      : 'text-muted'
                  }`}
                  style={{ fontSize: '0.85rem' }}
                >
                  {getStepLabel(stepNumber)}
                </small>
              </div>

              {/* Connector Line */}
              {stepNumber < totalSteps && (
                <div
                  className="mx-3"
                  style={{
                    width: '40px',
                    height: '2px',
                    backgroundColor: stepNumber < currentStep ? '#28a745' : '#e9ecef',
                    marginBottom: '20px'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
