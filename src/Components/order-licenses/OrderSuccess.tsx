// /src/Components/order-licenses/OrderSuccess.tsx
"use client";
import React from 'react';

interface OrderSuccessProps {
  orderData: any;
  onStartNew: () => void;
}

const OrderSuccess = ({ orderData, onStartNew }: OrderSuccessProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLicenseModelDisplay = () => {
    const model = orderData.licenseModel;
    if (model === 'named') return 'Named User';
    if (model === 'concurrent') return 'Concurrent User';
    if (model === 'bundled') return 'Bundled';
    return model;
  };

  const getOrderTypeDisplay = () => {
    const type = orderData.orderType;
    if (type === 'demo-license') return 'Demo License';
    if (type === 'new-license') return 'New License';
    if (type === 'renewal') return 'License Renewal';
    if (type === 'upgrade') return 'License Upgrade';
    return 'License Order';
  };

  return (
    <div className="container-fluid px-0">
      {/* Success Header */}
      <div className="text-center mb-5">
        <div className="mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success"
            style={{ width: '80px', height: '80px' }}
          >
            <i className="fas fa-check text-white" style={{ fontSize: '2.5rem' }}></i>
          </div>
        </div>

        <h1 className="fw-bold mb-3" style={{ fontSize: '2rem', color: '#1a1a1a' }}>
          License Created Successfully!
        </h1>

        <p className="text-muted mb-0" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Your {getOrderTypeDisplay().toLowerCase()} has been processed and is ready for use.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 col-md-10">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: '16px' }}
          >
            <div className="card-header bg-transparent border-0 pt-4 pb-0">
              <h3 className="text-center fw-bold mb-0" style={{ fontSize: '1.5rem', color: '#1a1a1a' }}>
                Order Summary
              </h3>
            </div>

            <div className="card-body p-4">
              <div className="row g-4 mb-4">
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
                  <p className="mb-0 fw-medium" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {orderData.customerName}
                  </p>
                </div>

                {/* Order Type */}
                <div className="col-md-6">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Order Type
                  </h6>
                  <p className="mb-0 fw-medium" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {getOrderTypeDisplay()}
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
                    {orderData.edition}
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
                  <p className="mb-0 fw-medium" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {getLicenseModelDisplay()}
                  </p>
                </div>

                {/* User Count */}
                <div className="col-md-6">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Users
                  </h6>
                  <p className="mb-0 fw-medium" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {orderData.userCount} {orderData.userCount === 1 ? 'User' : 'Users'}
                  </p>
                </div>

                {/* Billing */}
                <div className="col-md-6">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Billing Cycle
                  </h6>
                  <p className="mb-0 fw-medium" style={{
                    fontSize: '1rem',
                    color: '#1a1a1a',
                    textTransform: 'capitalize'
                  }}>
                    {orderData.billingCycle}
                  </p>
                </div>

                {/* Expiration */}
                <div className="col-md-6">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Expires On
                  </h6>
                  <p className="mb-0 fw-medium" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
                    {formatDate(orderData.expirationDate)}
                  </p>
                </div>

                {/* Total Price */}
                <div className="col-md-6">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Price
                  </h6>
                  <p className="mb-0 fw-bold text-success" style={{ fontSize: '1.2rem' }}>
                    ${(orderData.price || 0).toLocaleString()}
                    <span className="text-muted fw-normal" style={{ fontSize: '0.9rem' }}>
                      /{orderData.billingCycle}
                    </span>
                  </p>
                </div>
              </div>

              {/* Notes (if any) */}
              {orderData.notes && (
                <div className="border-top pt-4">
                  <h6 className="text-muted mb-2" style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Notes
                  </h6>
                  <p className="mb-0 text-muted" style={{
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    {orderData.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 col-md-10">
          <div className="text-center mb-4">
            <h4 className="fw-bold mb-3" style={{ fontSize: '1.3rem', color: '#1a1a1a' }}>
              What's Next?
            </h4>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="text-center p-4 bg-light rounded" style={{ borderRadius: '12px' }}>
                <div className="mb-3">
                  <i className="fas fa-download text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <h6 className="fw-bold mb-2">Download License</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Get your license file to activate the software
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-center p-4 bg-light rounded" style={{ borderRadius: '12px' }}>
                <div className="mb-3">
                  <i className="fas fa-users text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <h6 className="fw-bold mb-2">Manage Users</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Add and configure user access permissions
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="text-center p-4 bg-light rounded" style={{ borderRadius: '12px' }}>
                <div className="mb-3">
                  <i className="fas fa-life-ring text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <h6 className="fw-bold mb-2">Get Support</h6>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Access help documentation and support resources
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center">
        <button
          className="btn btn-primary btn-lg px-5 py-3 me-3"
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '8px',
            minWidth: '160px'
          }}
        >
          <i className="fas fa-download me-2"></i>
          Download License
        </button>

        <button
          className="btn btn-outline-secondary btn-lg px-5 py-3"
          onClick={onStartNew}
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '8px',
            minWidth: '160px'
          }}
        >
          <i className="fas fa-plus me-2"></i>
          Create Another
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
