"use client";
import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="container-fluid min-vh-100 bg-light p-0">
      <div className="row g-0">
        {/* Sidebar Column */}
        <div className="col-lg-2 col-md-3">
          <Sidebar />
        </div>

        {/* Main Content Column */}
        <div className="col-lg-10 col-md-9">
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
