'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from 'reactstrap'
import { useSession } from 'next-auth/react'
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
  Incident
} from '../../services/incidentService';

import {
  getStoredToken,
  getStoredUserTeam,
  getStoredUserName,
  mapTeamToRole
} from '../../services/userService';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const DeveloperDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    team: '',
    email: ''
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user info from stored data or session
        const storedName = getStoredUserName();
        const storedTeam = getStoredUserTeam();
        const userEmail = session?.user?.email || '';

        setUserInfo({
          name: storedName || session?.user?.name || 'Developer',
          team: storedTeam || 'Developer',
          email: userEmail
        });

        // Fetch incidents related to development/technical issues
        const userRole = mapTeamToRole(storedTeam || 'developer');
        const incidentsData = await fetchIncidentsAPI(userEmail, userRole);
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

  // System health metrics (mock data for demonstration)
  const systemMetrics = {
    apiResponseTime: 245,
    serverUptime: 99.8,
    databaseConnections: 85,
    errorRate: 0.2,
    activeUsers: 1247,
    memoryUsage: 78
  };

  // Performance chart options
  const performanceChartOptions = {
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
    title: {
      text: 'System Performance Metrics',
      align: 'left' as const
    },
    xaxis: {
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b']
  };

  const performanceChartSeries = [{
    name: 'Response Time (ms)',
    data: [180, 240, 200, 300, 250, 245]
  }, {
    name: 'CPU Usage (%)',
    data: [45, 55, 48, 65, 58, 52]
  }, {
    name: 'Memory Usage (%)',
    data: [30, 40, 35, 50, 45, 42]
  }];

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const handleCreateIncident = () => {
    router.push('/dashboard?tab=create-incident');
  };

  // Technical incidents (filter for development-related issues)
  const technicalIncidents = incidents.filter(incident =>
    incident.category.toLowerCase().includes('technical') ||
    incident.category.toLowerCase().includes('system') ||
    incident.category.toLowerCase().includes('software') ||
    incident.category.toLowerCase().includes('bug') ||
    incident.category.toLowerCase().includes('api')
  );

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading developer dashboard...</p>
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
            <Card className="mb-4 mt-4 border-info">
              <CardBody className="bg-info bg-opacity-10">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 text-info">💻 Developer Dashboard</h4>
                    <p className="text-muted mb-0">
                      Welcome back, <strong>{userInfo.name}</strong>! Monitor system health and handle technical incidents.
                    </p>
                  </div>
                  <div>
                    <Button color="info" onClick={handleCreateIncident} className="me-2">
                      Report Technical Issue
                    </Button>
                    <Button color="outline-info" onClick={handleViewAllIncidents}>
                      View Technical Issues
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* System Metrics Cards */}
        <Row>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-info">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-info">{systemMetrics.apiResponseTime}ms</h5>
                      <span className="f-light">API Response Time</span>
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
                      <h5 className="mb-0 counter text-success">{systemMetrics.serverUptime}%</h5>
                      <span className="f-light">Server Uptime</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-warning">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-warning">{technicalIncidents.length}</h5>
                      <span className="f-light">Technical Incidents</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-danger">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-danger">{systemMetrics.errorRate}%</h5>
                      <span className="f-light">Error Rate</span>
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
                <h5>📊 System Performance Monitoring</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={performanceChartOptions}
                  series={performanceChartSeries}
                  type="area"
                  height={350}
                />
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <CardHeader className="pb-0">
                <h5>🔧 System Status</h5>
              </CardHeader>
              <CardBody>
                <div className="mb-3 p-3 bg-success bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-success mb-1">🌐 Web Application</h6>
                      <small className="text-muted">All services operational</small>
                    </div>
                    <div className="text-success">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-success bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-success mb-1">🗄️ Database</h6>
                      <small className="text-muted">Connection stable ({systemMetrics.databaseConnections}%)</small>
                    </div>
                    <div className="text-success">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-warning mb-1">⚡ API Gateway</h6>
                      <small className="text-muted">Slight latency detected</small>
                    </div>
                    <div className="text-warning">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                        <path d="M12 9v4"/>
                        <path d="m12 17 .01 0"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-info bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-info mb-1">👥 Active Users</h6>
                      <small className="text-muted">{systemMetrics.activeUsers} users online</small>
                    </div>
                    <div className="text-info">
                      <span className="fw-bold">{systemMetrics.activeUsers}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Technical Incidents */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>🐛 Recent Technical Incidents</h5>
                  <Button color="outline-info" size="sm" onClick={handleViewAllIncidents}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {technicalIncidents.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Incident #</th>
                          <th>Issue Description</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicalIncidents.slice(0, 5).map((incident) => (
                          <tr key={incident.id}>
                            <td>
                              <span className="fw-medium text-info">{incident.number}</span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">{incident.shortDescription}</div>
                                <small className="text-muted">{incident.category}</small>
                              </div>
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
                            <td>
                              <span className="text-muted">
                                {incident.assignedTo || 'Unassigned'}
                              </span>
                            </td>
                            <td>{formatDate(incident.createdAt)}</td>
                            <td>
                              <Button color="outline-info" size="sm">
                                Debug
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                      </svg>
                    </div>
                    <h6 className="text-muted">No technical incidents</h6>
                    <p className="text-muted">All systems are running smoothly! No technical incidents to report.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Development Tools */}
        <Row>
          <Col lg={8}>
            <Card>
              <CardHeader className="pb-0">
                <h5>🛠️ Development Tools & Resources</h5>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">📊 Error Monitoring</h6>
                          <small className="text-muted">Real-time error tracking and alerts</small>
                        </div>
                        <Button color="outline-info" size="sm">Access</Button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">📈 Performance Analytics</h6>
                          <small className="text-muted">System performance metrics dashboard</small>
                        </div>
                        <Button color="outline-info" size="sm">View</Button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">📝 Log Analysis</h6>
                          <small className="text-muted">Application logs viewer and analysis</small>
                        </div>
                        <Button color="outline-info" size="sm">Open</Button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">🗄️ Database Console</h6>
                          <small className="text-muted">Direct database access and queries</small>
                        </div>
                        <Button color="outline-info" size="sm">Connect</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <CardHeader className="pb-0">
                <h5>💾 System Resources</h5>
              </CardHeader>
              <CardBody>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium">Memory Usage</span>
                    <span className="text-warning fw-bold">{systemMetrics.memoryUsage}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning" style={{ width: `${systemMetrics.memoryUsage}%` }}></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium">CPU Usage</span>
                    <span className="text-info fw-bold">52%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-info" style={{ width: '52%' }}></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium">Disk Usage</span>
                    <span className="text-success fw-bold">34%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-success" style={{ width: '34%' }}></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium">Network I/O</span>
                    <span className="text-primary fw-bold">67%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '67%' }}></div>
                  </div>
                </div>

                <hr />
                <div className="text-center">
                  <small className="text-muted">Last updated: {new Date().toLocaleTimeString()}</small>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Developer Actions */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>🚀 Developer Actions</h5>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="info" onClick={handleViewAllIncidents}>
                        🐛 View Bug Reports
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="success">
                        📊 System Metrics
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="warning">
                        📝 Error Logs
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="danger">
                        🔧 System Maintenance
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="primary" onClick={handleCreateIncident}>
                        ➕ Report Issue
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="secondary">
                        🔄 Deploy Updates
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="dark">
                        💾 Backup System
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="outline-info">
                        📋 API Documentation
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

export default DeveloperDashboard
