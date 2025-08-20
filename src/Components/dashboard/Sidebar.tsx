"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { removeAuthToken } from '@/services/apiService';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/my-licenses', label: 'My Licenses', icon: '🛡️' },
    { path: '/order-licenses', label: 'Order Licenses', icon: '📋' },
    { path: '/support', label: 'Support', icon: '🎧' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    // Clear all auth data
    removeAuthToken();
    // Redirect to login
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div
      className="bg-white border-end d-flex flex-column shadow-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '220px',
        zIndex: 1000,
        overflowY: 'auto'
      }}
    >
      {/* Header Section - Logo + Title */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center">
          {/* Blue Circle Logo */}
          <div
            className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
            style={{ width: '32px', height: '32px' }}
          >
            <span className="text-white fw-bold" style={{ fontSize: '14px' }}>L</span>
          </div>

          {/* Title */}
          <div>
            <h6 className="mb-0 fw-bold text-dark">LicenseHub</h6>
            <small className="text-muted" style={{ fontSize: '10px' }}>License Management</small>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="p-2 flex-grow-1">
        <nav>
          <div className="nav flex-column">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`nav-link btn text-start mb-1 d-flex align-items-center ${
                  isActive(item.path)
                    ? 'text-primary fw-medium'
                    : 'text-muted'
                }`}
                style={{
                  backgroundColor: isActive(item.path) ? '#e3f2fd' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="me-2" style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Logout Section at Bottom */}
      <div className="p-2 border-top">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
          style={{
            fontSize: '14px',
            padding: '8px 12px',
            transition: 'all 0.2s ease'
          }}
        >
          <span className="me-2">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
