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
  type Incident
} from '../../services/incidentService';

// Import the unified AllIncidents component
import AllIncidents from '../../../../Components/AllIncidents';
import AssignIncidents from '../../../../Components/AssignIncidents';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const IncidentHandlerDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get('view');
  const statusParam = searchParams.get('status'); // Add status parameter for filtered view
  const [currentView, setCurrentView] = useState(viewParam || 'dashboard');
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

  useEffect(() => {
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
          name: currentUser?.name || 'Handler',
          team: currentUser?.team || 'Incident Handler',
          email: currentUser?.email || '',
          userId: currentUser?.id || ''
        });

        // Fetch incidents assigned to this handler using unified service
        const userIncidents = await fetchIncidentsByUserRole('handler');

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

    fetchData();
  }, [router]);

  useEffect(() => {
    const currentViewParam = searchParams.get('view');
    const currentStatusParam = searchParams.get('status');
    setCurrentView(currentViewParam || 'dashboard');
    setFilterByStatus(currentStatusParam);
  }, [searchParams]);

  // Get statistics
  const stats = getIncidentStats(dashboardData.myIncidents);

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
    setFilterByStatus(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
    newUrl.searchParams.delete('status');
    window.history.pushState({}, '', newUrl.toString());
  };

  // Format date for display
  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  // Render different views based on current view
  if (currentView === 'all-incidents') {
    return <AllIncidents userType="handler" onBack={handleBackToDashboard} initialStatusFilter={filterByStatus} />;
  }

  if (currentView === 'assign-incidents') {
    return <AssignIncidents userType="handler" onBack={handleBackToDashboard} />;
  }

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
  const allLabels = ['Completed', 'In Progress', 'Pending', 'Closed'];
  const allColors = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];
  const nonZeroColors: string[] = [];

  pieChartSeries.forEach((value, index) => {
    if (value > 0) {
      nonZeroData.push(value);
      nonZeroLabels.push(allLabels[index]);
      nonZeroColors.push(allColors[index]);
    }
  });

  const pieChartOptions: any = {
    chart: {
      type: 'pie',
      height: 350,
      events: {
        dataPointSelection: function(event: any, chartContext: any, config: any) {
          try {
            const selectedLabel = nonZeroLabels[config.dataPointIndex];
            let statusToFilter = '';

            switch(selectedLabel) {
              case 'Completed':
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
              // Navigate to all incidents view with status filter
              setCurrentView('all-incidents');
              setFilterByStatus(statusToFilter);
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('view', 'all-incidents');
              newUrl.searchParams.set('status', statusToFilter);
              window.history.pushState({}, '', newUrl.toString());
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
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
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
          const incidentMonth = new Date(incident.createdAt).getMonth();
          return incidentMonth === index;
        } catch (error) {
          return false;
        }
      });

      return {
        assigned: monthIncidents.length,
        completed: monthIncidents.filter(i => i.status === 'resolved').length,
        inProgress: monthIncidents.filter(i => i.status === 'in_progress').length
      };
    });

    return {
      months,
      assigned: monthlyData.map(d => d.assigned),
      completed: monthlyData.map(d => d.completed),
      inProgress: monthlyData.map(d => d.inProgress)
    };
  };

  const { months, assigned, completed, inProgress } = getMonthlyTrends();

  const barChartOptions: any = {
    chart: {
      type: 'bar',
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
    name: 'Assigned',
    data: assigned
  }, {
    name: 'Completed',
    data: completed
  }, {
    name: 'In Progress',
    data: inProgress
  }];

  const handleRefreshData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      const userIncidents = await fetchIncidentsByUserRole('handler');

      setDashboardData({
        myIncidents: userIncidents,
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
                      <span className="f-light">My Total Assignments</span>
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
                      <span className="f-light">Completed</span>
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
                  <h5>My Recent Assigned Incidents</h5>
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
                    <h6 className="text-muted">No incidents assigned yet</h6>
                    <p className="text-muted">You don't have any assigned incidents at the moment. Check back later for new assignments.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordernone">
                      <thead>
                        <tr>
                          <th scope="col">Incident</th>
                          <th scope="col">Category</th>
                          <th scope="col">Priority</th>
                          <th scope="col">Status</th>
                          <th scope="col">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Show the 4 most recent incidents (sorted by createdAt) */}
                        {dashboardData.myIncidents
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 4)
                          .map((incident) => (
                          <tr key={incident.id}>
                            <td>
                              <span className="fw-medium text-primary">{incident.number}</span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">{incident.category}</div>
                                <small className="text-muted">Caller: {incident.caller}</small>
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
                                style={{ backgroundColor: getStatusColor(incident.status), color: 'white' }}
                              >
                                {incident.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>{formatDateLocal(incident.createdAt)}</td>
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
                <h5 className="mb-3">Task Overview</h5>
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
                    <small className="text-muted">No incidents assigned yet</small>
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
                <h5 className="mb-3">My Monthly Performance Trends</h5>
                {stats.total > 0 ? (
                  <div style={{ minHeight: '350px' }}>
                    <Chart
                      options={barChartOptions}
                      series={barChartSeries}
                      type="bar"
                      height={350}
                      key={`bar-chart-${stats.total}-${assigned.join('-')}`}
                    />
                  </div>
                ) : (
                  <div className="text-center py-5" style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <p className="text-muted">No trend data available yet</p>
                    <small className="text-muted">No assignments to show trends</small>
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

export default IncidentHandlerDashboard
