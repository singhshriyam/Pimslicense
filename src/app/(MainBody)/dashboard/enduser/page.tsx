'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, Button } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  getCurrentUser,
  isAuthenticated,
  clearUserData
} from '../../services/userService';

import {
  fetchIncidentsByUserRole,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../../services/incidentService';

// Import the unified AllIncidents component
import AllIncidents from '../../../../Components/AllIncidents';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const EndUserDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we should show all incidents based on URL parameter
  const viewParam = searchParams.get('view');
  const statusParam = searchParams.get('status'); // Add status parameter for filtered view
  const [showAllIncidents, setShowAllIncidents] = useState(viewParam === 'all-incidents');
  const [filterByStatus, setFilterByStatus] = useState<string | null>(statusParam);

  const [dashboardData, setDashboardData] = useState({
    myIncidents: [] as Incident[],
    loading: true,
    error: null as string | null
  });

  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  // Force data refresh function
  const fetchData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // Check authentication
      if (!isAuthenticated()) {
        router.replace('/auth/login');
        return;
      }

      // Get current user
      const currentUser = getCurrentUser();
      setUser({
        name: currentUser?.name || 'User',
        team: currentUser?.team || 'End User',
        email: currentUser?.email || '',
        userId: currentUser?.id || ''
      });

      // Fetch user's incidents using unified service
      const userIncidents = await fetchIncidentsByUserRole('enduser');

      setDashboardData({
        myIncidents: userIncidents,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
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

  // Update showAllIncidents when URL parameter changes
  useEffect(() => {
    const currentViewParam = searchParams.get('view');
    const currentStatusParam = searchParams.get('status');
    setShowAllIncidents(currentViewParam === 'all-incidents');
    setFilterByStatus(currentStatusParam);
  }, [searchParams]);

  // Get statistics
  const stats = getIncidentStats(dashboardData.myIncidents);

  // Format date for display without time
  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  // Safe function to get category name
  const getCategoryName = (incident: Incident): string => {
    if (typeof incident.category === 'string') return incident.category;
    if (typeof incident.category === 'object' && incident.category?.name) return incident.category.name;
    return 'Uncategorized';
  };

  // Safe function to get assigned person name
  const getAssignedToName = (incident: Incident): string => {
    if (typeof incident.assigned_to === 'string') return incident.assigned_to;
    if (typeof incident.assigned_to === 'object' && incident.assigned_to?.name) return incident.assigned_to.name;
    return 'Unassigned';
  };

  // Safe function to get incident ID as string
  const getIncidentId = (incident: Incident): string => {
    if (typeof incident.id === 'string') return incident.id;
    if (typeof incident.id === 'number') return incident.id.toString();
    if (typeof incident.incident_no === 'string') return incident.incident_no;
    return 'Unknown';
  };

  // Safe function to get status display name
  const getStatusDisplayName = (status: string): string => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ');
  };

  // Pie chart configuration
  const pieChartSeries = [
    stats.resolved,
    stats.inProgress,
    stats.pending,
    stats.closed
  ];

  // Only show non-zero values
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

  const pieChartOptions = {
    chart: {
      type: 'pie' as const,
      height: 350,
      events: {
        dataPointSelection: function(event: any, chartContext: any, config: any) {
          // Prevent the default chart behavior and add safety checks
          if (!config || typeof config.dataPointIndex === 'undefined') {
            console.warn('Invalid chart config');
            return;
          }

          try {
            // Add bounds checking
            if (config.dataPointIndex < 0 || config.dataPointIndex >= nonZeroLabels.length) {
              console.warn('Invalid data point index');
              return;
            }

            const selectedLabel = nonZeroLabels[config.dataPointIndex];
            let statusToFilter = '';

            switch(selectedLabel) {
              case 'Resolved':
                statusToFilter = 'resolved';
                break;
              case 'In Progress':
                statusToFilter = 'in_progress';
                break;
              case 'Pending':
                statusToFilter = 'pending';
                break;
              case 'Closed':
                statusToFilter = 'closed';
                break;
            }

            if (statusToFilter) {
              // Use setTimeout to ensure DOM is ready and prevent race conditions
              setTimeout(() => {
                try {
                  // Navigate to all incidents view with status filter
                  setShowAllIncidents(true);
                  setFilterByStatus(statusToFilter);

                  // Safely update URL
                  if (typeof window !== 'undefined' && window.location) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('view', 'all-incidents');
                    newUrl.searchParams.set('status', statusToFilter);
                    window.history.pushState({}, '', newUrl.toString());
                  }
                } catch (urlError) {
                  console.warn('URL update error:', urlError);
                  // Still update the view even if URL update fails
                  setShowAllIncidents(true);
                  setFilterByStatus(statusToFilter);
                }
              }, 0);
            }
          } catch (error) {
            console.warn('Chart interaction error:', error);
          }
        }
      }
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
    }],
    tooltip: {
      y: {
        formatter: function(val: number) {
          return val + ' incidents'
        }
      }
    }
  };

  // Monthly trends calculation
  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    const monthlyData = months.map((month, index) => {
      const monthIncidents = dashboardData.myIncidents.filter(incident => {
        try {
          const incidentMonth = new Date(incident.created_at).getMonth();
          return incidentMonth === index;
        } catch (error) {
          return false;
        }
      });

      return {
        reported: monthIncidents.length,
        resolved: monthIncidents.filter(i => i.status === 'resolved').length,
        inProgress: monthIncidents.filter(i => i.status === 'in_progress').length
      };
    });

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

  // Navigation handlers
  const handleCreateIncident = () => {
    router.push('/dashboard?tab=create-incident');
  };

  const handleViewAllIncidents = () => {
    setShowAllIncidents(true);
    // Update URL without page refresh
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', 'all-incidents');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleBackToDashboard = () => {
    setShowAllIncidents(false);
    setFilterByStatus(null);
    // Update URL without page refresh
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
    newUrl.searchParams.delete('status');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleRefreshData = async () => {
    await fetchData();
  };

  const handleLogout = () => {
    clearUserData();
    router.replace('/auth/login');
  };

  if (dashboardData.loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading your dashboard...</span>
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
          <Button color="link" onClick={handleRefreshData} className="p-0 ms-2">
            Try again
          </Button>
        </div>
      </Container>
    );
  }

  // Render All Incidents View using unified component
  if (showAllIncidents) {
    return (
      <AllIncidents
        userType="enduser"
        onBack={handleBackToDashboard}
        initialStatusFilter={filterByStatus}
      />
    );
  }

  // Render Dashboard View (Default)
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
                    <h4 className="mb-1">Welcome back, {user.name}!</h4>
                  </div>
                  <div>
                    <Button color="primary" onClick={handleCreateIncident}>
                      + Report Incident
                    </Button>
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
                      <h5 className="mb-0 counter">{stats.total}</h5>
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
                      <h5 className="mb-0 counter">{stats.resolved}</h5>
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
                      <h5 className="mb-0 counter">{stats.inProgress}</h5>
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
                      <h5 className="mb-0 counter">{stats.pending}</h5>
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
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>My Recent Incidents</h5>
                  <div>
                    {stats.total > 0 && (
                      <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                        View All
                      </Button>
                    )}
                  </div>
                </div>

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
                          <th scope="col">Category</th>
                          <th scope="col">Status</th>
                          <th scope="col">Assigned To</th>
                          <th scope="col">Reported Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Show the 4 most recent incidents (sorted by createdAt descending) */}
                        {dashboardData.myIncidents
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 4)
                          .map((incident) => (
                          <tr key={incident.id}>
                            <td>
                              <span className="fw-medium text-primary">{getIncidentId(incident)}</span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">{getCategoryName(incident)}</div>
                              </div>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{ backgroundColor: getStatusColor(incident.status), color: 'white' }}
                              >
                                {getStatusDisplayName(incident.status)}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted">
                                {getAssignedToName(incident)}
                              </span>
                            </td>
                            <td>{formatDateLocal(incident.created_at)}</td>
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
              <CardBody>
                <h5 className="mb-3">Status Overview</h5>
                {stats.total > 0 ? (
                  <div style={{ minHeight: '300px' }}>
                    <Chart
                      options={pieChartOptions}
                      series={nonZeroData.length > 0 ? nonZeroData : [1]}
                      type="pie"
                      height={300}
                      key={`pie-chart-${stats.total}-${nonZeroData.join('-')}`}
                    />
                  </div>
                ) : (
                  <div className="text-center py-4" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
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
              <CardBody>
                <h5 className="mb-3">My Monthly Incident Trends</h5>
                {stats.total > 0 ? (
                  <div style={{ minHeight: '350px' }}>
                    <Chart
                      options={barChartOptions}
                      series={barChartSeries}
                      type="bar"
                      height={350}
                      key={`bar-chart-${stats.total}-${reported.join('-')}`}
                    />
                  </div>
                ) : (
                  <div className="text-center py-5" style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <p className="text-muted">No trend data available yet</p>
                    <small className="text-muted">Report incidents to see monthly trends</small>
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

export default EndUserDashboard
