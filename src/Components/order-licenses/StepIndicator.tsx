"use client";
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const steps = [
    { id: 1, title: 'Select Order Type' },
    { id: 2, title: 'Select License' },
    { id: 3, title: 'Complete Order' }
  ];

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-center align-items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="d-flex align-items-center">
            {/* Step Circle */}
            <div className="text-center">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 ${
                  step.id === currentStep
                    ? 'bg-primary text-white'
                    : step.id < currentStep
                    ? 'bg-success text-white'
                    : 'bg-light text-muted'
                }`}
                style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <small className={`${step.id === currentStep ? 'text-primary fw-medium' : 'text-muted'}`}>
                {step.title}
              </small>
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div className="mx-4">
                <i className="fas fa-chevron-right text-muted"></i>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
