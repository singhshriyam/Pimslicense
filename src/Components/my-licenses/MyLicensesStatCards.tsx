"use client";
import React from 'react';

const MyLicensesStatCards = () => {
  return (
    <div className="row g-3 mb-2">
      {/* Card 1 - Active Licenses (Blue) */}
      <div className="col-lg-3 col-md-6">
        <div className="card h-80 border-0 shadow-sm" style={{ backgroundColor: '#e3f2fd' }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-0">Active Licenses</p>
              <h2 className="fw-bold mb-1 text-primary">3</h2>
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
              <h2 className="fw-bold mb-1 text-success">16</h2>
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
              <h2 className="fw-bold mb-1" style={{ color: '#9c27b0' }}>$3,434</h2>
            </div>
            <div>
              <div
                className="rounded d-inline-flex align-items-center justify-content-center"
                style={{ width: '30px', height: '30px', backgroundColor: '#9c27b0' }}
              >
                <i className="fas fa-calendar text-white" style={{ fontSize: '18px' }}></i>
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
              <h2 className="fw-bold mb-1" style={{ color: '#ff9800' }}>0</h2>
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
    </div>
  );
};

export default MyLicensesStatCards;
