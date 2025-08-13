// /src/Components/order-licenses/LicenseSetup.tsx
"use client";
import React, { useState, useEffect } from 'react';

interface LicenseSetupProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  orderData: any;
}

const LicenseSetup = ({ onNext, onBack, onUpdateData, orderData }: LicenseSetupProps) => {
  const [billingCycle, setBillingCycle] = useState(orderData.billingCycle || 'yearly');
  const [userCount, setUserCount] = useState(orderData.userCount || 4);
  const [selectedBundle, setSelectedBundle] = useState(orderData.bundleType || '');

  // Bundle options for bundled license model
  const bundleOptions = [
    {
      id: 'small',
      name: '3 Named + 5 Concurrent',
      description: '3 dedicated users + 5 shared access',
      namedUsers: 3,
      concurrentUsers: 5
    },
    {
      id: 'medium',
      name: '5 Named + 10 Concurrent',
      description: '5 dedicated users + 10 shared access',
      namedUsers: 5,
      concurrentUsers: 10
    },
    {
      id: 'large',
      name: '8 Named + 20 Concurrent',
      description: '8 dedicated users + 20 shared access',
      namedUsers: 8,
      concurrentUsers: 20
    }
  ];

  // Price calculation
  const calculatePrice = () => {
    let basePrice = 0;
    const isYearly = billingCycle === 'yearly';
    const discount = isYearly ? 0.15 : 0; // 15% off yearly

    if (orderData.licenseModel === 'bundled') {
      // Bundle pricing based on selected bundle
      const bundle = bundleOptions.find(b => b.id === selectedBundle);
      if (bundle) {
        if (orderData.edition === 'enterprise') {
          basePrice = bundle.id === 'small' ? 16500 :
                     bundle.id === 'medium' ? 23940 :
                     bundle.id === 'large' ? 39600 : 0;
        } else {
          basePrice = bundle.id === 'small' ? 13200 :
                     bundle.id === 'medium' ? 19140 :
                     bundle.id === 'large' ? 31680 : 0;
        }
      }
    } else {
      // Regular pricing per user based on license model and edition
      if (orderData.licenseModel === 'named') {
        basePrice = orderData.edition === 'enterprise' ? 2470 : 1970; // Per user yearly
      } else if (orderData.licenseModel === 'concurrent') {
        basePrice = orderData.edition === 'enterprise' ? 2300 : 1800; // Per concurrent user
      }
      basePrice = basePrice * userCount;
    }

    const finalPrice = isYearly ? basePrice * (1 - discount) : basePrice;
    return Math.round(finalPrice);
  };

  const price = calculatePrice();

  // Update parent data when values change
  useEffect(() => {
    const updateData: any = {
      billingCycle,
      price: price,
      total: price
    };

    if (orderData.licenseModel === 'bundled') {
      updateData.bundleType = selectedBundle;
      const bundle = bundleOptions.find(b => b.id === selectedBundle);
      if (bundle) {
        updateData.userCount = bundle.namedUsers + bundle.concurrentUsers;
      }
    } else {
      updateData.userCount = userCount;
    }

    onUpdateData(updateData);
  }, [billingCycle, userCount, selectedBundle, price]);

  const handleContinue = () => {
    if (orderData.licenseModel === 'bundled' && !selectedBundle) {
      return; // Don't proceed if bundle not selected
    }
    onNext();
  };

  const getLicenseLabel = () => {
    if (orderData.licenseModel === 'named') {
      return 'Number of Named Users';
    } else if (orderData.licenseModel === 'concurrent') {
      return 'Number of Concurrent Users';
    } else if (orderData.licenseModel === 'bundled') {
      return 'Select Bundle';
    }
    return 'Number of Users';
  };

  const getLicenseHelperText = () => {
    if (orderData.licenseModel === 'named') {
      return 'Each named user will have a dedicated license slot';
    } else if (orderData.licenseModel === 'concurrent') {
      return 'Maximum number of users who can access simultaneously';
    } else if (orderData.licenseModel === 'bundled') {
      return 'Pre-configured combinations for optimal flexibility';
    }
    return 'Configure your license quantities';
  };

  const canProceed = () => {
    if (orderData.licenseModel === 'bundled') {
      return selectedBundle !== '';
    }
    return userCount > 0;
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.2rem', color: '#1a1a1a' }}>License Setup</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Configure your license quantities
        </p>
      </div>

      {/* Setup Form */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 col-md-10">

          {/* Billing Cycle */}
          <div className="mb-3">
            <h6 className="fw-bold mb-2" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
              Billing Cycle
            </h6>
            <div className="row g-3">
              <div className="col-6">
                <button
                  type="button"
                  className={`btn w-100 ${billingCycle === 'yearly' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setBillingCycle('yearly')}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    padding: '6px 20px',
                    fontWeight: '500'
                  }}
                >
                  Yearly (15% Off)
                </button>
              </div>
              <div className="col-6">
                <button
                  type="button"
                  className={`btn w-100 ${billingCycle === 'monthly' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    padding: '6px 20px',
                    fontWeight: '500'
                  }}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>

          {/* License Configuration */}
          <div className="mb-3">
            <h6 className="fw-bold mb-3" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
              {getLicenseLabel()}
            </h6>

            {/* Bundle Selection */}
            {orderData.licenseModel === 'bundled' ? (
              <div className="mb-2">
                {bundleOptions.map((bundle) => (
                  <div key={bundle.id} className="mb-3">
                    <div
                      className={`card cursor-pointer border ${
                        selectedBundle === bundle.id
                          ? 'border-primary shadow-sm'
                          : 'border-light'
                      }`}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '12px'
                      }}
                      onClick={() => setSelectedBundle(bundle.id)}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                              {bundle.name}
                            </h6>
                            <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                              {bundle.description}
                            </p>
                          </div>
                          {selectedBundle === bundle.id && (
                            <div>
                              <i className="fas fa-check-circle text-primary" style={{ fontSize: '1.2rem' }}></i>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Regular User Count Input */
              <div className="mb-2">
                <input
                  type="number"
                  className="form-control"
                  value={userCount.toString().padStart(2, '0')}
                  onChange={(e) => setUserCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="1000"
                  style={{
                    borderRadius: '8px',
                    fontSize: '1rem',
                    padding: '6px 20px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    textAlign: 'left',
                    fontWeight: '500'
                  }}
                />
              </div>
            )}

            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
              {getLicenseHelperText()}
            </p>
          </div>

          {/* Price Display */}
          <div className="text-center mb-3">
            <p className="text-muted mb-2" style={{ fontSize: '1rem' }}>
              Estimated Price
            </p>
            <div className="mb-2">
              <span className="fw-bold" style={{ fontSize: '2rem', color: '#1a1a1a' }}>
                ${price.toLocaleString()}
              </span>
              <span className="text-muted" style={{ fontSize: '1.2rem' }}>
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>
          </div>

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
          className={`btn px-5 py-1 ${canProceed() ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleContinue}
          disabled={!canProceed()}
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

export default LicenseSetup;
