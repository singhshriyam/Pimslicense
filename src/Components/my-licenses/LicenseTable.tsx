"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  getLicenses,
  getEditions,
  getLicenseProducts,
  isAuthenticated,
  ApiResponse
} from '../../services/apiService';
import FilterSearch from './FilterSearch';

// Types for API responses
interface LicenseApiResponse {
  id: number;
  order_id: number;
  edition_id: number;
  license_type_id: number;
  customer_id: number;
  named_user_count: number;
  concurrent_user_count: number;
  expiration_date: string;
  billing_cycle: string;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Edition {
  id: number;
  name: string;
  description: string;
  created_at: string;
  modules: Array<{
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    pivot: {
      edition_id: number;
      module_id: number;
    };
  }>;
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
  const [allLicenses, setAllLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Transform API data to table format
  const transformLicenseData = (
    licensesData: LicenseApiResponse[],
    editionsData: Edition[],
    licenseProductsData: LicenseProduct[]
  ): License[] => {
    // Create maps for quick lookup
    const editionsMap = new Map<number, Edition>();
    editionsData.forEach(edition => {
      editionsMap.set(edition.id, edition);
    });

    const licenseProductsMap = new Map<string, LicenseProduct>();
    licenseProductsData.forEach(product => {
      const key = `${product.edition_id}-${product.license_type_id}`;
      licenseProductsMap.set(key, product);
    });

    return licensesData
      .filter(license => !license.deleted_at) // Filter out deleted licenses
      .map(license => {
        const edition = editionsMap.get(license.edition_id);
        const productKey = `${license.edition_id}-${license.license_type_id}`;
        const product = licenseProductsMap.get(productKey);

        // Calculate user details
        const namedUsers = license.named_user_count;
        const concurrentUsers = license.concurrent_user_count;
        const totalUsers = namedUsers + concurrentUsers;

        // Determine license type
        let licenseType = '';
        if (namedUsers > 0 && concurrentUsers > 0) {
          licenseType = `Mixed (${namedUsers} Named, ${concurrentUsers} Concurrent)`;
        } else if (namedUsers > 0) {
          licenseType = 'Named User';
        } else if (concurrentUsers > 0) {
          licenseType = 'Concurrent User';
        } else {
          licenseType = 'Not Assigned';
        }

        // Calculate status based on expiration date
        const expirationDate = new Date(license.expiration_date);
        const createdDate = new Date(license.created_at);
        const now = new Date();

        let status: 'Active' | 'Expired' | 'Pending' = 'Pending';
        if (expirationDate > now) {
          status = 'Active';
        } else {
          status = 'Expired';
        }

        // Format dates
        const startDate = createdDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const endDate = expirationDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Calculate costs
        let totalCost = '£0';
        let costPerUser = '£0/user';

        if (product) {
          const unitPrice = parseFloat(product.unit_price);

          // Calculate based on billing cycle
          let annualPrice = unitPrice;
          if (product.billing_cycle === 'monthly') {
            annualPrice = unitPrice * 12;
          }

          // Calculate total cost (price × users)
          const totalAnnualCost = annualPrice * Math.max(totalUsers, 1);
          totalCost = `£${totalAnnualCost.toLocaleString()}`;

          // Calculate cost per user
          if (totalUsers > 0) {
            costPerUser = `£${Math.round(totalAnnualCost / totalUsers).toLocaleString()}/user`;
          } else {
            costPerUser = `£${annualPrice.toLocaleString()}/license`;
          }
        }

        return {
          id: license.id,
          licenseName: edition?.name || 'Unknown License',
          type: licenseType,
          users: totalUsers,
          status,
          startDate,
          endDate,
          totalCost,
          costPerUser
        };
      });
  };

  // Filter licenses based on search and filters
  const filteredLicenses = useMemo(() => {
    return allLicenses.filter(license => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        license.licenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.id.toString().includes(searchTerm) ||
        license.type.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'All Status' || license.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'All Types' ||
        (typeFilter === 'Mixed' && license.type.includes('Mixed')) ||
        (typeFilter !== 'Mixed' && license.type === typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allLicenses, searchTerm, statusFilter, typeFilter]);

  // Export function
  const handleExport = () => {
    if (filteredLicenses.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['License ID', 'License Name', 'Type', 'Users', 'Status', 'Start Date', 'End Date', 'Total Cost', 'Cost Per User'];
    const csvContent = [
      headers.join(','),
      ...filteredLicenses.map(license => [
        license.id,
        `"${license.licenseName}"`,
        `"${license.type}"`,
        license.users,
        license.status,
        `"${license.startDate}"`,
        `"${license.endDate}"`,
        `"${license.totalCost}"`,
        `"${license.costPerUser}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `licenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      if (!isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);

      // Fetch all required data
      const [licensesResponse, editionsResponse, licenseProductsResponse] = await Promise.all([
        getLicenses(),
        getEditions(),
        getLicenseProducts()
      ]);

      // Check if all requests were successful
      if (!licensesResponse.success || !editionsResponse.success || !licenseProductsResponse.success) {
        throw new Error('Failed to fetch data from API');
      }

      // Transform and set data
      const transformedLicenses = transformLicenseData(
        licensesResponse.data || [],
        editionsResponse.data || [],
        licenseProductsResponse.data || []
      );

      setAllLicenses(transformedLicenses);
    } catch (err) {
      console.error('Error fetching license data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAllLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return {
          backgroundColor: '#e8f5e8',
          color: '#2e7d32'
        };
      case 'Expired':
        return {
          backgroundColor: '#ffebee',
          color: '#c62828'
        };
      case 'Pending':
        return {
          backgroundColor: '#fff3e0',
          color: '#ef6c00'
        };
      default:
        return {
          backgroundColor: '#f5f5f5',
          color: '#757575'
        };
    }
  };

  const handleViewDetails = (licenseId: number) => {
    // View details functionality
    alert(`View details for license ID: ${licenseId}`);
  };

  if (loading) {
    return (
      <div>
        <FilterSearch
          onSearchChange={() => {}}
          onStatusFilterChange={() => {}}
          onTypeFilterChange={() => {}}
          onExport={() => {}}
          totalResults={0}
        />
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom">
            <h6 className="mb-0 fw-bold">License Details</h6>
          </div>
          <div className="card-body p-0">
            <div className="d-flex justify-content-center align-items-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <FilterSearch
          onSearchChange={() => {}}
          onStatusFilterChange={() => {}}
          onTypeFilterChange={() => {}}
          onExport={() => {}}
          totalResults={0}
        />
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom">
            <h6 className="mb-0 fw-bold">License Details</h6>
          </div>
          <div className="card-body p-0">
            <div className="d-flex flex-column justify-content-center align-items-center p-5">
              <div className="text-danger mb-2">
                <i className="fas fa-exclamation-triangle fa-2x"></i>
              </div>
              <p className="text-muted text-center">{error}</p>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={fetchData}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Component */}
      <FilterSearch
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onExport={handleExport}
        totalResults={filteredLicenses.length}
      />

      {/* License Table */}
      <div className="card border-0 shadow-sm">
        {/* Card Header */}
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">License Details</h6>
          <div className="d-flex align-items-center">
            <span className="badge bg-light text-dark me-2">
              {filteredLicenses.length} of {allLicenses.length}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={fetchData}
              title="Refresh data"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* Card Body with Table */}
        <div className="card-body p-0">
          {filteredLicenses.length === 0 ? (
            <div className="d-flex flex-column justify-content-center align-items-center p-5">
              <div className="text-muted mb-2">
                {allLicenses.length === 0 ? (
                  <i className="fas fa-inbox fa-2x"></i>
                ) : (
                  <i className="fas fa-search fa-2x"></i>
                )}
              </div>
              <p className="text-muted">
                {allLicenses.length === 0 ? 'No licenses found' : 'No licenses match your filters'}
              </p>
              {allLicenses.length > 0 && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All Status');
                    setTypeFilter('All Types');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
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
                  {filteredLicenses.map((license, index) => (
                    <tr
                      key={license.id}
                      style={{
                        borderBottom: index === filteredLicenses.length - 1 ? 'none' : '1px solid #f8f9fa'
                      }}
                    >
                      {/* License Name */}
                      <td className="px-4 py-4">
                        <div>
                          <span className="fw-medium text-dark">{license.licenseName}</span>
                          <br />
                          <small className="text-muted">ID: {license.id}</small>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className="text-dark">{license.type}</span>
                      </td>

                      {/* Users */}
                      <td className="px-4 py-4">
                        <span className="text-dark me-1">👤</span>
                        <span className="text-dark">{license.users}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className="badge px-3 py-2"
                          style={{
                            ...getStatusBadge(license.status),
                            fontWeight: 'normal',
                            fontSize: '12px'
                          }}
                        >
                          {license.status}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-4">
                        <span className="text-dark me-1">📅</span>
                        <span className="text-dark">{license.startDate}</span>
                      </td>

                      {/* End Date */}
                      <td className="px-4 py-4">
                        <span className="text-dark me-1">📅</span>
                        <span className="text-dark">{license.endDate}</span>
                      </td>

                      {/* Total Cost */}
                      <td className="px-4 py-4">
                        <div>
                          <span className="text-dark fw-medium">{license.totalCost}</span>
                          <br />
                          <small className="text-muted">{license.costPerUser}</small>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <button
                          className="btn btn-sm p-2"
                          onClick={() => handleViewDetails(license.id)}
                          style={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px'
                          }}
                          title="View Details"
                        >
                          <span style={{ color: '#6c757d' }}>👁️</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseTable;
