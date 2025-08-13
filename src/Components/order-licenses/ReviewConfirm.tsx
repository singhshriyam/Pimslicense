// /src/Components/order-licenses/ReviewConfirm.tsx
"use client";
import React from 'react';

interface ReviewConfirmProps {
  onNext: () => void;
  onBack: () => void;
  orderData: any;
}

const ReviewConfirm = ({ onNext, onBack, orderData }: ReviewConfirmProps) => {
  const handleProceedToCheckout = () => {
    // Proceed to checkout step
    onNext();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getLicenseModelDisplay = () => {
    const model = orderData.licenseModel;
    if (model === 'named') return 'Named User';
    if (model === 'concurrent') return 'Concurrent User';
    if (model === 'bundled') return 'Bundled';
    return model;
  };

  const getConfigurationText = () => {
    if (orderData.licenseModel === 'bundled') {
      const bundleOptions: { [key: string]: string } = {
        'small': '3 Named + 5 Concurrent',
        'medium': '5 Named + 10 Concurrent',
        'large': '8 Named + 20 Concurrent'
      };
      return bundleOptions[orderData.bundleType] || 'Bundle';
    }

    const count = orderData.userCount || 1;
    const model = orderData.licenseModel;

    if (model === 'named') return `${count} Named Users`;
    if (model === 'concurrent') return `${count} Concurrent Users`;
    return `${count} Users`;
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.5rem', color: '#1a1a1a' }}>
          Review & Confirm
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Please confirm the details of your new license.
        </p>
      </div>

      {/* Review Details */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 col-md-10">
          <div
            className="bg-light p-4 rounded mb-4"
            style={{
              borderRadius: '12px',
              border: '1px solid #e9ecef'
            }}
          >
            <div className="row g-4">
              {/* Customer */}
              <div className="col-md-6">
                <h6 className="text-muted mb-2" style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Customer
                </h6>
                <p className="mb-0 fw-medium" style={{
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}>
                  {orderData.customerName || 'Acme Corporation'}
                </p>
              </div>

              {/* Edition */}
              <div className="col-md-6">
                <h6 className="text-muted mb-2" style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Edition
                </h6>
                <p className="mb-0 fw-medium" style={{
                  fontSize: '1rem',
                  color: '#1a1a1a',
                  textTransform: 'capitalize'
                }}>
                  {orderData.edition || 'Professional'}
                </p>
              </div>

              {/* License Model */}
              <div className="col-md-6">
                <h6 className="text-muted mb-2" style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  License Model
                </h6>
                <p className="mb-0 fw-medium" style={{
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}>
                  {getLicenseModelDisplay()}
                </p>
              </div>

              {/* Expires On */}
              <div className="col-md-6">
                <h6 className="text-muted mb-2" style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Expires On
                </h6>
                <p className="mb-0 fw-medium" style={{
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}>
                  {formatDate(orderData.expirationDate)}
                </p>
              </div>

              {/* Configuration */}
              <div className="col-12">
                <h6 className="text-muted mb-2" style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Configuration
                </h6>
                <p className="mb-0 fw-medium" style={{
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}>
                  {getConfigurationText()}
                </p>
              </div>

              {/* Notes (if any) */}
              {orderData.notes && (
                <div className="col-12">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Notes
                  </h6>
                  <p className="mb-0" style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    {orderData.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Total Price */}
          <div className="text-center mb-4">
            <h3 className="mb-2" style={{ fontSize: '1.25rem', color: '#1a1a1a' }}>
              Total Price
            </h3>
            <div className="d-flex align-items-baseline justify-content-center">
              <span
                className="fw-bold text-success"
                style={{ fontSize: '2.5rem' }}
              >
                ${(orderData.price || 0).toLocaleString()}
              </span>
              <span
                className="text-muted ms-2"
                style={{ fontSize: '1.1rem' }}
              >
                /{orderData.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
              </span>
            </div>

            {/* Billing cycle info */}
            {orderData.billingCycle === 'yearly' && (
              <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
                <i className="fas fa-check-circle text-success me-1"></i>
                15% savings with yearly billing
              </p>
            )}
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
          className="btn btn-primary px-5 py-3"
          onClick={handleProceedToCheckout}
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '8px',
            minWidth: '160px',
            backgroundColor: '#4f7cff',
            border: 'none'
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default ReviewConfirm;
