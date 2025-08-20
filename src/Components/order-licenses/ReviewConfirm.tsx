// /src/Components/order-licenses/ReviewConfirm.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/services/apiService';

interface Edition {
  id: number;
  name: string;
  description: string;
}

interface LicenseType {
  id: number;
  name: string;
  description: string;
}

interface LicenseBundle {
  id: number;
  named_user: number;
  concurrent_user: number;
  name: string;
  description: string;
}

interface ApiResponse {
  success: boolean;
  data: any[];
  message: string;
}

interface ReviewConfirmProps {
  onNext: () => void;
  onBack: () => void;
  orderData: any;
}

const ReviewConfirm = ({ onNext, onBack, orderData }: ReviewConfirmProps) => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [licenseBundles, setLicenseBundles] = useState<LicenseBundle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Get API base URL from environment
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://licence.apextechno.co.uk/api';

  // Fetch all required data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers = new Headers();
        headers.append("Accept", "application/json");

        if (token) {
          headers.append("Authorization", `Bearer ${token}`);
        }

        const requestOptions: RequestInit = {
          method: "GET",
          headers: headers,
          redirect: "follow"
        };

        // Fetch all required data in parallel
        const [editionsRes, licenseTypesRes, bundlesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/editions`, requestOptions),
          fetch(`${API_BASE_URL}/licence-types`, requestOptions),
          fetch(`${API_BASE_URL}/license-bundles`, requestOptions)
        ]);

        // Process editions
        if (editionsRes.ok) {
          const editionsData: ApiResponse = await editionsRes.json();
          if (editionsData.success && editionsData.data) {
            setEditions(editionsData.data);
          }
        }

        // Process license types
        if (licenseTypesRes.ok) {
          const licenseTypesData: ApiResponse = await licenseTypesRes.json();
          if (licenseTypesData.success && licenseTypesData.data) {
            setLicenseTypes(licenseTypesData.data);
          }
        }

        // Process bundles
        if (bundlesRes.ok) {
          const bundlesData: ApiResponse = await bundlesRes.json();
          if (bundlesData.success && bundlesData.data) {
            setLicenseBundles(bundlesData.data);
          }
        }

      } catch (error) {
        console.error('Error fetching review data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleProceedToCheckout = () => {
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

  // Get edition name by ID
  const getEditionName = () => {
    if (loading) return 'Loading...';

    const editionId = parseInt(orderData.edition) || 0;
    const edition = editions.find(e => e.id === editionId);
    return edition ? edition.name : orderData.edition || 'Unknown';
  };

  // Get license model name by ID
  const getLicenseModelName = () => {
    if (loading) return 'Loading...';

    const licenseModelId = parseInt(orderData.licenseModel) || 0;
    const licenseType = licenseTypes.find(lt => lt.id === licenseModelId);
    return licenseType ? licenseType.name : orderData.licenseModel || 'Unknown';
  };

  // Get configuration text
  const getConfigurationText = () => {
    if (loading) return 'Loading...';

    const licenseModelId = parseInt(orderData.licenseModel) || 0;

    // Check if it's bundled (assuming bundled has ID 3)
    if (licenseModelId === 3 || orderData.licenseModel === 'bundled') {
      if (orderData.bundleType) {
        const bundleId = parseInt(orderData.bundleType);
        const bundle = licenseBundles.find(b => b.id === bundleId);
        if (bundle) {
          return `${bundle.name} (${bundle.named_user + bundle.concurrent_user} total users)`;
        }
      }
      return 'Bundle Configuration';
    }

    // For named/concurrent users
    const count = orderData.userCount || 0;
    const licenseType = licenseTypes.find(lt => lt.id === licenseModelId);
    const typeName = licenseType ? licenseType.name : 'Users';

    return `${count} ${typeName}${count !== 1 ? 's' : ''}`;
  };

  // Get discount info from orderData (this should come from your pricing calculation)
  const getDiscountInfo = () => {
    // Check if there's actual discount data from the pricing calculation
    if (orderData.discountPercent && orderData.discountPercent > 0) {
      return {
        hasDiscount: true,
        percent: orderData.discountPercent,
        text: `${orderData.discountPercent}% discount applied${orderData.discountDescription ? ` (${orderData.discountDescription})` : ''}`
      };
    }

    // Check if there's a currentDiscount object
    if (orderData.currentDiscount && orderData.currentDiscount.percent > 0) {
      return {
        hasDiscount: true,
        percent: orderData.currentDiscount.percent,
        text: `${orderData.currentDiscount.percent}% discount applied${orderData.currentDiscount.description ? ` (${orderData.currentDiscount.description})` : ''}`
      };
    }

    // Check if there's direct discount field
    if (orderData.discount && orderData.discount > 0) {
      return {
        hasDiscount: true,
        percent: orderData.discount,
        text: `${orderData.discount}% discount applied`
      };
    }

    return {
      hasDiscount: false,
      percent: 0,
      text: ''
    };
  };

  const discountInfo = getDiscountInfo();

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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading review data...</span>
          </div>
          <p className="text-muted mt-2">Loading license details...</p>
        </div>
      )}

      {/* Review Details */}
      {!loading && (
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8 col-md-10">
            <div
              className="bg-white p-4 rounded mb-4"
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid #f0f0f0'
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
                    {orderData.customerName || 'Not specified'}
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
                    color: '#1a1a1a'
                  }}>
                    {getEditionName()}
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
                    {getLicenseModelName()}
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

                {/* Billing Cycle */}
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
                    {orderData.billingCycle || 'Yearly'}
                  </p>
                </div>

                {/* Configuration */}
                <div className="col-md-6">
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
                  style={{ fontSize: '1.75rem' }}
                >
                  £{(orderData.price || 0).toLocaleString()}
                </span>
                <span
                  className="text-muted ms-2"
                  style={{ fontSize: '0.9rem' }}
                >
                  /{orderData.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
                </span>
              </div>

              {/* Discount info below price */}
              {discountInfo.hasDiscount && (
                <div className="mt-3">
                  <p className="text-success mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                    <i className="fas fa-tag me-2"></i>
                    {discountInfo.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          className="btn btn-primary px-5 py-1"
          onClick={handleProceedToCheckout}
          disabled={loading}
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '8px',
            minWidth: '160px',
            backgroundColor: '#4f7cff',
            border: 'none'
          }}
        >
          {loading ? 'Loading...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
};

export default ReviewConfirm;
