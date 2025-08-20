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

interface MyLicensesStats {
  activeLicenses: number;
  totalUsers: number;
  totalValue: number;
  expiringSoon: number;
}

const MyLicensesStatCards = () => {
  const [stats, setStats] = useState<MyLicensesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from license data
  const calculateMyLicensesStats = (
    licenses: LicenseApiResponse[],
    editions: Edition[],
    licenseProducts: LicenseProduct[]
  ): MyLicensesStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Create maps for quick lookups
    const editionsMap = new Map<number, Edition>();
    editions.forEach(edition => {
      editionsMap.set(edition.id, edition);
    });

    const licenseProductsMap = new Map<string, LicenseProduct>();
    licenseProducts.forEach(product => {
      const key = `${product.edition_id}-${product.license_type_id}`;
      licenseProductsMap.set(key, product);
    });

    // Filter out deleted licenses
    const activeLicenseData = licenses.filter(license => !license.deleted_at);

    // Calculate active licenses (not expired)
    const activeLicenses = activeLicenseData.filter(license =>
      new Date(license.expiration_date) > now
    ).length;

    // Calculate total users from all active license data
    const totalUsers = activeLicenseData.reduce((sum, license) =>
      sum + license.named_user_count + license.concurrent_user_count, 0
    );

    // Calculate total value using license products
    let totalValue = 0;
    activeLicenseData.forEach(license => {
      const productKey = `${license.edition_id}-${license.license_type_id}`;
      const product = licenseProductsMap.get(productKey);

      if (product) {
        const unitPrice = parseFloat(product.unit_price);
        const totalLicenseUsers = license.named_user_count + license.concurrent_user_count;

        // Calculate cost based on billing cycle
        let licenseCost = unitPrice;
        if (product.billing_cycle === 'monthly') {
          licenseCost = unitPrice * 12; // Convert to annual
        }

        // Multiply by user count (assuming per-user pricing)
        // Use at least 1 to account for base license cost
        totalValue += licenseCost * Math.max(totalLicenseUsers, 1);
      }
    });

    // Calculate licenses expiring soon (within 30 days)
    const expiringSoon = activeLicenseData.filter(license => {
      const expirationDate = new Date(license.expiration_date);
      return expirationDate > now && expirationDate <= thirtyDaysFromNow;
    }).length;

    return {
      activeLicenses,
      totalUsers,
      totalValue: Math.round(totalValue),
      expiringSoon
    };
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

      // Calculate stats
      const calculatedStats = calculateMyLicensesStats(
        licensesResponse.data || [],
        editionsResponse.data || [],
        licenseProductsResponse.data || []
      );

      setStats(calculatedStats);
    } catch (err) {
      console.error('Error fetching my licenses data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Set fallback stats
      setStats({
        activeLicenses: 0,
        totalUsers: 0,
        totalValue: 0,
        expiringSoon: 0
      });
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

  if (loading) {
    return (
      <div className="row g-3 mb-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="col-lg-3 col-md-6">
            <div className="card h-80 border-0 shadow-sm">
              <div className="card-body d-flex justify-content-center align-items-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row g-3 mb-2">
      {/* Card 1 - Active Licenses (Blue) */}
      <div className="col-lg-3 col-md-6">
        <div className="card h-80 border-0 shadow-sm" style={{ backgroundColor: '#e3f2fd' }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-0">Active Licenses</p>
              <h2 className="fw-bold mb-1 text-primary">{stats?.activeLicenses || 0}</h2>
            </div>
            <div>
              <div
                className="rounded d-inline-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', backgroundColor: '#4285f4' }}
              >
                <i className="fas fa-shield-alt text-white" style={{ fontSize: '18px' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 - Total Users (Green) */}
      <div className="col-lg-3 col-md-6">
        <div className="card h-80 border-0 shadow-sm" style={{ backgroundColor: '#e8f5e8' }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-0">Total Users</p>
              <h2 className="fw-bold mb-1 text-success">{stats?.totalUsers || 0}</h2>
            </div>
            <div>
              <div
                className="rounded d-inline-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', backgroundColor: '#34a853' }}
              >
                <i className="fas fa-users text-white" style={{ fontSize: '18px' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3 - Total Value (Purple) */}
      <div className="col-lg-3 col-md-6">
        <div className="card h-80 border-0 shadow-sm" style={{ backgroundColor: '#f3e5f5' }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-0">Total Value</p>
              <h2 className="fw-bold mb-1" style={{ color: '#9c27b0' }}>
                £{stats?.totalValue?.toLocaleString() || 0}
              </h2>
            </div>
            <div>
              <div
                className="rounded d-inline-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', backgroundColor: '#9c27b0' }}
              >
                <i className="fas fa-pound-sign text-white" style={{ fontSize: '18px' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4 - Expiring Soon (Orange) */}
      <div className="col-lg-3 col-md-6">
        <div className="card h-80 border-0 shadow-sm" style={{ backgroundColor: '#fff3e0' }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-0">Expiring Soon</p>
              <h2 className="fw-bold mb-1" style={{ color: '#ff9800' }}>
                {stats?.expiringSoon || 0}
              </h2>
            </div>
            <div>
              <div
                className="rounded d-inline-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', backgroundColor: '#ff9800' }}
              >
                <i className="fas fa-exclamation-triangle text-white" style={{ fontSize: '18px' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="col-12">
          <div className="alert alert-warning d-flex align-items-center mt-2" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <div>
              <strong>Warning:</strong> {error}
              <button
                className="btn btn-link p-0 ms-2"
                onClick={fetchData}
                style={{ fontSize: '14px' }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLicensesStatCards;
