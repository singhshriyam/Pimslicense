"use client";
import React, { useState } from 'react';

interface FilterSearchProps {
  onSearchChange: (searchTerm: string) => void;
  onStatusFilterChange: (status: string) => void;
  onTypeFilterChange: (type: string) => void;
  onExport: () => void;
  totalResults: number;
}

const FilterSearch: React.FC<FilterSearchProps> = ({
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onExport,
  totalResults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilterChange(value);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    onTypeFilterChange(value);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All Status');
    setTypeFilter('All Types');
    onSearchChange('');
    onStatusFilterChange('All Status');
    onTypeFilterChange('All Types');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'All Status' || typeFilter !== 'All Types';

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        {/* Header with Results Count */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-bold">Filter & Search</h6>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark">
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
              </span>
              {hasActiveFilters && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={clearAllFilters}
                  title="Clear all filters"
                >
                  <i className="fas fa-times me-1"></i>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row align-items-center">
          {/* Search Input */}
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by license name, ID, or notes..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-start-0"
                  type="button"
                  onClick={() => handleSearchChange('')}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filters and Export */}
          <div className="col-md-7">
            <div className="d-flex gap-3 justify-content-end">
              {/* Status Dropdown */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '140px' }}
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Type Dropdown */}
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '160px' }}
                value={typeFilter}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="All Types">All Types</option>
                <option value="Named User">Named User</option>
                <option value="Concurrent User">Concurrent User</option>
                <option value="Mixed">Mixed (Named + Concurrent)</option>
                <option value="Not Assigned">Not Assigned</option>
              </select>

              {/* Export Button */}
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={onExport}
                disabled={totalResults === 0}
              >
                <i className="fas fa-download me-2"></i>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <small className="text-muted me-2">Active filters:</small>
              {searchTerm && (
                <span className="badge bg-primary">
                  Search: "{searchTerm}"
                  <button
                    className="btn btn-sm p-0 ms-1"
                    onClick={() => handleSearchChange('')}
                    style={{ background: 'none', border: 'none', color: 'white' }}
                  >
                    <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                  </button>
                </span>
              )}
              {statusFilter !== 'All Status' && (
                <span className="badge bg-success">
                  Status: {statusFilter}
                  <button
                    className="btn btn-sm p-0 ms-1"
                    onClick={() => handleStatusChange('All Status')}
                    style={{ background: 'none', border: 'none', color: 'white' }}
                  >
                    <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                  </button>
                </span>
              )}
              {typeFilter !== 'All Types' && (
                <span className="badge bg-info">
                  Type: {typeFilter}
                  <button
                    className="btn btn-sm p-0 ms-1"
                    onClick={() => handleTypeChange('All Types')}
                    style={{ background: 'none', border: 'none', color: 'white' }}
                  >
                    <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSearch;
