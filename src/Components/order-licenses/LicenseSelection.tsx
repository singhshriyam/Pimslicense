"use client";
import React, { useState } from 'react';

interface LicenseSelectionProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  orderData: any;
}

interface LicenseOption {
  type: 'named' | 'concurrent';
  price: number;
  description: string;
}

interface LicenseSuite {
  id: string;
  name: string;
  description: string;
  options: LicenseOption[];
}

const LicenseSelection = ({ onNext, onBack, onUpdateData, orderData }: LicenseSelectionProps) => {
  const [selectedSuite, setSelectedSuite] = useState(orderData.licenseType || '');
  const [selectedOption, setSelectedOption] = useState(orderData.userType || '');

  const licenseOptions: LicenseSuite[] = [
    {
      id: 'professional',
      name: 'Professional Suite',
      description: 'Complete professional license with full features',
      options: [
        {
          type: 'named',
          price: 199,
          description: 'Per user license'
        },
        {
          type: 'concurrent',
          price: 299,
          description: 'Shared access license'
        }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise Suite',
      description: 'Advanced enterprise license with premium features',
      options: [
        {
          type: 'named',
          price: 399,
          description: 'Per user license'
        },
        {
          type: 'concurrent',
          price: 599,
          description: 'Shared access license'
        }
      ]
    }
  ];

  const handleSuiteSelect = (suiteId: string) => {
    setSelectedSuite(suiteId);
    setSelectedOption(''); // Reset option when changing suite
  };

  const handleOptionSelect = (suite: LicenseSuite, option: LicenseOption) => {
    setSelectedOption(option.type);
    onUpdateData({
      licenseType: suite.id,
      licenseName: suite.name,
      userType: option.type,
      price: option.price
    });
  };

  const handleContinue = () => {
    if (selectedSuite && selectedOption) {
      onNext();
    }
  };

  const getSelectedPrice = () => {
    const suite = licenseOptions.find(s => s.id === selectedSuite);
    const option = suite?.options.find(o => o.type === selectedOption);
    return option?.price || 0;
  };

  return (
    <div>
      {/* Title */}
      <div className="text-center mb-5">
        <h4 className="fw-bold mb-2">Select License</h4>
      </div>

      {/* License Suites */}
      <div className="row g-5">
        {licenseOptions.map((suite) => (
          <div key={suite.id} className="col-12">
            <div className="mb-4">
              <h5 className="fw-bold mb-2">{suite.name}</h5>
              <p className="text-muted">{suite.description}</p>
            </div>

            {/* License Options */}
            <div className="row g-3">
              {suite.options.map((option) => (
                <div key={option.type} className="col-md-6">
                  <div
                    className={`card h-100 cursor-pointer ${
                      selectedSuite === suite.id && selectedOption === option.type
                        ? 'border-primary shadow'
                        : 'border-light'
                    }`}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      handleSuiteSelect(suite.id);
                      handleOptionSelect(suite, option);
                    }}
                  >
                    <div className="card-body p-4">
                      {/* License Type Badge */}
                      <div className="mb-3">
                        <span
                          className={`badge px-3 py-2 ${
                            option.type === 'named' ? 'bg-primary' : 'bg-success'
                          }`}
                          style={{ fontSize: '12px' }}
                        >
                          {option.type === 'named' ? 'Named User' : 'Concurrent User'}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h3 className="fw-bold mb-0">${option.price}</h3>
                          <small className="text-muted">{option.description}</small>
                        </div>

                        {/* Selection Indicator */}
                        {selectedSuite === suite.id && selectedOption === option.type && (
                          <div>
                            <i className="fas fa-check-circle text-primary fs-4"></i>
                          </div>
                        )}
                      </div>

                      {/* Features would go here in a real app */}
                      <div className="text-muted small">
                        {option.type === 'named'
                          ? 'Individual user access with full features'
                          : 'Shared access for multiple users'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between mt-5">
        <button
          className="btn btn-outline-secondary btn-lg px-4"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back
        </button>

        <button
          className="btn btn-primary btn-lg px-5"
          onClick={handleContinue}
          disabled={!selectedSuite || !selectedOption}
        >
          Continue to Summary
          <i className="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

export default LicenseSelection;
