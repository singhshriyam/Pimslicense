// /src/Components/order-licenses/Checkout.tsx
"use client";
import React, { useState } from 'react';

interface CheckoutProps {
  onNext: () => void;
  onBack: () => void;
  orderData: any;
}

const Checkout = ({ onNext, onBack, orderData }: CheckoutProps) => {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [billingInfo, setBillingInfo] = useState({
    companyName: orderData.customerName || 'Acme Corporation',
    email: 'admin@yourcompany.com',
    streetAddress: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States'
  });

  const handleCompleteOrder = () => {
    // Here you would process the payment
    console.log('Processing payment with:', { paymentMethod, billingInfo, orderData });
    onNext();
  };

  const calculateTax = () => {
    return Math.round(orderData.price * 0.08); // 8% tax
  };

  const calculateTotal = () => {
    return orderData.price + calculateTax();
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
      const bundleOptions: Record<string, string> = {
        small: '4 Named + 10 Concurrent',
        medium: '6 Named + 15 Concurrent',
        large: '8 Named + 20 Concurrent'
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
      <div className="row">
        {/* Left Column - Payment Form */}
        <div className="col-lg-8">
          {/* Customer Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-building me-2 text-muted"></i>
                <h5 className="mb-0 fw-bold">Customer Information</h5>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.companyName}
                    onChange={(e) => setBillingInfo({...billingInfo, companyName: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-map-marker-alt me-2 text-muted"></i>
                <h5 className="mb-0 fw-bold">Billing Address</h5>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.streetAddress}
                    onChange={(e) => setBillingInfo({...billingInfo, streetAddress: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.state}
                    onChange={(e) => setBillingInfo({...billingInfo, state: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">ZIP Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.zipCode}
                    onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Country</label>
                  <select
                    className="form-select"
                    value={billingInfo.country}
                    onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-credit-card me-2 text-muted"></i>
                <h5 className="mb-0 fw-bold">Payment Method</h5>
              </div>

              <div className="row g-3">
                {/* Credit Card */}
                <div className="col-12">
                  <div
                    className={`card cursor-pointer ${paymentMethod === 'credit-card' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                    onClick={() => setPaymentMethod('credit-card')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-credit-card me-3"></i>
                        <div>
                          <h6 className="mb-0">Credit Card</h6>
                          <small className="text-muted">Visa, MasterCard, American Express</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PayPal */}
                <div className="col-12">
                  <div
                    className={`card cursor-pointer ${paymentMethod === 'paypal' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                    onClick={() => setPaymentMethod('paypal')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <i className="fab fa-paypal me-3"></i>
                        <div>
                          <h6 className="mb-0">PayPal</h6>
                          <small className="text-muted">Pay with your PayPal account</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="col-12">
                  <div
                    className={`card cursor-pointer ${paymentMethod === 'bank-transfer' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                    onClick={() => setPaymentMethod('bank-transfer')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-university me-3"></i>
                        <div>
                          <h6 className="mb-0">Bank Transfer</h6>
                          <small className="text-muted">Direct bank transfer (3-5 business days)</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Payment */}
                <div className="col-12">
                  <div
                    className={`card cursor-pointer ${paymentMethod === 'invoice' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                    onClick={() => setPaymentMethod('invoice')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-file-invoice me-3"></i>
                          <div>
                            <h6 className="mb-0">Invoice Payment</h6>
                            <small className="text-muted">Net 30 payment terms</small>
                          </div>
                        </div>
                        <span className="badge bg-warning text-dark">Enterprise Only</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Order Button */}
          <button
            className="btn btn-primary btn-lg w-100 py-3 mb-4"
            onClick={handleCompleteOrder}
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '8px'
            }}
          >
            <i className="fas fa-lock me-2"></i>
            Complete Order & Pay Now
          </button>
        </div>

        {/* Right Column - Order Summary */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm position-sticky" style={{ top: '20px' }}>
            <div className="card-body p-4">
              <h5 className="mb-4 fw-bold">Order Summary</h5>

              {/* License Details */}
              <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                <div className="rounded bg-dark d-flex align-items-center justify-content-center me-3"
                     style={{ width: '40px', height: '40px' }}>
                  <i className="fas fa-shield-alt text-white"></i>
                </div>
                <div>
                  <h6 className="mb-0 text-capitalize">{orderData.edition} License</h6>
                  <small className="text-muted">{getLicenseModelDisplay()}</small>
                </div>
              </div>

              {/* Configuration */}
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-users text-primary me-2"></i>
                  <span className="fw-medium">{getConfigurationText()}</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-calendar text-success me-2"></i>
                  <span className="text-capitalize fw-medium">{orderData.billingCycle} Billing</span>
                </div>
              </div>

              <hr />

              {/* Pricing Breakdown */}
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>License Subtotal</span>
                  <span>${orderData.price.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax (8%)</span>
                  <span>${calculateTax().toLocaleString()}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '1.2rem' }}>
                  <span>Total</span>
                  <span className="text-success">${calculateTotal().toLocaleString()}</span>
                </div>
                <small className="text-muted d-block mt-1">Billed {orderData.billingCycle}</small>
              </div>

              {/* Payment Schedule */}
              <div className="alert alert-info p-3">
                <h6 className="alert-heading mb-2">
                  <i className="fas fa-info-circle me-2"></i>
                  Payment Schedule
                </h6>
                <p className="mb-0 small">
                  Annual payment due on license activation
                </p>
              </div>
            </div>
          </div>
        </div>
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
};

export default Checkout;
