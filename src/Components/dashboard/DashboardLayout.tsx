"use client";
import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area - pushed to the right */}
      <div
        style={{
          marginLeft: '220px',     // Push content away from fixed sidebar
          height: '100vh',         // Full viewport height
          overflowY: 'auto',       // Make this scrollable
          backgroundColor: '#f8f9fa'  // Light background
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
