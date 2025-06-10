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
  Incident,
  getCategoryStats
} from '../../services/incidentService';

import {
  fetchAllUsers,
  getStoredToken,
  getStoredUserTeam,
  getStoredUserName,
  mapTeamToRole,
  getUserStats as getAPIUserStats,
  User
} from '../../services/userService';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const SLAManagerDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
          name: storedName || session?.user?.name || 'SLA Manager',
          team: storedTeam || 'SLA Manager',
          email: userEmail
        });

        // Fetch all incidents (SLA managers can see all)
        const userRole = mapTeamToRole(storedTeam || 'sla_manager');
        const incidentsData = await fetchIncidentsAPI(userEmail, userRole);
        setIncidents(incidentsData);

        // Fetch all users
        const token = getStoredToken();
        const usersData = await fetchAllUsers(token || undefined);
        setUsers(usersData);

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
  const userStats = getAPIUserStats(users);

  // Calculate SLA metrics
  const getSLAMetrics = () => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const threeDays = 3 * oneDay;

    let withinSLA = 0;
    let breachedSLA = 0;
    let nearBreach = 0;

    incidents.forEach(incident => {
      const createdDate = new Date(incident.createdAt);
      const timeDiff = now.getTime() - createdDate.getTime();

      if (incident.status === 'resolved') {
        // For resolved incidents, check if they were resolved within SLA
        const resolvedDate = incident.updatedAt ? new Date(incident.updatedAt) : now;
        const resolutionTime = resolvedDate.getTime() - createdDate.getTime();

        if (incident.priority === '1 - Critical' && resolutionTime <= oneDay) {
          withinSLA++;
        } else if (incident.priority === '2 - High' && resolutionTime <= threeDays) {
          withinSLA++;
        } else if (resolutionTime <= 7 * oneDay) {
          withinSLA++;
        } else {
          breachedSLA++;
        }
      } else {
        // For active incidents, check if they're approaching SLA breach
        if (incident.priority === '1 - Critical' && timeDiff > oneDay) {
          breachedSLA++;
        } else if (incident.priority === '2 - High' && timeDiff > threeDays) {
          breachedSLA++;
        } else if (timeDiff > 7 * oneDay) {
          breachedSLA++;
        } else if (incident.priority === '1 - Critical' && timeDiff > oneDay * 0.8) {
          nearBreach++;
        } else if (incident.priority === '2 - High' && timeDiff > threeDays * 0.8) {
          nearBreach++;
        } else {
          withinSLA++;
        }
      }
    });

    const slaCompliance = stats.total > 0 ? Math.round((withinSLA / stats.total) * 100) : 100;

    return { withinSLA, breachedSLA, nearBreach, slaCompliance };
  };

  const slaMetrics = getSLAMetrics();

  // SLA Performance Chart
  const slaChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 350
    },
    labels: ['Within SLA', 'SLA Breached', 'Near Breach'],
    colors: ['#10b981', '#ef4444', '#f59e0b'],
    legend: {
      position: 'bottom' as const
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'SLA Compliance',
              formatter: () => `${slaMetrics.slaCompliance}%`
            }
          }
        }
      }
    }
  };

  const slaChartSeries = [slaMetrics.withinSLA, slaMetrics.breachedSLA, slaMetrics.nearBreach];

  // Monthly SLA Trend
  const trendChartOptions = {
    chart: {
      type: 'line' as const,
      height: 350
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    title: {
      text: 'SLA Compliance Trend',
      align: 'left' as const
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yaxis: {
      title: {
        text: 'Compliance %'
      },
      min: 0,
      max: 100
    },
    colors: ['#10b981', '#ef4444'],
    markers: {
      size: 6
    }
  };

  const trendChartSeries = [{
    name: 'SLA Compliance',
    data: [85, 88, 92, 87, 90, slaMetrics.slaCompliance]
  }, {
    name: 'Target (95%)',
    data: [95, 95, 95, 95, 95, 95]
  }];

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading SLA dashboard...</p>
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
            <Card className="mb-4 mt-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">Welcome back, {userInfo.name}!</h4>
                    <p className="text-muted mb-0">
                      As an <strong>SLA Manager</strong>, you monitor service level agreements and ensure compliance for water pollution incident response.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* SLA Metrics Cards */}
        <Row>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-success">{slaMetrics.slaCompliance}%</h5>
                      <span className="f-light">SLA Compliance</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-success">{slaMetrics.withinSLA}</h5>
                      <span className="f-light">Within SLA</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-warning">{slaMetrics.nearBreach}</h5>
                      <span className="f-light">Near Breach</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-danger">{slaMetrics.breachedSLA}</h5>
                      <span className="f-light">SLA Breached</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={6}>
            <Card>
              <CardHeader className="pb-0">
                <h5>SLA Performance Overview</h5>
              </CardHeader>
              <CardBody>
                {stats.total > 0 ? (
                  <Chart
                    options={slaChartOptions}
                    series={slaChartSeries}
                    type="donut"
                    height={350}
                  />
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No incident data available</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={6}>
            <Card>
              <CardHeader className="pb-0">
                <h5>SLA Compliance Trend</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={trendChartOptions}
                  series={trendChartSeries}
                  type="line"
                  height={350}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* SLA Breach Alerts */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>SLA Breach Alerts</h5>
                  <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                    View All Incidents
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {incidents.filter(incident => {
                  const now = new Date();
                  const createdDate = new Date(incident.createdAt);
                  const timeDiff = now.getTime() - createdDate.getTime();
                  const oneDay = 24 * 60 * 60 * 1000;

                  return (incident.status !== 'resolved' &&
                         ((incident.priority === '1 - Critical' && timeDiff > oneDay * 0.8) ||
                          (incident.priority === '2 - High' && timeDiff > 3 * oneDay * 0.8) ||
                          timeDiff > 7 * oneDay * 0.8));
                }).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Incident #</th>
                          <th>Description</th>
                          <th>Priority</th>
                          <th>Age</th>
                          <th>Status</th>
                          <th>SLA Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.filter(incident => {
                          const now = new Date();
                          const createdDate = new Date(incident.createdAt);
                          const timeDiff = now.getTime() - createdDate.getTime();
                          const oneDay = 24 * 60 * 60 * 1000;

                          return (incident.status !== 'resolved' &&
                                 ((incident.priority === '1 - Critical' && timeDiff > oneDay * 0.8) ||
                                  (incident.priority === '2 - High' && timeDiff > 3 * oneDay * 0.8) ||
                                  timeDiff > 7 * oneDay * 0.8));
                        }).slice(0, 10).map((incident) => {
                          const now = new Date();
                          const createdDate = new Date(incident.createdAt);
                          const timeDiff = now.getTime() - createdDate.getTime();
                          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                          const days = Math.floor(hours / 24);

                          const getSLAStatus = () => {
                            const oneDay = 24 * 60 * 60 * 1000;
                            if (incident.priority === '1 - Critical' && timeDiff > oneDay) {
                              return { status: 'Breached', class: 'danger' };
                            } else if (incident.priority === '2 - High' && timeDiff > 3 * oneDay) {
                              return { status: 'Breached', class: 'danger' };
                            } else if (timeDiff > 7 * oneDay) {
                              return { status: 'Breached', class: 'danger' };
                            } else {
                              return { status: 'Near Breach', class: 'warning' };
                            }
                          };

                          const slaStatus = getSLAStatus();

                          return (
                            <tr key={incident.id}>
                              <td>
                                <span className="fw-medium">{incident.number}</span>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium">{incident.shortDescription}</div>
                                  <small className="text-muted">{incident.category}</small>
                                </div>
                              </td>
                              <td>
                                <span className={`badge bg-${getPriorityBadge(incident.priority)}`}>
                                  {incident.priority}
                                </span>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`}
                                </span>
                              </td>
                              <td>
                                <span className={`badge bg-${getStatusBadge(incident.status)}`}>
                                  {incident.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                <span className={`badge bg-${slaStatus.class}`}>
                                  {slaStatus.status}
                                </span>
                              </td>
                              <td>
                                <Button color="outline-primary" size="sm">
                                  Escalate
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <div className="text-success mb-2">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                    <h6 className="text-success">All incidents within SLA!</h6>
                    <p className="text-muted mb-0">No incidents are currently breaching or near breaching SLA.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* SLA Summary Report */}
        <Row>
          <Col lg={8}>
            <Card>
              <CardHeader className="pb-0">
                <h5>SLA Performance by Priority</h5>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="p-3 bg-danger bg-opacity-10 rounded text-center">
                      <h4 className="text-danger mb-1">
                        {incidents.filter(i => i.priority === '1 - Critical').length}
                      </h4>
                      <small className="text-muted">Critical (24h SLA)</small>
                      <div className="mt-2">
                        <small className="text-success">
                          {Math.round((incidents.filter(i => i.priority === '1 - Critical' && i.status === 'resolved').length /
                          Math.max(incidents.filter(i => i.priority === '1 - Critical').length, 1)) * 100)}% resolved
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 bg-warning bg-opacity-10 rounded text-center">
                      <h4 className="text-warning mb-1">
                        {incidents.filter(i => i.priority === '2 - High').length}
                      </h4>
                      <small className="text-muted">High (72h SLA)</small>
                      <div className="mt-2">
                        <small className="text-success">
                          {Math.round((incidents.filter(i => i.priority === '2 - High' && i.status === 'resolved').length /
                          Math.max(incidents.filter(i => i.priority === '2 - High').length, 1)) * 100)}% resolved
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 bg-info bg-opacity-10 rounded text-center">
                      <h4 className="text-info mb-1">
                        {incidents.filter(i => i.priority === '3 - Medium').length}
                      </h4>
                      <small className="text-muted">Medium (7d SLA)</small>
                      <div className="mt-2">
                        <small className="text-success">
                          {Math.round((incidents.filter(i => i.priority === '3 - Medium' && i.status === 'resolved').length /
                          Math.max(incidents.filter(i => i.priority === '3 - Medium').length, 1)) * 100)}% resolved
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 bg-success bg-opacity-10 rounded text-center">
                      <h4 className="text-success mb-1">
                        {incidents.filter(i => i.priority === '4 - Low').length}
                      </h4>
                      <small className="text-muted">Low (14d SLA)</small>
                      <div className="mt-2">
                        <small className="text-success">
                          {Math.round((incidents.filter(i => i.priority === '4 - Low' && i.status === 'resolved').length /
                          Math.max(incidents.filter(i => i.priority === '4 - Low').length, 1)) * 100)}% resolved
                        </small>
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
                <h5>SLA Targets</h5>
              </CardHeader>
              <CardBody>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">Overall Target</span>
                    <span className="text-primary fw-bold">95%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar ${slaMetrics.slaCompliance >= 95 ? 'bg-success' : slaMetrics.slaCompliance >= 90 ? 'bg-warning' : 'bg-danger'}`}
                      style={{ width: `${slaMetrics.slaCompliance}%` }}
                    ></div>
                  </div>
                  <small className="text-muted">Current: {slaMetrics.slaCompliance}%</small>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">Critical Response</span>
                    <span className="text-danger fw-bold">4h</span>
                  </div>
                  <small className="text-muted">Target response time for critical incidents</small>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">High Priority</span>
                    <span className="text-warning fw-bold">24h</span>
                  </div>
                  <small className="text-muted">Target response time for high priority</small>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">Customer Satisfaction</span>
                    <span className="text-success fw-bold">4.2/5</span>
                  </div>
                  <small className="text-muted">Average satisfaction rating</small>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>SLA Management Actions</h5>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="outline-danger">
                        🚨 View SLA Breaches
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="outline-warning">
                        ⏰ Near Breach Alerts
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="outline-info">
                        📊 Generate SLA Report
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="outline-primary" onClick={handleViewAllIncidents}>
                        📋 All Incidents
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

export default SLAManagerDashboard
