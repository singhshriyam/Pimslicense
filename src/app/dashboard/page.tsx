"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/Components/dashboard/DashboardLayout';
import StatCards from '@/Components/dashboard/StatCards';
import ProfileSection from '@/Components/dashboard/ProfileSection';
import LicensesSection from '@/Components/dashboard/LicensesSection';

const Dashboard = () => {
  const router = useRouter();
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
