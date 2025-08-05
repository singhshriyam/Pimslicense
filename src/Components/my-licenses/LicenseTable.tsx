"use client";
import React from 'react';

interface License {
  id: number;
  licenseName: string;
  type: string;
  users: number;
  status: 'Active' | 'Expired' | 'Pending';
  startDate: string;
  endDate: string;
  totalCost: string;
  costPerUser: string;
}

const LicenseTable = () => {
  // Mock license data based on the image
  const licenses: License[] = [
    {
      id: 1,
      licenseName: 'Professional Suite',
      type: 'Named User',
      users: 1,
      status: 'Active',
      startDate: 'Jul 28, 2025',
      endDate: 'Jul 28, 2026',
      totalCost: '$199',
      costPerUser: '$199/user'
    },
    {
      id: 2,
      licenseName: 'Developer Tools',
      type: 'Concurrent User',
      users: 5,
      status: 'Active',
      startDate: 'Mar 14, 2024',
      endDate: 'Mar 14, 2025',
      totalCost: '$1,245',
      costPerUser: '$249/user'
    },
    {
      id: 3,
      licenseName: 'Enterprise Suite',
      type: 'Named User',
      users: 10,
      status: 'Active',
      startDate: 'Jan 15, 2024',
      endDate: 'Jan 15, 2025',
      totalCost: '$1,990',
      costPerUser: '$199/user'
    }
  ];

  const getStatusBadge = (status: string) => {
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

  const handleViewDetails = (licenseId: number) => {
    // View details functionality
    alert(`View details for license ID: ${licenseId}`);
  };

  return (
    <div className="card border-0 shadow-sm">
      {/* Card Header */}
      <div className="card-header bg-white border-bottom">
        <h6 className="mb-0 fw-bold">License Details</h6>
      </div>

      {/* Card Body with Table */}
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th className="border-0 px-4 py-4 fw-normal text-muted">License Name</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">Type</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">Users</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">Status</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">Start Date</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">End Date</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">Total Cost</th>
                <th className="border-0 px-4 py-4 fw-normal text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license, index) => (
                <tr
                  key={license.id}
                  style={{
                    borderBottom: index === licenses.length - 1 ? 'none' : '1px solid #f8f9fa'
                  }}
                >
                  {/* License Name - Clean, no subtitle */}
                  <td className="px-4 py-4">
                    <div>
                      <span className="fw-medium text-dark">{license.licenseName}</span>
                      <br />
                      <small className="text-muted">new license</small>
                    </div>
                  </td>

                  {/* Type - Simple text, no badge */}
                  <td className="px-4 py-4">
                    <span className="text-dark">{license.type}</span>
                  </td>

                  {/* Users - Just number with small icon */}
                  <td className="px-4 py-4">
                    <span className="text-dark me-1">👤</span>
                    <span className="text-dark">{license.users}</span>
                  </td>

                  {/* Status - Subtle badge */}
                  <td className="px-4 py-4">
                    <span
                      className="badge px-3 py-2"
                      style={{
                        backgroundColor: '#e8f5e8',
                        color: '#2e7d32',
                        fontWeight: 'normal',
                        fontSize: '12px'
                      }}
                    >
                      {license.status}
                    </span>
                  </td>

                  {/* Start Date - Clean, with small icon */}
                  <td className="px-4 py-4">
                    <span className="text-dark me-1">📅</span>
                    <span className="text-dark">{license.startDate}</span>
                  </td>

                  {/* End Date - Clean, with small icon */}
                  <td className="px-4 py-4">
                    <span className="text-dark me-1">📅</span>
                    <span className="text-dark">{license.endDate}</span>
                  </td>

                  {/* Total Cost - Clean typography */}
                  <td className="px-4 py-4">
                    <div>
                      <span className="text-dark fw-medium">{license.totalCost}</span>
                      <br />
                      <small className="text-muted">{license.costPerUser}</small>
                    </div>
                  </td>

                  {/* Actions - Simple icon button */}
                  <td className="px-4 py-4">
                    <button
                      className="btn btn-sm p-2"
                      onClick={() => handleViewDetails(license.id)}
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px'
                      }}
                    >
                      <span style={{ color: '#6c757d' }}>👁️</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LicenseTable;
