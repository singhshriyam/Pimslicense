'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from 'reactstrap'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  fetchIncidentsAPI,
  getIncidentStats,
  formatDate,
  getStatusBadge,
  getPriorityBadge,
  getPriorityColor,
  getStatusColor,
  Incident,
  getCategoryStats
} from '../../../(MainBody)/services/incidentService';

import {
  fetchAllUsers,
  getCurrentUser,
  isAuthenticated,
  clearUserData,
  mapTeamToRole,
  getUserStats as getAPIUserStats,
  User
} from '../../../(MainBody)/services/userService';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const AdminDashboard = () => {
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
        if (!isAuthenticated()) {
          router.replace('/auth/login');
          return;
        }

        // Get current user
        const currentUser = getCurrentUser();
        setUserInfo({
          name: currentUser.name || 'Administrator',
          team: currentUser.team || 'Administrator',
          email: currentUser.email || '',
          userId: currentUser.id || ''
        });

        // Fetch all incidents (admins can see all)
        const userRole = mapTeamToRole(currentUser.team || 'admin');
        const incidentsData = await fetchIncidentsAPI(currentUser.email, userRole);
        setIncidents(incidentsData);

        // Fetch all users for admin management
        const usersData = await fetchAllUsers();
        setUsers(usersData);

      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const stats = getIncidentStats(incidents);
  const categoryStats = getCategoryStats(incidents);
  const userStats = getAPIUserStats(users);

  // System overview chart
  const systemChartOptions = {
    chart: {
      type: 'area' as const,
      height: 350
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b']
  };

  const systemChartSeries = [{
    name: 'Total Incidents',
    data: [31, 40, 28, 51, 42, stats.total || 35]
  }, {
    name: 'Resolved',
    data: [11, 32, 45, 32, 34, stats.resolved || 25]
  }, {
    name: 'Pending',
    data: [15, 11, 32, 18, 9, stats.pending || 10]
  }];

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const handleCreateIncident = () => {
    router.push('/dashboard?tab=create-incident');
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading admin dashboard...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {error}
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container fluid>
        {/* Welcome Header */}
        <Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4 border-primary">
              <CardBody className="bg-primary bg-opacity-10">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 text-primary">🛡️ Administrator Dashboard</h4>
                    <p className="text-muted mb-0">
                      Welcome back, <strong>{userInfo.name}</strong>! You have full system access and oversight.
                    </p>
                  </div>
                  <div>
                    <Button color="primary" onClick={handleCreateIncident} className="me-2">
                      Create Incident
                    </Button>
                    <Button color="outline-primary" onClick={handleViewAllIncidents}>
                      Manage All Incidents
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-primary">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-primary">{stats.total}</h5>
                      <span className="f-light">Total System Incidents</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-info">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-info">{userStats.total}</h5>
                      <span className="f-light">Total System Users</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-success">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-success">{userStats.active}</h5>
                      <span className="f-light">Active Users</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-success">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-success">{stats.resolved}</h5>
                      <span className="f-light">Resolved This Month</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card>
              <CardHeader className="pb-0">
                <h5>🏢 System Overview</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={systemChartOptions}
                  series={systemChartSeries}
                  type="area"
                  height={350}
                />
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <CardHeader className="pb-0">
                <h5>👥 User Distribution</h5>
              </CardHeader>
              <CardBody>
                <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Admins</strong>
                      <small className="d-block text-muted">System administrators</small>
                    </div>
                    <span className="h4 mb-0 text-primary">{userStats.admins || 1}</span>
                  </div>
                </div>
                <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Managers</strong>
                      <small className="d-block text-muted">Incident managers</small>
                    </div>
                    <span className="h4 mb-0 text-warning">{userStats.managers}</span>
                  </div>
                </div>
                <div className="mb-3 p-3 bg-success bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Handlers</strong>
                      <small className="d-block text-muted">Incident handlers</small>
                    </div>
                    <span className="h4 mb-0 text-success">{userStats.handlers}</span>
                  </div>
                </div>
                <div className="p-3 bg-info bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>End Users</strong>
                      <small className="d-block text-muted">Regular users</small>
                    </div>
                    <span className="h4 mb-0 text-info">{userStats.endUsers}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Recent System Activities */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>🔄 Recent System Activities</h5>
                  <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {incidents.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Incident #</th>
                          <th>Category</th>
                          <th>Reporter</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.slice(0, 5).map((incident) => (
                          <tr key={incident.id}>
                            <td>
                              <span className="fw-medium text-primary">{incident.number}</span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">{incident.category}</div>
                                <small className="text-muted">{incident.subCategory}</small>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted">{incident.reportedByName}</span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{ backgroundColor: getPriorityColor(incident.priority), color: 'white' }}
                              >
                                {incident.priority}
                              </span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{ backgroundColor: getStatusColor(incident.status || 'pending'), color: 'white' }}
                              >
                                {(incident.status || 'pending').replace('_', ' ')}
                              </span>
                            </td>
                            <td>{formatDate(incident.createdAt)}</td>
                            <td>
                              <Button color="outline-primary" size="sm">
                                Manage
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">No recent activities</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Admin Actions */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>⚙️ Administrative Actions</h5>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="primary" onClick={handleViewAllIncidents}>
                        📋 Manage All Incidents
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="success">
                        👥 User Management
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="info">
                        📊 System Reports
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="warning">
                        ⚙️ System Settings
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="danger">
                        🔒 Security Center
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="secondary">
                        💾 Backup Management
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="dark">
                        📈 Analytics Dashboard
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="outline-primary" onClick={handleCreateIncident}>
                        ➕ Create Incident
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default AdminDashboard
