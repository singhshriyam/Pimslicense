'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import InteractiveIncidentMap from '../../../../Components/InteractiveIncidentMap';

import {
  fetchAllIncidents,
  fetchIncidentsByUserRole,
  getIncidentStats,
  formatDate,
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../../../(MainBody)/services/incidentService';

import {
  getCurrentUser,
  isAuthenticated
} from '../../../(MainBody)/services/userService';

import AllIncidents from '../../../../Components/AllIncidents';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface User {
  id: string;
  name: string;
  email: string;
  team: string;
  lastActivity?: string;
}

const AdminDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get('view');
  const [showAllIncidents, setShowAllIncidents] = useState(viewParam === 'all-incidents');

  const [dashboardData, setDashboardData] = useState({
    incidents: [] as Incident[],
    totalIncidents: 0,
    resolvedIncidents: 0,
    inProgressIncidents: 0,
    pendingIncidents: 0,
    closedIncidents: 0,
    loading: true,
    error: null as string | null
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  const [loggedInUsers] = useState<User[]>([]);

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
        name: currentUser?.name || 'Administrator',
        team: currentUser?.team || 'Administrator',
        email: currentUser?.email || '',
        userId: currentUser?.id || ''
      });

      // Admin should see ALL incidents - same logic as manager
      const allIncidents = await fetchAllIncidents();
      const stats = getIncidentStats(allIncidents);

      setDashboardData({
        incidents: allIncidents,
        totalIncidents: stats.total,
        resolvedIncidents: stats.resolved,
        inProgressIncidents: stats.inProgress,
        pendingIncidents: stats.pending,
        closedIncidents: stats.closed,
        loading: false,
        error: null
      });

    } catch (error: any) {
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
    setShowAllIncidents(currentViewParam === 'all-incidents');
  }, [searchParams]);

  // Priority data for pie chart
  const getPriorityData = () => {
    const highPriority = dashboardData.incidents.filter(inc =>
      inc.priority?.toLowerCase().includes('high') ||
      inc.priority?.toLowerCase().includes('critical')
    ).length;

    const mediumPriority = dashboardData.incidents.filter(inc =>
      inc.priority?.toLowerCase().includes('medium') ||
      inc.priority?.toLowerCase().includes('moderate')
    ).length;

    const lowPriority = dashboardData.incidents.filter(inc =>
      inc.priority?.toLowerCase().includes('low')
    ).length;

    return { high: highPriority, medium: mediumPriority, low: lowPriority };
  };

  const { high, medium, low } = getPriorityData();

  const priorityData: number[] = [];
  const priorityLabels: string[] = [];
  const priorityColors: string[] = [];

  if (high > 0) {
    priorityData.push(high);
    priorityLabels.push('High Priority');
    priorityColors.push('#dc3545');
  }
  if (medium > 0) {
    priorityData.push(medium);
    priorityLabels.push('Medium Priority');
    priorityColors.push('#ffc107');
  }
  if (low > 0) {
    priorityData.push(low);
    priorityLabels.push('Low Priority');
    priorityColors.push('#28a745');
  }

  const priorityPieChartOptions = {
    chart: {
      type: 'pie' as const,
      height: 350
    },
    labels: priorityLabels.length > 0 ? priorityLabels : ['No Data'],
    colors: priorityColors.length > 0 ? priorityColors : ['#6b7280'],
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

  // Event handlers
  const handlePinClick = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const closeIncidentDetails = () => {
    setSelectedIncident(null);
  };

  const handleViewAllIncidents = () => {
    setShowAllIncidents(true);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', 'all-incidents');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleBackToDashboard = () => {
    setShowAllIncidents(false);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
    window.history.pushState({}, '', newUrl.toString());
  };

  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  if (dashboardData.loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading admin dashboard...</span>
          </div>
        </div>
      </Container>
    );
  }

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

  if (showAllIncidents) {
    return <AllIncidents userType="admin" onBack={handleBackToDashboard} />;
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
                    <h4 className="mb-1">Welcome {user.name}!</h4>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Priority Chart and Currently Logged In Users Row */}
        <Row className="mb-4">
          {/* Incidents by Priority Pie Chart */}
          <Col lg={4}>
            <Card className="h-100">
              <CardHeader className="pb-0">
                <h5>Incidents by Priority</h5>
              </CardHeader>
              <CardBody>
                {dashboardData.totalIncidents > 0 ? (
                  <Chart
                    options={priorityPieChartOptions}
                    series={priorityData.length > 0 ? priorityData : [1]}
                    type="pie"
                    height={350}
                  />
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No priority data available</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          {/* Currently Logged In Users */}
          <Col lg={8}>
            <Card className="h-100">
              <CardHeader className="pb-0">
                <h5>Currently Logged In Users</h5>
              </CardHeader>
              <CardBody>
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                        <th>User Id</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Group</th>
                        <th>Last Activity at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loggedInUsers.length > 0 ? (
                        loggedInUsers.map((loggedUser) => (
                          <tr key={loggedUser.id}>
                            <td>{loggedUser.id}</td>
                            <td className="fw-medium">{loggedUser.name}</td>
                            <td className="text-muted">{loggedUser.email}</td>
                            <td>{loggedUser.team}</td>
                            <td className="text-muted">
                              {loggedUser.lastActivity ? new Date(loggedUser.lastActivity).toLocaleString() : new Date().toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center text-muted">No active users found</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Map Section */}
        <InteractiveIncidentMap
          incidents={dashboardData.incidents}
          onPinClick={handlePinClick}
          height="400px"
        />

        {/* Incident Details Modal */}
        {selectedIncident && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={closeIncidentDetails}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '0',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="m-0">
                <CardHeader className="bg-primary text-white">
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
                          <Badge style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }} className="fs-6">
                            {selectedIncident.priority}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong>Status:</strong>
                        <div>
                          <Badge style={{ backgroundColor: getStatusColor(selectedIncident.status), color: 'white' }} className="fs-6">
                            {selectedIncident.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong>Impact:</strong>
                        <div>{selectedIncident.impact || 'Not specified'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Urgency:</strong>
                        <div>{selectedIncident.urgency || 'Not specified'}</div>
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
                        <strong>Assigned To:</strong>
                        <div>{selectedIncident.assignedTo || 'Unassigned'}</div>
                        {selectedIncident.assignedToEmail && (
                          <small className="text-muted">{selectedIncident.assignedToEmail}</small>
                        )}
                      </div>
                    </Col>
                  </Row>

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

                  <div className="mb-3">
                    <strong>Contact Type:</strong>
                    <div>{selectedIncident.contactType}</div>
                  </div>

                  <div className="text-center mt-4">
                    <Button color="primary" className="me-2">Edit Incident</Button>
                    <Button color="outline-secondary" onClick={closeIncidentDetails}>Close</Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Recent Incidents</h5>
                  <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>View All</Button>
                </div>
              </CardHeader>
              <CardBody>
                {dashboardData.incidents.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="table-borderless">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Description</th>
                          <th>Impact</th>
                          <th>Location</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.incidents.slice(0, 5).map((incident) => (
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
                              <Badge color="secondary">{incident.impact || 'Medium'}</Badge>
                            </td>
                            <td>
                              <div>
                                <span className="text-muted">{incident.address || 'Not specified'}</span>
                              </div>
                            </td>
                            <td>{formatDateLocal(incident.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">No recent incidents</p>
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

export default AdminDashboard
