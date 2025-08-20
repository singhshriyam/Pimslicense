"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/apiService';
import DashboardLayout from '@/Components/dashboard/DashboardLayout';
import StatCards from '@/Components/dashboard/StatCards';
import ProfileSection from '@/Components/dashboard/ProfileSection';
import LicensesSection from '@/Components/dashboard/LicensesSection';

const Dashboard = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      console.log('🔐 Dashboard: Checking authentication...');

      const authenticated = isAuthenticated();

      if (!authenticated) {
        console.log('❌ Dashboard: Not authenticated, redirecting to login');
        router.push('/auth/login');
        return;
      }

      console.log('✅ Dashboard: Authenticated, loading dashboard');
      setIsAuth(true);
      setIsLoading(false);
    };

    checkAuthentication();
  }, [router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Dashboard...</h5>
          <p className="text-muted small">Verifying your authentication</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render dashboard (redirect is happening)
  if (!isAuth) {
    return null;
  }

  // Render the actual dashboard content
  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
        <div>
          <h2 className="mb-1 fw-bold">Welcome back,</h2>
          <p className="text-muted mb-0">Manage your licenses and monitor your usage</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => router.push('/order-licenses')}
        >
          + Order Licenses
        </button>
      </div>

      {/* Stat Cards */}
      <StatCards />

      {/* Bottom Section - Profile and Licenses */}
      <div className="row g-3">
        <div className="col-md-4">
          <ProfileSection />
        </div>
        <div className="col-md-8">
          <LicensesSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
