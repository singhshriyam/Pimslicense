"use client";
import React, { useState } from 'react';

const FilterSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const handleExport = () => {
    // Export functionality - for now just show alert
    alert('Export functionality would be implemented here');
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        {/* Left - Filter Title */}
        <div className="mb-2">
          <div className="d-flex align-items-center">
            <h6 className="mb-0 fw-bold">Filter & Search</h6>
          </div>
        </div>
        <div className="row align-items-center">

          {/* Middle - Search Input */}
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Right - Filters and Export */}
          <div className="col-md-7">
            <div className="d-flex gap-3 justify-content-end">
              {/* Status Dropdown */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '120px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Type Dropdown */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '120px' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All Types">All Types</option>
                <option value="Named User">Named User</option>
                <option value="Concurrent User">Concurrent User</option>
              </select>

              {/* Export Button */}
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={handleExport}
              >
                <i className="fas fa-download me-2"></i>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSearch;
