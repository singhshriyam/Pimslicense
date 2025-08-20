// /src/Components/order-licenses/LicenseSetup.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/services/apiService';

interface LicenseBundle {
  id: number;
  named_user: number;
  concurrent_user: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface LicenseProduct {
  id: number;
  license_type_id: number;
  edition_id: number;
  license_bundle_id: number | null;
  unit_price: string;
  billing_cycle: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Discount {
  id: number;
  license_type_id: number;
  billing_cycle: string;
  discount_percent: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface BundleApiResponse {
  success: boolean;
  data: LicenseBundle[];
  message: string;
}

interface ProductApiResponse {
  success: boolean;
  data: LicenseProduct[];
  message: string;
}

interface DiscountApiResponse {
  success: boolean;
  data: Discount[];
  message: string;
}

interface LicenseSetupProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  orderData: any;
}

interface BundleOption {
  id: string;
  name: string;
  description: string;
  namedUsers: number;
  concurrentUsers: number;
}

const LicenseSetup = ({ onNext, onBack, onUpdateData, orderData }: LicenseSetupProps) => {
  const [billingCycle, setBillingCycle] = useState(orderData.billingCycle || 'yearly');
  const [userCount, setUserCount] = useState(orderData.userCount || '');
  const [selectedBundle, setSelectedBundle] = useState(orderData.bundleType || '');
  const [bundleOptions, setBundleOptions] = useState<BundleOption[]>([]);
  const [loadingBundles, setLoadingBundles] = useState<boolean>(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [licenseProducts, setLicenseProducts] = useState<LicenseProduct[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loadingPricing, setLoadingPricing] = useState<boolean>(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Get API base URL from environment (same as apiService)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://licence.apextechno.co.uk/api';

  // Check if license model is bundled (handle both ID and name)
  const isBundledLicense = () => {
    const licenseModel = orderData.licenseModel;
    return licenseModel === 'bundled' ||
           licenseModel === '3' ||
           licenseModel === 3 ||
           String(licenseModel).toLowerCase().includes('bundled');
  };

  // Get edition ID from orderData
  const getEditionId = (): number => {
    if (orderData.edition === '1' || orderData.edition === 'enterprise') return 1;
    if (orderData.edition === '2' || orderData.edition === 'professional') return 2;
    return 1; // Default to enterprise
  };

  // Get license type ID from orderData
  const getLicenseTypeId = (): number => {
    if (orderData.licenseModel === '1' || orderData.licenseModel === 'named') return 1;
    if (orderData.licenseModel === '2' || orderData.licenseModel === 'concurrent') return 2;
    if (orderData.licenseModel === '3' || isBundledLicense()) return 3;
    return 1; // Default to named
  };

  // Fetch license products from API
  const fetchLicenseProducts = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      const headers = new Headers();
      headers.append("Accept", "application/json");

      if (token) {
        headers.append("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}/license-products`, {
        method: "GET",
        headers: headers,
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch license products: ${response.status}`);
      }

      const result: ProductApiResponse = await response.json();

      if (result.success && result.data) {
        setLicenseProducts(result.data);
      }
    } catch (err) {
      console.error('Error fetching license products:', err);
    }
  };

  // Fetch discounts from API
  const fetchDiscounts = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      const headers = new Headers();
      headers.append("Accept", "application/json");

      if (token) {
        headers.append("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}/discounts`, {
        method: "GET",
        headers: headers,
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch discounts: ${response.status}`);
      }

      const result: DiscountApiResponse = await response.json();

      if (result.success && result.data) {
        setDiscounts(result.data);
      }
    } catch (err) {
      console.error('Error fetching discounts:', err);
    }
  };

  // Fetch pricing data (products and discounts)
  const fetchPricingData = async (): Promise<void> => {
    try {
      setLoadingPricing(true);
      setPricingError(null);

      await Promise.all([
        fetchLicenseProducts(),
        fetchDiscounts()
      ]);
    } catch (err) {
      setPricingError(err instanceof Error ? err.message : 'Failed to load pricing data');
    } finally {
      setLoadingPricing(false);
    }
  };

  // Transform API bundle data to component format
  const transformBundleData = (apiData: LicenseBundle[]): BundleOption[] => {
    // Keep all bundles without removing duplicates
    return apiData.map(bundle => ({
      id: bundle.id.toString(),
      name: bundle.name,
      description: bundle.description,
      namedUsers: bundle.named_user,
      concurrentUsers: bundle.concurrent_user
    }));
  };

  // Fetch license bundles from API
  const fetchLicenseBundles = async (): Promise<void> => {
    try {
      setLoadingBundles(true);
      setBundleError(null);

      const token = getAuthToken();
      const headers = new Headers();
      headers.append("Accept", "application/json");

      if (token) {
        headers.append("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`${API_BASE_URL}/license-bundles`, {
        method: "GET",
        headers: headers,
        redirect: "follow"
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        switch (response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please login again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. Please contact support.';
            break;
          case 404:
            errorMessage = 'License bundles service not found.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }

        throw new Error(errorMessage);
      }

      const result: BundleApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch license bundles');
      }

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid API response format');
      }

      const transformedData = transformBundleData(result.data);
      setBundleOptions(transformedData);

    } catch (err) {
      setBundleError(err instanceof Error ? err.message : 'Failed to load license bundles');
    } finally {
      setLoadingBundles(false);
    }
  };

  // Get unit price from license products API
  const getUnitPrice = (licenseTypeId: number, editionId: number, bundleId: number | null, cycle: string): number => {
    const product = licenseProducts.find(p =>
      p.license_type_id === licenseTypeId &&
      p.edition_id === editionId &&
      p.license_bundle_id === bundleId &&
      p.billing_cycle === cycle
    );

    return product ? parseFloat(product.unit_price) : 0;
  };

  // Get applicable discount
  const getDiscount = (licenseTypeId: number, cycle: string): number => {
    const discount = discounts.find(d =>
      d.license_type_id === licenseTypeId &&
      d.billing_cycle === cycle &&
      d.is_active === 1
    );

    return discount ? parseFloat(discount.discount_percent) : 0;
  };

  // Price calculation using backend data
  const calculatePrice = () => {
    if (loadingPricing || licenseProducts.length === 0) {
      return 0; // Return 0 while loading pricing data
    }

    let basePrice = 0;
    const cycle = billingCycle;
    const licenseTypeId = getLicenseTypeId();
    const editionId = getEditionId();

    if (isBundledLicense()) {
      // Bundle pricing
      const bundle = bundleOptions.find(b => b.id === selectedBundle);
      if (bundle) {
        const bundleId = parseInt(bundle.id);
        const unitPrice = getUnitPrice(licenseTypeId, editionId, bundleId, cycle);
        const totalUsers = bundle.namedUsers + bundle.concurrentUsers;
        basePrice = unitPrice * totalUsers;
      }
    } else {
      // Regular pricing per user
      const unitPrice = getUnitPrice(licenseTypeId, editionId, null, cycle);
      const userCountNumber = parseInt(userCount) || 0;
      basePrice = unitPrice * userCountNumber;
    }

    // Apply discount if available
    const discountPercent = getDiscount(licenseTypeId, cycle);
    const discountAmount = (basePrice * discountPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return Math.round(finalPrice);
  };

  const price = calculatePrice();

  // Get current discount info for display
  const getCurrentDiscount = () => {
    const licenseTypeId = getLicenseTypeId();
    const discountPercent = getDiscount(licenseTypeId, billingCycle);
    const discount = discounts.find(d =>
      d.license_type_id === licenseTypeId &&
      d.billing_cycle === billingCycle &&
      d.is_active === 1
    );

    return {
      percent: discountPercent,
      description: discount?.description || ''
    };
  };

  const currentDiscount = getCurrentDiscount();

  // Fetch bundles when component mounts and license model is bundled
  useEffect(() => {
    if (isBundledLicense()) {
      fetchLicenseBundles();
    } else {
      setBundleOptions([]);
      setBundleError(null);
    }
  }, [orderData.licenseModel]);

  // Fetch pricing data when component mounts
  useEffect(() => {
    fetchPricingData();
  }, []);

  // Also fetch bundles when component first mounts if already bundled
  useEffect(() => {
    if (isBundledLicense() && bundleOptions.length === 0 && !loadingBundles) {
      fetchLicenseBundles();
    }
  }, []);

  // Update parent data when values change
  useEffect(() => {
    const currentDiscountData = getCurrentDiscount();

    const updateData: any = {
      billingCycle,
      price: price,
      total: price,
      // Add discount information
      currentDiscount: currentDiscountData,
      discountPercent: currentDiscountData.percent,
      discountDescription: currentDiscountData.description
    };

    if (isBundledLicense()) {
      updateData.bundleType = selectedBundle;
      const bundle = bundleOptions.find(b => b.id === selectedBundle);
      if (bundle) {
        updateData.userCount = bundle.namedUsers + bundle.concurrentUsers;
        updateData.namedUsers = bundle.namedUsers;
        updateData.concurrentUsers = bundle.concurrentUsers;
      }
    } else {
      updateData.userCount = parseInt(userCount) || 0;
    }

    onUpdateData(updateData);
  }, [billingCycle, userCount, selectedBundle, price, bundleOptions, discounts]);

  const handleContinue = () => {
    if (isBundledLicense() && !selectedBundle) {
      return; // Don't proceed if bundle not selected
    }
    onNext();
  };

  const handleRetryBundles = () => {
    fetchLicenseBundles();
  };

  const getLicenseLabel = () => {
    if (orderData.licenseModel === 'named' || orderData.licenseModel === '1') {
      return 'Number of Named Users';
    } else if (orderData.licenseModel === 'concurrent' || orderData.licenseModel === '2') {
      return 'Number of Concurrent Users';
    } else if (isBundledLicense()) {
      return 'Select Bundle';
    }
    return 'Number of Users';
  };

  const getLicenseHelperText = () => {
    if (orderData.licenseModel === 'named' || orderData.licenseModel === '1') {
      return 'Each named user will have a dedicated license slot';
    } else if (orderData.licenseModel === 'concurrent' || orderData.licenseModel === '2') {
      return 'Maximum number of users who can access simultaneously';
    } else if (isBundledLicense()) {
      return 'Pre-configured combinations for optimal flexibility';
    }
    return 'Configure your license quantities';
  };

  const canProceed = () => {
    if (isBundledLicense()) {
      return selectedBundle !== '';
    }
    return true; // Always allow proceeding for user count
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
                  Yearly
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
            {isBundledLicense() ? (
              <div className="mb-2">
                {/* Loading State for Bundles */}
                {loadingBundles && (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading bundles...</span>
                    </div>
                    <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
                      Loading available bundles...
                    </p>
                  </div>
                )}

                {/* Bundle Error State */}
                {bundleError && !loadingBundles && (
                  <div className="alert alert-danger" role="alert">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      <div className="flex-grow-1">
                        <strong>Error:</strong> {bundleError}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRetryBundles}
                      >
                        <i className="fas fa-sync-alt me-1"></i>
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Bundle Options */}
                {!loadingBundles && !bundleError && bundleOptions.length > 0 && (
                  <>
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
                                <small className="text-muted">
                                  Total: {bundle.namedUsers + bundle.concurrentUsers} users
                                </small>
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
                  </>
                )}

                {/* No Bundles Available */}
                {!loadingBundles && !bundleError && bundleOptions.length === 0 && (
                  <div className="alert alert-warning" role="alert">
                    <i className="fas fa-info-circle me-2"></i>
                    No license bundles available at this time.
                    <button
                      className="btn btn-sm btn-outline-warning ms-2"
                      onClick={handleRetryBundles}
                    >
                      <i className="fas fa-sync-alt me-1"></i>
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Regular User Count Input */
              <div className="mb-2">
                <input
                  type="number"
                  className="form-control"
                  value={userCount}
                  onChange={(e) => setUserCount(e.target.value)}
                  placeholder="Enter number of users"
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
            {loadingPricing ? (
              <div className="py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading pricing...</span>
                </div>
                <p className="text-muted mt-2 mb-0">Loading pricing information...</p>
              </div>
            ) : pricingError ? (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Unable to load pricing data
              </div>
            ) : (
              <>
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
                {currentDiscount.percent > 0 && (
                  <small className="text-success">
                    <i className="fas fa-tag me-1"></i>
                    {currentDiscount.percent}% discount applied ({currentDiscount.description})
                  </small>
                )}
              </>
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
