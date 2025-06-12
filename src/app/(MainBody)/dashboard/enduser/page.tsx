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
  getStatusColor,
  getPriorityColor,
  Incident
} from '../../services/incidentService';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));

        if (!session?.user?.email) {
          setDashboardData(prev => ({
            ...prev,
            loading: false,
            error: 'Please log in to view your dashboard'
          }));
          return;
        }

        // Get user info from session
        const user = session.user as any;
        setUserInfo({
          name: user.name || 'User',
          team: user.team || 'End User',
          email: user.email || '',
          userId: user.id || ''
        });

        // Fetch user's incidents using API
        const userIncidents = await fetchIncidentsAPI(user.email, 'USER');
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
        console.error('Dashboard fetch error:', error);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load dashboard data'
        }));
      }
    };

    if (session?.user) {
      fetchData();
    } else {
      router.replace('/auth/login');
    }
  }, [session, router]);

  // Format date for display
  const formatDateLocal = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Pie chart configuration
  const pieChartSeries = [
    dashboardData.solvedIncidents,
    dashboardData.inProgressIncidents,
    dashboardData.pendingIncidents,
    dashboardData.closedIncidents
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

  // Monthly trends calculation
  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    const monthlyData = months.map((month, index) => {
      const monthIncidents = dashboardData.myIncidents.filter(incident => {
        const incidentMonth = new Date(incident.createdAt).getMonth();
        return incidentMonth === index;
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
    router.push('/dashboard?tab=all-incidents');
  };

  const handleRefreshData = async () => {
    if (session?.user?.email) {
      const user = session.user as any;
      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));
        const userIncidents = await fetchIncidentsAPI(user.email, 'USER');
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
    }
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
    </>
  )
}

export default EndUserDashboard
