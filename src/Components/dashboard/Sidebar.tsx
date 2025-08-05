"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="bg-white min-vh-100 border-end">
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
      <div className="p-2">
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
                  fontSize: '14px'
                }}
              >
                <span className="me-2" style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
