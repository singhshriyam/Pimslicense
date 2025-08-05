"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/Components/dashboard/DashboardLayout';
import MyLicensesStatCards from '@/Components/my-licenses/MyLicensesStatCards';
import FilterSearch from '@/Components/my-licenses/FilterSearch';
import LicenseTable from '@/Components/my-licenses/LicenseTable';

const MyLicenses = () => {
  const router = useRouter();
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
        <div>
          <h2 className="mb-1 fw-bold">My Licenses</h2>
          <p className="text-muted mb-0">Manage and monitor all your software licenses</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => router.push('/order-licenses')}
        >
          + Order Licenses
        </button>
      </div>

      {/* Stat Cards */}
      <MyLicensesStatCards />

      {/* Filter & Search */}
      <FilterSearch />

      {/* License Table */}
      <LicenseTable />
    </DashboardLayout>
  );
};

export default MyLicenses;
