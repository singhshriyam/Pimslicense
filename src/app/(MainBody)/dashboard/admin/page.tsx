"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  Settings,
  BarChart3,
  MapPin,
  Droplets,
  TrendingUp,
  Activity,
  Shield
} from 'lucide-react';
import {
  fetchIncidentsAPI,
  getStatusColor,
  getPriorityColor,
  formatDate,
  getIncidentStats,
  getCategoryStats,
  Incident,
  getStatusBadge,
  getPriorityBadge
} from '../../../(MainBody)/services/incidentService';

import {
  fetchAllUsers,
  getUserStats as getAPIUserStats,
  getStoredToken,
  User
} from '../../../(MainBody)/services/userService';

const AdminDashboard = () => {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const token = getStoredToken();
      const userData = await fetchAllUsers(token || undefined);
      setUsers(userData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both incidents and users
        const [incidentsData] = await Promise.all([
          fetchIncidentsAPI(session?.user?.email, 'ADMINISTRATOR'),
          fetchUsers()
        ]);

        setIncidents(incidentsData);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      loadDashboardData();
    }
  }, [session?.user?.email]);

  const stats = getIncidentStats(incidents);
  const categoryStats = getCategoryStats(incidents);

  const getUserStats = () => {
    return getAPIUserStats(users);
  };

  const getRecentIncidents = () => {
    return incidents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getSeverityBadge = (priority: string) => {
    switch (priority) {
      case '1 - Critical': return 'badge bg-danger';
      case '2 - High': return 'badge bg-warning';
      case '3 - Medium': return 'badge bg-info';
      case '4 - Low': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'badge bg-success';
      case 'in_progress': return 'badge bg-primary';
      case 'pending': return 'badge bg-warning';
      case 'closed': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  };

  const userStats = getUserStats();
  const recentIncidents = getRecentIncidents();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Welcome Header */}
      <div className="row">
        <div className="col-12">
          <div className="card mb-4 mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">Welcome back, Administrator!</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Total Incidents</h6>
                  <h2 className="card-title mb-0">{stats.total}</h2>
                  <small className="text-success">
                    <TrendingUp size={12} className="me-1" />
                    +12% from last month
                  </small>
                </div>
                <AlertTriangle className="text-primary" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Critical Incidents</h6>
                  <h2 className="card-title mb-0 text-danger">{stats.critical}</h2>
                  <small className="text-danger">
                    Requires immediate attention
                  </small>
                </div>
                <AlertTriangle className="text-danger" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">In Progress</h6>
                  <h2 className="card-title mb-0 text-warning">{stats.inProgress}</h2>
                  <small className="text-muted">
                    Being actively worked on
                  </small>
                </div>
                <Clock className="text-warning" size={32} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 text-muted">Resolved</h6>
                  <h2 className="card-title mb-0 text-success">{stats.resolved}</h2>
                  <small className="text-success">
                    {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}% resolution rate
                  </small>
                </div>
                <CheckCircle className="text-success" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Team Overview */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <Users className="me-2" size={20} />
                Team Structure
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Shield className="text-primary me-2" size={20} />
                    <span className="fw-medium">Incident Managers</span>
                  </div>
                  <span className="h4 mb-0 text-primary">{userStats.managers}</span>
                </div>
              </div>
              <div className="mb-3 p-3 bg-success bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <UserCheck className="text-success me-2" size={20} />
                    <span className="fw-medium">Incident Handlers</span>
                  </div>
                  <span className="h4 mb-0 text-success">{userStats.handlers}</span>
                </div>
              </div>
              <div className="mb-3 p-3 bg-secondary bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Users className="text-secondary me-2" size={20} />
                    <span className="fw-medium">End Users</span>
                  </div>
                  <span className="h4 mb-0 text-secondary">{userStats.endUsers}</span>
                </div>
              </div>
              <div className="p-3 bg-info bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <Activity className="text-info me-2" size={20} />
                    <span className="fw-medium">Active Users</span>
                  </div>
                  <span className="h4 mb-0 text-info">{userStats.active}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <BarChart3 className="me-2" size={20} />
                Water Pollution Categories
              </h5>
            </div>
            <div className="card-body">
              {categoryStats.map((category, index) => (
                <div key={index} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">{category.name}</span>
                    <span className="text-muted">{category.count}</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{
                        width: `${stats.total > 0 ? (category.count / stats.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <Clock className="me-2" size={20} />
                Recent Incidents
              </h5>
            </div>
            <div className="card-body">
              {recentIncidents.map((incident, index) => (
                <div key={index} className="mb-3 p-3 bg-light rounded">
                  <div className="d-flex align-items-start">
                    <AlertTriangle
                      className={`me-3 mt-1 ${
                        incident.priority === '1 - Critical' ? 'text-danger' :
                        incident.priority === '2 - High' ? 'text-warning' : 'text-info'
                      }`}
                      size={16}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-medium small">{incident.number}</span>
                        <span className={getSeverityBadge(incident.priority)}>
                          {incident.priority.split(' - ')[1]}
                        </span>
                      </div>
                      <p className="mb-1 small text-muted">{incident.shortDescription}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={getStatusBadgeClass(incident.status)}>
                          {incident.status.replace('_', ' ')}
                        </span>
                        <small className="text-muted">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {recentIncidents.length === 0 && (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">No recent incidents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">System Users</h5>
            </div>
            <div className="card-body">
              {users.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role/Team</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 10).map((user) => (
                        <tr key={user.id}>
                          <td className="fw-medium">{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge bg-info">
                              {user.role || user.team || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${user.status === 'Active' || user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1">Edit</button>
                            <button className="btn btn-sm btn-outline-secondary">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No users found or unable to load user data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
