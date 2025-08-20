"use client";
import React, { useState, useEffect } from 'react';
import { getUserData } from '@/services/apiService';

interface LicenseDetailsProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  orderData: any;
}

const LicenseDetails = ({ onNext, onBack, onUpdateData, orderData }: LicenseDetailsProps) => {
  const [customerName, setCustomerName] = useState(orderData.customerName || '');
  const [expirationDate, setExpirationDate] = useState(orderData.expirationDate || '');
  const [notes, setNotes] = useState(orderData.notes || '');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Load customer name from user data on component mount
  useEffect(() => {
    const loadCustomerName = () => {
      try {
        setIsLoadingUserData(true);
        const backendData = getUserData();

        console.log('🔍 Backend data from localStorage:', backendData); // Debug log

        if (backendData) {
          // Use the same logic as ProfileSection to get company name
          let customerNameFromData = '';

          const customer = backendData.customer;

          // Follow the same pattern as ProfileSection
          if (backendData.name) {
            customerNameFromData = backendData.name;
            console.log('✅ Found backendData.name:', customerNameFromData);
          } else if (customer?.customer_name) {
            customerNameFromData = customer.customer_name;
            console.log('✅ Found customer.customer_name:', customerNameFromData);
          } else {
            console.log('❌ No company name found in backend data');
          }

          // Update customer name if we found one
          if (customerNameFromData) {
            console.log('📝 Setting customer name to:', customerNameFromData);
            setCustomerName(customerNameFromData);
          }
        } else {
          console.log('❌ No backend data found');
        }
      } catch (error) {
        console.error('❌ Error loading customer name from backend data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadCustomerName();
  }, []);

  // Set default expiration date (1 year from now)
  useEffect(() => {
    if (!expirationDate) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const defaultDate = nextYear.toISOString().split('T')[0];
      setExpirationDate(defaultDate);
    }
  }, [expirationDate]);

  // Update parent data when values change
  useEffect(() => {
    onUpdateData({
      customerName,
      expirationDate,
      notes
    });
  }, [customerName, expirationDate, notes]);

  const handleContinue = () => {
    if (customerName.trim() && expirationDate) {
      onNext();
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="fw-bold mb-2" style={{ fontSize: '1.2rem', color: '#1a1a1a' }}>License Details</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Final configuration and metadata
        </p>
      </div>

      {/* Details Form */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 col-md-10">

          {/* Customer Name */}
          <div className="mb-4">
            <label className="form-label fw-bold mb-2" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
              Customer Name *
            </label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={isLoadingUserData ? "Loading customer name..." : "Enter customer name"}
                disabled={isLoadingUserData}
                style={{
                  borderRadius: '8px',
                  fontSize: '1rem',
                  padding: '6px 16px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: isLoadingUserData ? '#f0f0f0' : '#f8f9fa',
                  opacity: isLoadingUserData ? 0.7 : 1
                }}
              />
              {isLoadingUserData && (
                <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
            <small className="text-muted">
              {customerName && !isLoadingUserData ?
                "Customer name loaded from your profile" :
                "This will be pre-filled from your account information"
              }
            </small>
          </div>

          {/* Expiration Date */}
          <div className="mb-4">
            <label className="form-label fw-bold mb-2" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
              Expiration Date *
            </label>
            <div className="position-relative">
              <input
                type="date"
                className="form-control"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                style={{
                  borderRadius: '8px',
                  fontSize: '1rem',
                  padding: '6px 16px',
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
            <small className="text-muted">
              License will expire on this date (default: 1 year from today)
            </small>
          </div>

          {/* Notes (Optional) */}
          <div className="mb-4">
            <label className="form-label fw-bold mb-2" style={{ fontSize: '1rem', color: '#1a1a1a' }}>
              Notes (Optional)
            </label>
            <textarea
              className="form-control"
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or requirements..."
              style={{
                borderRadius: '8px',
                fontSize: '1rem',
                padding: '6px 16px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa',
                resize: 'vertical'
              }}
            />
            <small className="text-muted">
              Optional: Add any special requirements or notes for this license
            </small>
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
          className="btn btn-primary px-5 py-1"
          onClick={handleContinue}
          disabled={!customerName.trim() || !expirationDate || isLoadingUserData}
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

export default LicenseDetails;
