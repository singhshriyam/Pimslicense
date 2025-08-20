"use client";
import React, { useState, useEffect } from 'react';
import {
  getLicenses,
  getEditions,
  getLicenseProducts,
  isAuthenticated,
  ApiResponse
} from '../../services/apiService';

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
  name: string;
  users: number;
  userType: string;
  status: 'Active' | 'Expired' | 'Pending';
  expiryDate: string;
  price: string;
}

const LicensesSection = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform API data to component format
  const transformLicenses = (
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

        const totalUsers = license.named_user_count + license.concurrent_user_count;

        // Determine user type
        let userType = '';
        if (license.named_user_count > 0 && license.concurrent_user_count > 0) {
          userType = `${license.named_user_count} named, ${license.concurrent_user_count} concurrent users`;
        } else if (license.named_user_count > 0) {
          userType = 'named user users';
        } else if (license.concurrent_user_count > 0) {
          userType = 'concurrent user users';
        } else {
          userType = 'no users assigned';
        }

        // Calculate status
        const expirationDate = new Date(license.expiration_date);
        const now = new Date();
        const status: 'Active' | 'Expired' | 'Pending' =
          expirationDate > now ? 'Active' : 'Expired';

        // Format expiry date
        const expiryDate = expirationDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Calculate price from license products
        let price = 'Price not available';
        if (product) {
          const unitPrice = parseFloat(product.unit_price);

          // Calculate based on billing cycle
          let annualPrice = unitPrice;
          if (product.billing_cycle === 'monthly') {
            annualPrice = unitPrice * 12;
          }

          // Calculate total cost (price × users)
          const totalCost = annualPrice * Math.max(totalUsers, 1);
          price = `£${totalCost.toLocaleString()}`;
        }

        return {
          id: license.id,
          name: edition?.name || 'Unknown License',
          users: totalUsers,
          userType,
          status,
          expiryDate,
          price
        };
      });
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      if (!isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);

      // Fetch all required data (same as LicenseTable)
      const [licensesResponse, editionsResponse, licenseProductsResponse] = await Promise.all([
        getLicenses(),
        getEditions(),
        getLicenseProducts()
      ]);

      // Check if requests were successful
      if (!licensesResponse.success || !editionsResponse.success || !licenseProductsResponse.success) {
        throw new Error('Failed to fetch data from API');
      }

      // Transform and set data
      const transformedLicenses = transformLicenses(
        licensesResponse.data || [],
        editionsResponse.data || [],
        licenseProductsResponse.data || []
      );

      setLicenses(transformedLicenses);
    } catch (err) {
      console.error('Error fetching license data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLicenses([]); // Set empty array on error
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
        <div className="d-flex align-items-center">
          {error && (
            <button
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={fetchData}
              title="Retry loading"
            >
              <i className="fas fa-redo"></i>
            </button>
          )}
          <a href="#" className="text-primary text-decoration-none small d-flex align-items-center">
            View All
            <span className="ms-1">🔗</span>
          </a>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-0">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="d-flex flex-column justify-content-center align-items-center p-4">
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
        ) : licenses.length === 0 ? (
          <div className="d-flex flex-column justify-content-center align-items-center p-4">
            <div className="text-muted mb-2">
              <i className="fas fa-inbox fa-2x"></i>
            </div>
            <p className="text-muted">No licenses found</p>
          </div>
        ) : (
          /* License list */
          <div className="list-group list-group-flush">
            {licenses.map((license) => (
              <div key={license.id} className="list-group-item border-0 px-3 py-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-medium">{license.name}</h6>
                    <p className="mb-2 text-muted small">
                      {license.users} {license.userType}
                    </p>
                    <p className="mb-0 text-primary small fw-medium">
                      {license.price}
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
        )}
      </div>
    </div>
  );
};

export default LicensesSection;
