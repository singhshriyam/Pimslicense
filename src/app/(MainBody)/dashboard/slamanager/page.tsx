'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge } from 'reactstrap'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  getIncidentStats,
  formatDate,
  getPriorityColor,
  getStatusColor,
  Incident
} from '../../services/incidentService';

import {
  getCurrentUser,
  isAuthenticated,
  clearUserData,
  mapTeamToRole
} from '../../services/userService';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const DeveloperDashboard = () => {
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
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
          name: currentUser.name || 'SLA Manager',
          team: currentUser.team || 'SLA Management',
          email: currentUser.email || '',
          userId: currentUser.id || ''
        });

        // For now, we'll use mock data - you can replace with actual API calls
        // const userRole = mapTeamToRole(currentUser.team || 'sla manager');
        // const incidentsData = await fetchIncidentsAPI(currentUser.email, userRole);
        // setIncidents(incidentsData);

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const stats = getIncidentStats(incidents);

  // SLA Performance Metrics
  const slaMetrics = {
    responseTimeCompliance: 94.2,
    resolutionTimeCompliance: 89.7,
    availabilityTarget: 99.9,
    currentAvailability: 99.6,
    criticalIncidentsThisMonth: 3,
    slaBreaches: 7,
    customerSatisfaction: 4.2,
    totalSLAs: 24
  };

  // SLA Performance Chart
  const slaPerformanceOptions = {
    chart: {
      type: 'line' as const,
      height: 350
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const
    },
    title: {
      text: 'SLA Performance Trends',
      align: 'left' as const
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    },
    yaxis: {
      title: {
        text: 'Compliance %'
      },
      min: 80,
      max: 100
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b']
  };

  const slaPerformanceSeries = [{
    name: 'Response Time SLA',
    data: [92, 89, 94, 91, 96, 94]
  }, {
    name: 'Resolution Time SLA',
    data: [88, 85, 90, 87, 92, 90]
  }, {
    name: 'Availability SLA',
    data: [99.5, 99.2, 99.7, 99.4, 99.8, 99.6]
  }];

  // SLA Breach Distribution
  const slaBreachOptions = {
    chart: {
      type: 'donut' as const,
      height: 300
    },
    labels: ['Response Time', 'Resolution Time', 'Availability', 'Quality'],
    colors: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
    legend: {
      position: 'bottom' as const
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return Math.round(val) + '%'
      }
    }
  };

  const slaBreachSeries = [45, 30, 15, 10];

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const handleCreateSLA = () => {
    router.push('/dashboard?tab=create-sla');
  };

  const handleSLAReports = () => {
    router.push('/dashboard?tab=sla-reports');
  };

  // Calculate SLA status for incidents
  const getSLAStatus = (incident: Incident) => {
    const createdTime = new Date(incident.createdAt);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);

    if (incident.priority?.toLowerCase().includes('critical')) {
      return hoursSinceCreated > 4 ? 'Breached' : 'Within SLA';
    } else if (incident.priority?.toLowerCase().includes('high')) {
      return hoursSinceCreated > 8 ? 'Breached' : 'Within SLA';
    } else {
      return hoursSinceCreated > 24 ? 'Breached' : 'Within SLA';
    }
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading SLA Manager dashboard...</p>
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
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          {/* SLA Performance Trends */}
          <Col lg={8}>
            <Card>
              <CardHeader className="pb-0">
                <h5>📈 SLA Performance Trends</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={slaPerformanceOptions}
                  series={slaPerformanceSeries}
                  type="line"
                  height={350}
                />
              </CardBody>
            </Card>
          </Col>

          {/* SLA Breach Distribution */}
          <Col lg={4}>
            <Card>
              <CardHeader className="pb-0">
                <h5>🚨 SLA Breach Analysis</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={slaBreachOptions}
                  series={slaBreachSeries}
                  type="donut"
                  height={300}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Recent SLA Events */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>🚨 Recent SLA Events & Incidents</h5>
                  <Button color="outline-success" size="sm" onClick={handleViewAllIncidents}>
                    View All Incidents
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
                          <th>Description</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>SLA Status</th>
                          <th>Time to Response</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.slice(0, 5).map((incident) => {
                          const slaStatus = getSLAStatus(incident);
                          return (
                            <tr key={incident.id}>
                              <td>
                                <span className="fw-medium text-success">{incident.number}</span>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium">{incident.shortDescription}</div>
                                  <small className="text-muted">{incident.category}</small>
                                </div>
                              </td>
                              <td>
                                <Badge style={{ backgroundColor: getPriorityColor(incident.priority), color: 'white' }}>
                                  {incident.priority}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{ backgroundColor: getStatusColor(incident.status || 'pending'), color: 'white' }}>
                                  {(incident.status || 'pending').replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={slaStatus === 'Within SLA' ? 'success' : 'danger'}>
                                  {slaStatus}
                                </Badge>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {Math.floor(Math.random() * 4) + 1}h {Math.floor(Math.random() * 60)}m
                                </span>
                              </td>
                              <td>{formatDate(incident.createdAt)}</td>
                              <td>
                                <Button color="outline-success" size="sm">
                                  Review SLA
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
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
                    <h6 className="text-muted">No recent SLA events</h6>
                    <p className="text-muted">All service levels are being met according to agreements.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default DeveloperDashboard
