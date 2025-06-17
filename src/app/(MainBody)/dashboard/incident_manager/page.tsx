'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import InteractiveIncidentMap from '../../../../Components/InteractiveIncidentMap';

import {
  fetchAllIncidents,
  fetchEndUserIncidents,
  fetchHandlerIncidents,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../../services/incidentService';

import {
  getCurrentUser,
  isAuthenticated
} from '../../services/userService';

import AllIncidents from '../../../../Components/AllIncidents';
import AssignIncidents from '../../../../Components/AssignIncidents';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const IncidentManagerDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get('view');
  const [currentView, setCurrentView] = useState(viewParam || 'dashboard');

  const [dashboardData, setDashboardData] = useState({
    managedIncidents: [] as Incident[],
    loading: true,
    error: null as string | null
  });

  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      if (!isAuthenticated()) {
        router.replace('/auth/login');
        return;
      }

      const currentUser = getCurrentUser();
      setUser({
        name: currentUser?.name || 'Manager',
        team: currentUser?.team || 'Incident Manager',
        email: currentUser?.email || '',
        userId: currentUser?.id || ''
      });

      console.log('🔍 Manager Dashboard: Fetching incidents...');
      console.log('👤 Current user:', currentUser);

      // MANAGER SHOULD SEE ALL INCIDENTS - same as admin
      const allIncidents = await fetchAllIncidents();

      console.log('📊 Manager Dashboard: Received incidents:', allIncidents);
      console.log('📊 Total incidents count:', allIncidents.length);

      setDashboardData({
        managedIncidents: allIncidents,
        loading: false,
        error: null
      });

      console.log('✅ Manager Dashboard data updated successfully');

    } catch (error: any) {
      console.error('❌ Manager Dashboard fetch error:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  useEffect(() => {
    const currentViewParam = searchParams.get('view');
    setCurrentView(currentViewParam || 'dashboard');
  }, [searchParams]);

  // Calculate stats
  const stats = getIncidentStats(dashboardData.managedIncidents);

  console.log('📊 Manager Dashboard Stats:', stats);

  // SLA Status calculation
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

  // Navigation handlers
  const handleViewAllIncidents = () => {
    setCurrentView('all-incidents');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', 'all-incidents');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleViewAssignIncidents = () => {
    setCurrentView('assign-incidents');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', 'assign-incidents');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
    window.history.pushState({}, '', newUrl.toString());
  };

  // Event handlers
  const handlePinClick = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const closeIncidentDetails = () => {
    setSelectedIncident(null);
  };

  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Render different views based on current view
  if (currentView === 'all-incidents') {
    return <AllIncidents userType="manager" onBack={handleBackToDashboard} />;
  }

  if (currentView === 'assign-incidents') {
    return <AssignIncidents userType="manager" onBack={handleBackToDashboard} />;
  }

  // Loading state
  if (dashboardData.loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading manager dashboard...</span>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (dashboardData.error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {dashboardData.error}
          <Button color="link" onClick={fetchData} className="p-0 ms-2">Try again</Button>
        </div>
      </Container>
    );
  }

  // SLA Breach Distribution data for donut chart
  const getSLABreachData = () => {
    if (dashboardData.managedIncidents.length === 0) {
      return { data: [], labels: [], colors: [] };
    }

    // Calculate breaches by type using REAL DATA ONLY
    const breachStats = {
      responseTime: 0,
      resolutionTime: 0,
      availability: 0,
      quality: 0
    };

    dashboardData.managedIncidents.forEach(incident => {
      const createdTime = new Date(incident.createdAt);
      const now = new Date();
      const hoursSinceCreated = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);

      let responseTimeLimit = 24; // default for low priority
      let resolutionTimeLimit = 48; // default for low priority

      if (incident.priority?.toLowerCase().includes('critical')) {
        responseTimeLimit = 1; // 1 hour for critical
        resolutionTimeLimit = 4; // 4 hours for critical
      } else if (incident.priority?.toLowerCase().includes('high')) {
        responseTimeLimit = 4; // 4 hours for high
        resolutionTimeLimit = 8; // 8 hours for high
      } else if (incident.priority?.toLowerCase().includes('medium')) {
        responseTimeLimit = 8; // 8 hours for medium
        resolutionTimeLimit = 24; // 24 hours for medium
      }

      // Response time breach (if not yet assigned or responded)
      if (hoursSinceCreated > responseTimeLimit && incident.status === 'pending') {
        breachStats.responseTime++;
      }

      // Resolution time breach (if not resolved)
      if (hoursSinceCreated > resolutionTimeLimit && incident.status !== 'resolved') {
        breachStats.resolutionTime++;
      }
    });

    const data = [];
    const labels = [];
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']; // red, yellow, purple, cyan

    // Only show categories that have actual breaches
    if (breachStats.responseTime > 0) {
      data.push(breachStats.responseTime);
      labels.push('Response Time');
    }
    if (breachStats.resolutionTime > 0) {
      data.push(breachStats.resolutionTime);
      labels.push('Resolution Time');
    }
    if (breachStats.availability > 0) {
      data.push(breachStats.availability);
      labels.push('Availability');
    }
    if (breachStats.quality > 0) {
      data.push(breachStats.quality);
      labels.push('Quality');
    }

    // If no breaches, show a message
    if (data.length === 0) {
      data.push(1);
      labels.push('No SLA Breaches');
      return { data, labels, colors: ['#10b981'] }; // green for no breaches
    }

    return { data, labels, colors: colors.slice(0, data.length) };
  };

  const { data: slaData, labels: slaLabels, colors: slaColors } = getSLABreachData();

  // Handler Performance data for bar chart (ensure minimum 10 handlers)
  const getHandlerPerformanceData = () => {
    if (dashboardData.managedIncidents.length === 0) {
      return { handlers: [], pending: [], breached: [], resolved: [] };
    }

    // Group incidents by handler using assignedTo field from database
    const handlerMap = new Map();

    dashboardData.managedIncidents.forEach(incident => {
      // Get handler name from assignedTo field
      let handlerName = incident.assignedTo;

      // Handle unassigned incidents
      if (!handlerName || handlerName.trim() === '' || handlerName.toLowerCase() === 'unassigned') {
        handlerName = 'Unassigned';
      } else {
        // Clean up handler name (remove email domain if present)
        if (handlerName.includes('@')) {
          handlerName = handlerName.split('@')[0];
        }
      }

      // Initialize handler stats if not exists
      if (!handlerMap.has(handlerName)) {
        handlerMap.set(handlerName, {
          pending: 0,
          breached: 0,
          resolved: 0
        });
      }

      const handlerStats = handlerMap.get(handlerName);

      // Calculate if incident is breached based on real data
      const createdTime = new Date(incident.createdAt);
      const now = new Date();
      const hoursSinceCreated = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);

      let slaLimit = 24; // default for low priority
      if (incident.priority?.toLowerCase().includes('critical')) {
        slaLimit = 4;
      } else if (incident.priority?.toLowerCase().includes('high')) {
        slaLimit = 8;
      } else if (incident.priority?.toLowerCase().includes('medium')) {
        slaLimit = 12;
      }

      const isBreached = hoursSinceCreated > slaLimit && incident.status !== 'resolved';

      // Categorize incident based on real status from database
      if (incident.status === 'resolved') {
        handlerStats.resolved++;
      } else if (isBreached) {
        handlerStats.breached++;
      } else {
        handlerStats.pending++;
      }
    });

    // Convert map to arrays for chart
    let handlers = [];
    let pending = [];
    let breached = [];
    let resolved = [];

    // Sort handlers by total incidents (descending)
    const sortedHandlers = Array.from(handlerMap.entries())
      .map(([name, stats]) => ({
        name,
        ...stats,
        total: stats.pending + stats.breached + stats.resolved
      }))
      .filter(h => h.total > 0)
      .sort((a, b) => b.total - a.total);

    console.log('📊 Handler Performance Data:', sortedHandlers);

    // Ensure minimum 10 handlers for better bar visualization
    const minHandlers = 10;
    const actualHandlers = sortedHandlers.length;

    // If we have fewer than 10 handlers, add placeholder handlers with zero values
    if (actualHandlers < minHandlers) {
      const handlerNames = [
        'Alex Chen', 'Sarah Wilson', 'Mike Johnson', 'Emily Brown',
        'David Lee', 'Lisa Garcia', 'Tom Anderson', 'Maria Rodriguez',
        'James Taylor', 'Jennifer Wang', 'Chris Miller', 'Amy Zhang',
        'Robert Davis', 'Anna Smith', 'Kevin Liu'
      ];

      // Add real handlers first
      sortedHandlers.forEach(handler => {
        handlers.push(handler.name);
        pending.push(handler.pending);
        breached.push(handler.breached);
        resolved.push(handler.resolved);
      });

      // Add placeholder handlers to reach minimum 10
      const placeholdersNeeded = minHandlers - actualHandlers;
      for (let i = 0; i < placeholdersNeeded; i++) {
        const placeholderName = handlerNames[actualHandlers + i] || `Handler ${actualHandlers + i + 1}`;
        handlers.push(placeholderName);
        pending.push(0);
        breached.push(0);
        resolved.push(0);
      }
    } else {
      // Use actual handlers if we have 10 or more
      sortedHandlers.forEach(handler => {
        handlers.push(handler.name);
        pending.push(handler.pending);
        breached.push(handler.breached);
        resolved.push(handler.resolved);
      });
    }

    return { handlers, pending, breached, resolved };
  };

  const { handlers, pending, breached, resolved } = getHandlerPerformanceData();

  // Chart configurations
  const slaBreachOptions = {
    chart: { type: 'donut' as const, height: 280 },
    labels: slaLabels,
    colors: slaColors,
    legend: { position: 'bottom' as const },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${Math.round(val)}%`
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Breaches',
              formatter: () => {
                const total = slaData.reduce((a, b) => a + b, 0);
                return `${total}`;
              }
            }
          }
        }
      }
    }
  };

  const barChartOptions = {
    chart: { type: 'bar' as const, height: 400 },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: handlers,
      title: {
        text: 'Handlers'
      },
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: { text: 'Number of Incidents' },
      min: 0
    },
    fill: { opacity: 1 },
    colors: ['#ffc107', '#ef4444', '#10b981'], // yellow, red, green
    legend: {
      position: 'top' as const,
      horizontalAlign: 'center' as const
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " incidents"
        }
      }
    }
  };

  const barChartSeries = [
    { name: 'Pending', data: pending },
    { name: 'SLA Breached', data: breached },
    { name: 'Resolved', data: resolved }
  ];

  // Main dashboard view
  return (
    <>
      <Container fluid>
        {/* Header */}
        <Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4">
              <CardBody>
                <h4 className="mb-1">Welcome back, {user.name}!</h4>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row className="mb-4">
          {[
            { value: stats.total, label: 'Total Incidents', color: 'primary', border: 'border-primary' },
            { value: stats.resolved, label: 'Resolved', color: 'success', border: 'border-success' },
            { value: stats.inProgress, label: 'In Progress', color: 'info', border: 'border-info' },
            { value: stats.pending, label: 'Pending', color: 'warning', border: 'border-warning' }
          ].map((stat, index) => (
            <Col xl={3} md={6} key={index}>
              <Card className={`${stat.border} h-100`}>
                <CardBody className="text-center py-4">
                  <h3 className={`mb-0 text-${stat.color}`}>{stat.value}</h3>
                  <p className="text-muted mb-0">{stat.label}</p>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Analytics Row */}
        <Row className="mb-4">
          {/* SLA Breach Analysis Chart */}
          <Col lg={4}>
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">🚨 SLA Breach Analysis</h5>
              </CardHeader>
              <CardBody>
                {stats.total > 0 ? (
                  <Chart
                    options={slaBreachOptions}
                    series={slaData}
                    type="donut"
                    height={280}
                  />
                ) : (
                  <div className="text-center py-5">
                    <div className="text-muted mb-3">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    </div>
                    <p className="text-muted">No SLA breach data available</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Interactive Map */}
          <Col lg={8}>
            <Card className="h-100">
              <CardHeader>
                <h5 className="mb-0">🗺️ Interactive Incident Map</h5>
              </CardHeader>
              <CardBody>
                <InteractiveIncidentMap
                  incidents={dashboardData.managedIncidents}
                  onPinClick={handlePinClick}
                  height="280px"
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Handler Performance Chart */}
        <Row className="mb-4">
          <Col lg={12}>
            <Card>
              <CardHeader>
                <h5 className="mb-0">👤 Team Performance Overview</h5>
              </CardHeader>
              <CardBody>
                {stats.total > 0 && handlers.length > 0 ? (
                  <Chart
                    options={barChartOptions}
                    series={barChartSeries}
                    type="bar"
                    height={400}
                  />
                ) : (
                  <div className="text-center py-5">
                    <div className="text-muted mb-3">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <p className="text-muted">No handler performance data available</p>
                    <small className="text-muted">Handler incident data will appear here as incidents are assigned to handlers</small>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Recent Incidents Table */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">⏳ Recent Incidents ({dashboardData.managedIncidents.length} total)</h5>
                  <div>
                    <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents} className="me-2">
                      View All Incidents
                    </Button>
                    <Button color="outline-warning" size="sm" onClick={handleViewAssignIncidents}>
                      Assign Incidents
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {dashboardData.managedIncidents.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Incident</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>SLA Status</th>
                          <th>Assigned To</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.managedIncidents.slice(0, 5).map((incident) => {
                          const slaStatus = getSLAStatus(incident);
                          return (
                            <tr key={incident.id}>
                              <td>
                                <span className="fw-medium text-primary">{incident.number}</span>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium">{incident.category}</div>
                                </div>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getPriorityColor(incident.priority),
                                  color: 'white'
                                }}>
                                  {incident.priority}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getStatusColor(incident.status),
                                  color: 'white'
                                }}>
                                  {incident.status?.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={slaStatus === 'Within SLA' ? 'success' : 'danger'}>
                                  {slaStatus}
                                </Badge>
                              </td>
                              <td>
                                <small className="text-muted">{incident.assignedTo || 'Unassigned'}</small>
                              </td>
                              <td>
                                <small>{formatDateLocal(incident.createdAt)}</small>
                              </td>
                              <td>
                                <Button
                                  color="outline-primary"
                                  size="sm"
                                  onClick={() => handlePinClick(incident)}
                                >
                                  View
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
                    <div className="text-muted mb-3">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <p className="text-muted mb-0">No incidents found</p>
                    <small className="text-muted">Incidents will appear here as they are created and assigned</small>
                    <div className="mt-3">
                      <Button color="primary" onClick={fetchData}>Refresh Data</Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          }}
          onClick={closeIncidentDetails}
        >
          <div
            className="bg-white rounded shadow-lg"
            style={{
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="m-0">
              <CardHeader className="bg-warning text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-white">📍 Incident Details</h5>
                  <Button
                    color="link"
                    className="text-white p-0"
                    onClick={closeIncidentDetails}
                    style={{ fontSize: '24px', textDecoration: 'none' }}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Incident ID:</strong>
                      <div className="text-primary fs-5 fw-bold">{selectedIncident.number}</div>
                    </div>
                    <div className="mb-3">
                      <strong>Category:</strong>
                      <div>{selectedIncident.category}</div>
                    </div>
                    <div className="mb-3">
                      <strong>Sub Category:</strong>
                      <div>{selectedIncident.subCategory}</div>
                    </div>
                    <div className="mb-3">
                      <strong>Priority:</strong>
                      <div>
                        <Badge
                          style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }}
                          className="fs-6"
                        >
                          {selectedIncident.priority}
                        </Badge>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Status:</strong>
                      <div>
                        <Badge
                          style={{ backgroundColor: getStatusColor(selectedIncident.status), color: 'white' }}
                          className="fs-6"
                        >
                          {selectedIncident.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>SLA Status:</strong>
                      <div>
                        <Badge color={getSLAStatus(selectedIncident) === 'Within SLA' ? 'success' : 'danger'} className="fs-6">
                          {getSLAStatus(selectedIncident)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>Assigned To:</strong>
                      <div>{selectedIncident.assignedTo || 'Unassigned'}</div>
                    </div>
                    <div className="mb-3">
                      <strong>Created:</strong>
                      <div>{formatDateLocal(selectedIncident.createdAt)}</div>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <strong>Description:</strong>
                  <div className="mt-1 p-2 bg-light rounded">
                    {selectedIncident.shortDescription || 'No description available'}
                  </div>
                </div>

                {selectedIncident.description && selectedIncident.description !== selectedIncident.shortDescription && (
                  <div className="mb-3">
                    <strong>Detailed Description:</strong>
                    <div className="mt-1 p-2 bg-light rounded">
                      {selectedIncident.description}
                    </div>
                  </div>
                )}

                {(selectedIncident.address || selectedIncident.postcode || (selectedIncident.latitude && selectedIncident.longitude)) && (
                  <div className="mb-3">
                    <strong>Location:</strong>
                    <div className="mt-1 p-2 bg-light rounded">
                      <div>{selectedIncident.address || 'Address not specified'}</div>
                      {selectedIncident.postcode && (
                        <div><strong>Postcode:</strong> {selectedIncident.postcode}</div>
                      )}
                      {(selectedIncident.latitude && selectedIncident.longitude) && (
                        <div>
                          <strong>GPS Coordinates:</strong> {selectedIncident.latitude.substring(0,8)}, {selectedIncident.longitude.substring(0,8)}
                          <span className="text-success ms-2">📍 Precise Location</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Reported By:</strong>
                      <div>{selectedIncident.reportedByName || selectedIncident.caller}</div>
                      <small className="text-muted">{selectedIncident.reportedBy}</small>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Contact Type:</strong>
                      <div>{selectedIncident.contactType}</div>
                    </div>
                  </Col>
                </Row>

                <div className="text-center mt-4">
                  <Button color="warning" className="me-2">Assign Handler</Button>
                  <Button color="primary" className="me-2">Edit Incident</Button>
                  <Button color="outline-secondary" onClick={closeIncidentDetails}>Close</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

export default IncidentManagerDashboard
