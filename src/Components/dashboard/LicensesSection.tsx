"use client";
import React from 'react';

interface License {
  id: number;
  name: string;
  users: number;
  userType: string;
  status: 'Active' | 'Expired' | 'Pending';
  expiryDate: string;
}

const LicensesSection = () => {
  // Mock license data
  const licenses: License[] = [
    {
      id: 1,
      name: 'Professional Suite',
      users: 10,
      userType: 'named user users',
      status: 'Active',
      expiryDate: 'Dec 31, 2024'
    },
    {
      id: 2,
      name: 'Developer Tools',
      users: 5,
      userType: 'concurrent user users',
      status: 'Active',
      expiryDate: 'Mar 14, 2025'
    },
    {
      id: 3,
      name: 'Professional Suite',
      users: 1,
      userType: 'named user users',
      status: 'Active',
      expiryDate: 'Dec 31, 2024'
    }
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success';
      case 'Expired':
        return 'bg-danger';
      case 'Pending':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="card h-100 border-0 shadow-sm">
      {/* Card Header with View All link */}
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h3 className="mb-0 fw-bold">Current Licenses</h3>
        <a href="#" className="text-primary text-decoration-none small d-flex align-items-center">
          View All
          <span className="ms-1">🔗</span>
        </a>
      </div>

      {/* Card Body */}
      <div className="card-body p-0">
        {/* License list */}
        <div className="list-group list-group-flush">
          {licenses.map((license) => (
            <div key={license.id} className="list-group-item border-0 px-3 py-3">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-medium">{license.name}</h6>
                  <p className="mb-2 text-muted small">
                    {license.users} {license.userType}
                  </p>
                </div>
                <div className="text-end">
                  <span className={`badge ${getStatusBadgeClass(license.status)} mb-1`}>
                    {license.status}
                  </span>
                  <div className="text-muted small">Expires {license.expiryDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LicensesSection;
