'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from 'reactstrap'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Import centralized service - using relative paths that should work
import {
  Incident,
  fetchIncidentsAPI,
  getPriorityColor,
  getStatusColor,
  formatDate,
  getIncidentStats
} from '../../services/incidentService';

import {
  getStoredUserTeam,
  getStoredUserName,
  getStoredUserId,
  mapTeamToRole,
  isAuthenticated
} from '../../services/userService';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const EndUserDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState({
    myIncidents: [] as Incident[],
    totalIncidents: 0,
    solvedIncidents: 0,
    inProgressIncidents: 0,
    pendingIncidents: 0,
    closedIncidents: 0,
    loading: true,
    error: null as string | null
  });

  const [userInfo, setUserInfo] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  // Modal states
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        // Check if user is authenticated
        if (!isAuthenticated()) {
          setDashboardData(prev => ({
            ...prev,
            loading: false,
            error: 'Please log in to view your dashboard'
          }));
          return;
        }

        // Get user info from stored data or session
        const storedName = getStoredUserName();
        const storedTeam = getStoredUserTeam();
        const storedUserId = getStoredUserId();
        const userEmail = session?.user?.email || 'user@example.com';

        setUserInfo({
          name: storedName || session?.user?.name || 'User',
          team: storedTeam || 'End User',
          email: userEmail,
          userId: storedUserId || '13'
        });

        // Fetch user's incidents using centralized service
        const userRole = mapTeamToRole(storedTeam || 'user');
        const userIncidents = await fetchIncidentsAPI(userEmail, userRole);

        // Calculate statistics using centralized function
        const stats = getIncidentStats(userIncidents);

        setDashboardData({
          myIncidents: userIncidents,
          totalIncidents: stats.total,
          solvedIncidents: stats.resolved,
          inProgressIncidents: stats.inProgress,
          pendingIncidents: stats.pending,
          closedIncidents: stats.closed,
          loading: false,
          error: null
        });


      } catch (error: any) {
        console.error('❌ Dashboard fetch error:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load dashboard data'
        }));
      }
    };

    fetchData();
  }, [session?.user?.email]);

  // Takes a date string and converts it into a human-readable date format
  const formatDateLocal = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // This function saves the clicked incident to the state and opens a modal window
  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const pieChartSeries = [
    dashboardData.solvedIncidents,
    dashboardData.inProgressIncidents,
    dashboardData.pendingIncidents,
    dashboardData.closedIncidents
  ];

  // Only show non-zero values and their corresponding labels
  const nonZeroData: number[] = [];
  const nonZeroLabels: string[] = [];
  const allLabels = ['Resolved', 'In Progress', 'Pending', 'Closed'];
  const allColors = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];
  const nonZeroColors: string[] = [];

  pieChartSeries.forEach((value, index) => {
    if (value > 0) {
      nonZeroData.push(value);
      nonZeroLabels.push(allLabels[index]);
      nonZeroColors.push(allColors[index]);
    }
  });

  // ApexCharts configuration for pie chart
  const pieChartOptions = {
    chart: {
      type: 'pie' as const,
      height: 350
    },
    labels: nonZeroLabels.length > 0 ? nonZeroLabels : ['No Data'],
    colors: nonZeroColors.length > 0 ? nonZeroColors : ['#6b7280'],
    legend: {
      position: 'bottom' as const
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom' as const
        }
      }
    }]
  };

  // Monthly trends (calculated from actual data)
  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    // Calculate actual monthly data from incidents
    const monthlyData = months.map((month, index) => {
      const monthIncidents = dashboardData.myIncidents.filter(incident => {
        const incidentMonth = new Date(incident.createdAt).getMonth();
        return incidentMonth === index;
      });

      return {
        reported: monthIncidents.length, // Total incidents reported this month
        resolved: monthIncidents.filter(i => i.status === 'resolved').length, // Only resolved ones
        inProgress: monthIncidents.filter(i => i.status === 'in_progress').length // Only in progress ones
      };
    });

    console.log('📊 Monthly trends data:', monthlyData); // Debug log

    return {
      months,
      reported: monthlyData.map(d => d.reported),
      resolved: monthlyData.map(d => d.resolved),
      inProgress: monthlyData.map(d => d.inProgress)
    };
  };

  const { months, reported, resolved, inProgress } = getMonthlyTrends();

  const barChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: months,
    },
    yaxis: {
      title: {
        text: 'Number of Incidents'
      }
    },
    fill: {
      opacity: 1
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b']
  };

  const barChartSeries = [{
    name: 'Reported',
    data: reported
  }, {
    name: 'Resolved',
    data: resolved
  }, {
    name: 'In Progress',
    data: inProgress
  }];

  // Handle navigation
  const handleCreateIncident = () => {
    router.push('/dashboard?tab=create-incident');
  };

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const handleRefreshData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      const storedTeam = getStoredUserTeam();
      const userEmail = session?.user?.email || 'user@example.com';
      const userRole = mapTeamToRole(storedTeam || 'user');
      const userIncidents = await fetchIncidentsAPI(userEmail, userRole);
      const stats = getIncidentStats(userIncidents);

      setDashboardData({
        myIncidents: userIncidents,
        totalIncidents: stats.total,
        solvedIncidents: stats.resolved,
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
        error: error.message || 'Failed to refresh data'
      }));
    }
  };

  if (dashboardData.loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading your dashboard...</span>
          </div>
          <p className="mt-3 text-muted">Fetching your incidents...</p>
        </div>
      </Container>
    );
  }

  if (dashboardData.error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {dashboardData.error}
          <Button color="link" onClick={handleRefreshData} className="p-0 ms-2">
            Try again
          </Button>
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

        {/* Statistics Cards */}
        <Row>
          <Col xl={3} md={6} className="box-col-6 mt-3">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{dashboardData.totalIncidents}</h5>
                      <span className="f-light">My Total Incidents</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6 mt-3">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{dashboardData.solvedIncidents}</h5>
                      <span className="f-light">Resolved</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6 mt-3">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{dashboardData.inProgressIncidents}</h5>
                      <span className="f-light">In Progress</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6 mt-3">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{dashboardData.pendingIncidents}</h5>
                      <span className="f-light">Pending</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row>
          <Col lg={8}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>My Recent Incidents</h5>
                  {dashboardData.totalIncidents > 0 && (
                    <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                      View All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {dashboardData.myIncidents.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </div>
                    <h6 className="text-muted">No incidents reported yet</h6>
                    <p className="text-muted">You haven't reported any incidents yet. Click below to report your first incident.</p>
                    <Button color="primary" onClick={handleCreateIncident}>
                      Report Your First Incident
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordernone">
                      <thead>
                        <tr>
                          <th scope="col">Incident</th>
                          <th scope="col">Title</th>
                          <th scope="col">Status</th>
                          <th scope="col">Assigned To</th>
                          <th scope="col">Reported Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.myIncidents.slice(0, 3).map((incident) => (
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
                            <td>{formatDateLocal(incident.createdAt)}</td>
                            {/* <td>
                              <Button
                                color="outline-primary"
                                size="sm"
                                onClick={() => handleViewIncident(incident)}
                              >
                                👁 View
                              </Button>
                            </td> */}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <CardHeader className="pb-3 pt-3">
                <h5>Status Overview</h5>
              </CardHeader>
              <CardBody>
                {dashboardData.totalIncidents > 0 ? (
                  <Chart
                    options={pieChartOptions}
                    series={nonZeroData.length > 0 ? nonZeroData : [1]}
                    type="pie"
                    height={300}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No data to display</p>
                    <small className="text-muted">Report your first incident to see status overview</small>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Monthly Trends */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>My Monthly Incident Trends</h5>
              </CardHeader>
              <CardBody>
                {dashboardData.totalIncidents > 0 ? (
                  <Chart
                    options={barChartOptions}
                    series={barChartSeries}
                    type="bar"
                    height={350}
                  />
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No trend data available yet</p>
                    <small className="text-muted">Report incidents to see monthly trends</small>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* View Modal
      {showViewModal && selectedIncident && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Incident Details - {selectedIncident.number}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Caller:</strong>
                      <span className="ms-2">{selectedIncident.caller}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Contact Type:</strong>
                      <span className="ms-2">{selectedIncident.contactType}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Category:</strong>
                      <span className="ms-2">{selectedIncident.category}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Sub Category:</strong>
                      <span className="ms-2">{selectedIncident.subCategory}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Impact:</strong>
                      <span className="ms-2">{selectedIncident.impact}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Priority:</strong>
                      <span
                        className="badge ms-2"
                        style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }}
                      >
                        {selectedIncident.priority}
                      </span>
                    </div>
                    <div className="mb-3">
                      <strong>Status:</strong>
                      <span
                        className="badge ms-2"
                        style={{ backgroundColor: getStatusColor(selectedIncident.status || 'pending'), color: 'white' }}
                      >
                        {(selectedIncident.status || 'pending').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mb-3">
                      <strong>Urgency:</strong>
                      <span className="ms-2">{selectedIncident.urgency}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Assigned To:</strong>
                      <span className="ms-2">{selectedIncident.assignedTo || 'Unassigned'}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Reported By:</strong>
                      <span className="ms-2">{selectedIncident.reportedByName}</span>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <hr />
                    <div className="mb-3">
                      <strong>Short Description:</strong>
                      <p className="mt-2 p-3 bg-light rounded">{selectedIncident.shortDescription}</p>
                    </div>
                    <div className="mb-3">
                      <strong>Detailed Description:</strong>
                      <p className="mt-2 p-3 bg-light rounded">{selectedIncident.description}</p>
                    </div>
                    <hr />
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Created:</strong>
                          <span className="ms-2">{formatDate(selectedIncident.createdAt)}</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        {selectedIncident.updatedAt && (
                          <div className="mb-3">
                            <strong>Last Updated:</strong>
                            <span className="ms-2">{formatDate(selectedIncident.updatedAt)}</span>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleViewAllIncidents();
                  }}
                >
                  View All My Incidents
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </>
  )
}

export default EndUserDashboard
