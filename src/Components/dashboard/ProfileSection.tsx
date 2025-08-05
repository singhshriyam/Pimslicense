"use client";
import React, { useState, useEffect } from 'react';

interface UserProfile {
  contactPerson: string;
  email: string;
  mobile: string;
  company: string;
  address: string;
}

const ProfileSection = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    contactPerson: '',
    email: '',
    mobile: '',
    company: '',
    address: ''
  });

  // Load data from localStorage
  useEffect(() => {
    const firstName = localStorage.getItem('userFirstName') || '';
    const lastName = localStorage.getItem('userLastName') || '';
    const email = localStorage.getItem('userEmail') || '';
    const mobile = localStorage.getItem('userMobile') || 'Not provided';
    const company = localStorage.getItem('userCompany') || '';
    const address = localStorage.getItem('userAddress') || '';

    setUserProfile({
      contactPerson: `${firstName} ${lastName}`.trim() || 'Not provided',
      email: email || 'Not provided',
      mobile: mobile,
      company: company || 'Not provided',
      address: address || 'Not provided'
    });
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
          <p className="mb-0 fw-medium text-end">{userProfile.email}</p>
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

        {/* Address */}
        <div className="mb-3 d-flex justify-content-between">
          <label className="text-muted small">Address</label>
          <p className="mb-0 fw-medium text-end">{userProfile.address}</p>
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
