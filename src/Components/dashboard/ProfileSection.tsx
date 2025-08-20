"use client";
import React, { useState, useEffect } from 'react';
import { getUserData } from '@/services/apiService';

interface UserProfile {
  contactPerson: string;
  email: string;
  mobile: string;
  company: string;
  address: string;
  role: string;
  customerId: string;
}

const ProfileSection = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    contactPerson: '',
    email: '',
    mobile: '',
    company: '',
    address: '',
    role: '',
    customerId: ''
  });

  // Load data directly from backend response
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        // Get the exact backend data
        const backendData = getUserData();

        console.log('📊 ProfileSection: Loading profile data');
        console.log('📊 ProfileSection: Backend data:', backendData);

        if (backendData) {
          // Extract data exactly as it comes from backend
          const contactPerson = backendData.contact_person;
          const customer = backendData.customer;

          console.log('📊 ProfileSection: Contact person:', contactPerson);
          console.log('📊 ProfileSection: Customer:', customer);

          setUserProfile({
            contactPerson: contactPerson?.first_name ?
              `${contactPerson.first_name} ${contactPerson.last_name || ''}`.trim() :
              'Not provided',
            email: backendData.email || contactPerson?.email || customer?.contact_person?.email || 'Not provided',
            mobile: contactPerson?.phone || customer?.contact_person?.phone || 'Not provided',
            company: backendData.name || customer?.customer_name || 'Not provided',
            address: customer?.company_address || 'Not provided',
            role: contactPerson?.role || customer?.contact_person?.role || 'Not provided',
            customerId: customer?.customerid || customer?.customer_id || 'Not provided'
          });
        } else {
          console.log('⚠️ ProfileSection: No backend data found in localStorage');
          // Set default values when no data is available
          setUserProfile({
            contactPerson: 'Not provided',
            email: 'Not provided',
            mobile: 'Not provided',
            company: 'Not provided',
            address: 'Not provided',
            role: 'Not provided',
            customerId: 'Not provided'
          });
        }

      } catch (error) {
        console.error('❌ ProfileSection: Error loading user profile:', error);
        // Set default values on error
        setUserProfile({
          contactPerson: 'Not provided',
          email: 'Not provided',
          mobile: 'Not provided',
          company: 'Not provided',
          address: 'Not provided',
          role: 'Not provided',
          customerId: 'Not provided'
        });
      }
    };

    loadUserProfile();
  }, []);

  return (
    <div className="card h-100 border-0 shadow-sm">
      {/* Card Header */}
      <div className="card-header bg-white border-bottom">
        <h3 className="mb-0 fw-bold">Profile Details</h3>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Contact Person */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Contact Person</label>
          <p className="mb-0 fw-medium text-end">{userProfile.contactPerson}</p>
        </div>

        {/* Email */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Email</label>
          <p className="mb-0 fw-medium text-end text-break">{userProfile.email}</p>
        </div>

        {/* Role */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Role</label>
          <p className="mb-0 fw-medium text-end">{userProfile.role}</p>
        </div>

        {/* Mobile */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Mobile</label>
          <p className="mb-0 fw-medium text-end">{userProfile.mobile}</p>
        </div>

        {/* Company */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Company</label>
          <p className="mb-0 fw-medium text-end">{userProfile.company}</p>
        </div>

        {/* Customer ID */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Customer ID</label>
          <p className="mb-0 fw-medium text-end">{userProfile.customerId}</p>
        </div>

        {/* Address */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Address</label>
          <p className="mb-0 fw-medium text-end text-break">{userProfile.address}</p>
        </div>

        {/* Update Button */}
        <div className="mt-4">
          <button className="btn btn-outline-primary w-100">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
