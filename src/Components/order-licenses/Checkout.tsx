"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserData, getAuthToken, createLicense, CreateLicenseData } from '@/services/apiService';

interface CheckoutProps {
  onNext: () => void;
  onBack: () => void;
  orderData: any;
}

interface BillingAddress {
  companyName: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const Checkout = ({ onNext, onBack, orderData }: CheckoutProps) => {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [defaultAddress, setDefaultAddress] = useState<BillingAddress>({
    companyName: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const [billingInfo, setBillingInfo] = useState<BillingAddress>({
    companyName: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  // Get API base URL from environment
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://licence.apextechno.co.uk/api';

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = () => {
      try {
        setProfileLoading(true);
        const backendData = getUserData();

        if (backendData) {
          const customer = backendData.customer;
          const contactPerson = backendData.contact_person;

          const profileAddress: BillingAddress = {
            companyName: backendData.name || customer?.customer_name || '',
            email: backendData.email || contactPerson?.email || customer?.contact_person?.email || '',
            streetAddress: customer?.company_address || '',
            city: customer?.city || '',
            state: customer?.state || '',
            zipCode: customer?.company_post_code || customer?.postal_code || '',
            country: customer?.country || 'United Kingdom'
          };

          setDefaultAddress(profileAddress);
          setBillingInfo(profileAddress);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // Update billing info when address preference changes
  useEffect(() => {
    if (useSameAddress) {
      setBillingInfo(defaultAddress);
    }
  }, [useSameAddress, defaultAddress]);

  // Helper function to get edition ID
  const getEditionId = () => {
    // Map edition names to IDs based on your backend
    if (orderData.edition?.toLowerCase() === 'enterprise') return 1;
    if (orderData.edition?.toLowerCase() === 'professional') return 2;
    return 1; // Default to Enterprise
  };

  // Helper function to get license type ID
  const getLicenseTypeId = () => {
    const model = orderData.licenseModel;
    if (model === 'named' || model === '1') return 1;
    if (model === 'concurrent' || model === '2') return 2;
    return 1; // Default to type 1
  };

  // Helper function to get expiration date (1 year from now)
  const getExpirationDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  // Helper function to get user counts
  const getUserCounts = () => {
    const totalUsers = parseInt(orderData.userCount) || 1;
    const model = orderData.licenseModel;

    if (model === 'named' || model === '1') {
      return { named: totalUsers, concurrent: 0 };
    } else if (model === 'concurrent' || model === '2') {
      return { named: 0, concurrent: totalUsers };
    } else {
      // For bundled or other types, default to named users
      return { named: totalUsers, concurrent: 0 };
    }
  };

  const handleCompleteOrder = async () => {
    try {
      setLoading(true);

      const token = getAuthToken();
      if (!token) {
        alert('Please login to complete your order');
        router.push('/auth/login');
        return;
      }

      // Get customer ID from profile data
      const userData = getUserData();
      const customerId = userData?.customer?.id || userData?.id || 1;

      // Calculate pricing
      const subtotal = orderData.price || 0;
      const taxAmount = calculateTax();
      const totalAmount = subtotal + taxAmount;

      // Prepare order data
      const orderPayload = {
        order: {
          customer_id: customerId,
          order_type_id: parseInt(orderData.orderType) || 1,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          sub_total: subtotal,
          payment_status: "completed", // Fake payment for now
          billing_address: {
            company_name: billingInfo.companyName,
            street: billingInfo.streetAddress,
            city: billingInfo.city,
            state: billingInfo.state,
            zip: billingInfo.zipCode,
            country: billingInfo.country
          },
          order_items: [
            {
              customer_id: customerId,
              license_product_id: getLicenseProductId(),
              unit_price: getUnitPrice(),
              quantity: getQuantity(),
              total: subtotal
            }
          ]
        }
      };

      console.log('Creating order with payload:', orderPayload);

      // Create order first
      const headers = new Headers();
      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");
      headers.append("Authorization", `Bearer ${token}`);

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.status} ${response.statusText}`);
      }

      const orderResult = await response.json();
      console.log('Order created successfully:', orderResult);

      // Get the order ID from the response
      const orderId = orderResult.data?.id || orderResult.id || 1;

      // Now create the license
      const userCounts = getUserCounts();
      const licenseData: CreateLicenseData = {
        order_id: orderId,
        edition_id: getEditionId(),
        license_type_id: getLicenseTypeId(),
        customer_id: customerId,
        named_user_count: userCounts.named,
        concurrent_user_count: userCounts.concurrent,
        expiration_date: getExpirationDate(),
        billing_cycle: orderData.billingCycle || 'yearly',
        notes: `License created from order ${orderId} - ${orderData.edition} ${getLicenseModelDisplay()}`
      };

      console.log('Creating license with data:', licenseData);

      // Create the license
      const licenseResult = await createLicense(licenseData);

      if (licenseResult.success) {
        console.log('License created successfully:', licenseResult);

        // Show success message
        alert('Order and license created successfully! Redirecting to dashboard...');

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        console.error('License creation failed:', licenseResult.message);

        // Even if license creation fails, the order was created
        alert(`Order created successfully, but license creation failed: ${licenseResult.message}. Please contact support.`);
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error creating order/license:', error);
      alert('Failed to complete order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for order creation
  const getLicenseProductId = () => {
    // This would need to be determined based on edition, license type, and billing cycle
    // For now, return a default value
    return 1;
  };

  const getUnitPrice = () => {
    const quantity = getQuantity();
    return quantity > 0 ? Math.round((orderData.price || 0) / quantity) : (orderData.price || 0);
  };

  const getQuantity = () => {
    if (orderData.licenseModel === 'bundled' || orderData.licenseModel === '3') {
      return 1; // Bundle is 1 item
    }
    return parseInt(orderData.userCount) || 1;
  };

  const calculateTax = () => {
    return Math.round((orderData.price || 0) * 0.08); // 8% tax
  };

  const calculateTotal = () => {
    return (orderData.price || 0) + calculateTax();
  };

  const getLicenseModelDisplay = () => {
    const model = orderData.licenseModel;
    if (model === 'named' || model === '1') return 'Named User';
    if (model === 'concurrent' || model === '2') return 'Concurrent User';
    if (model === 'bundled' || model === '3') return 'Bundled';
    return 'License';
  };

  const getConfigurationText = () => {
    if (orderData.licenseModel === 'bundled' || orderData.licenseModel === '3') {
      // For bundled, we could fetch the actual bundle name from the API
      return `Bundle Configuration (${orderData.userCount || 0} users)`;
    }

    const count = orderData.userCount || 0;
    const model = orderData.licenseModel;

    if (model === 'named' || model === '1') return `${count} Named Users`;
    if (model === 'concurrent' || model === '2') return `${count} Concurrent Users`;
    return `${count} Users`;
  };

  if (profileLoading) {
    return (
      <div className="container-fluid px-0">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading your profile information...</p>
        </div>
      </div>
    );
  }

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
                    value={defaultAddress.companyName}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  <small className="text-muted">Loaded from your profile</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={defaultAddress.email}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  <small className="text-muted">Loaded from your profile</small>
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

              {/* Address preference toggle */}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="useSameAddress"
                    checked={useSameAddress}
                    onChange={(e) => setUseSameAddress(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="useSameAddress">
                    Use same as default address from profile
                  </label>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.streetAddress}
                    onChange={(e) => setBillingInfo({...billingInfo, streetAddress: e.target.value})}
                    readOnly={useSameAddress}
                    style={{ backgroundColor: useSameAddress ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                    readOnly={useSameAddress}
                    style={{ backgroundColor: useSameAddress ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.state}
                    onChange={(e) => setBillingInfo({...billingInfo, state: e.target.value})}
                    readOnly={useSameAddress}
                    style={{ backgroundColor: useSameAddress ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">ZIP Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={billingInfo.zipCode}
                    onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                    readOnly={useSameAddress}
                    style={{ backgroundColor: useSameAddress ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Country</label>
                  <select
                    className="form-select"
                    value={billingInfo.country}
                    onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                    disabled={useSameAddress}
                    style={{ backgroundColor: useSameAddress ? '#f8f9fa' : 'white' }}
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="Australia">Australia</option>
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

              <div className="alert alert-info" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Demo Mode:</strong> Payment processing is disabled. Order and license will be created automatically.
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
                          <h6 className="mb-0">Credit Card (Demo)</h6>
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
                          <h6 className="mb-0">PayPal (Demo)</h6>
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
                          <h6 className="mb-0">Bank Transfer (Demo)</h6>
                          <small className="text-muted">Direct bank transfer (3-5 business days)</small>
                        </div>
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
            disabled={loading}
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              borderRadius: '8px'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating Order & License...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Complete Order (Demo Mode)
              </>
            )}
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
                  <span>£{(orderData.price || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax (8%)</span>
                  <span>£{calculateTax().toLocaleString()}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '1.2rem' }}>
                  <span>Total</span>
                  <span className="text-success">£{calculateTotal().toLocaleString()}</span>
                </div>
                <small className="text-muted d-block mt-1">Billed {orderData.billingCycle}</small>
              </div>

              {/* Discount Display */}
              {orderData.discountPercent && orderData.discountPercent > 0 && (
                <div className="alert alert-success p-2 mb-3">
                  <small>
                    <i className="fas fa-tag me-1"></i>
                    {orderData.discountPercent}% discount applied
                    {orderData.discountDescription && ` (${orderData.discountDescription})`}
                  </small>
                </div>
              )}

              {/* License Creation Info */}
              <div className="alert alert-info p-3">
                <h6 className="alert-heading mb-2">
                  <i className="fas fa-info-circle me-2"></i>
                  What happens next?
                </h6>
                <p className="mb-0 small">
                  After payment, your license will be automatically created and activated. You'll receive access immediately.
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
          disabled={loading}
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
