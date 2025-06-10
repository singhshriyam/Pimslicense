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

const IncidentManagerDashboard = () => {
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
          name: storedName || session?.user?.name || 'Manager',
          team: storedTeam || 'Incident Manager',
          email: userEmail
        });

        // Fetch all incidents (managers can see all)
        const userRole = mapTeamToRole(storedTeam || 'incident_manager');
        const incidentsData = await fetchIncidentsAPI(userEmail, userRole);
        setIncidents(incidentsData);

        // Fetch all users for team management
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

  // Mixed chart options for incidents overview
  const mixedChartOptions = {
    chart: {
      type: 'line' as const,
      height: 350
    },
    stroke: {
      width: [0, 4]
    },
    title: {
      text: 'Water Pollution Incident Management Overview'
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1]
    },
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    xaxis: {
      type: 'category' as const
    },
    yaxis: [{
      title: {
        text: 'Incidents',
      },
    }, {
      opposite: true,
      title: {
        text: 'Resolution Rate %'
      }
    }],
    colors: ['#3b82f6', '#10b981']
  };

  const mixedChartSeries = [{
    name: 'Total Incidents',
    type: 'column',
    data: [23, 28, 35, 41, 38, stats.total || 45]
  }, {
    name: 'Resolution Rate',
    type: 'line',
    data: [65, 72, 78, 85, 82, stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0]
  }];

  // Radial bar chart for team performance
  const radialBarOptions = {
    chart: {
      type: 'radialBar' as const,
      height: 350
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
          image: undefined,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          }
        }
      }
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    labels: ['Handlers', 'Managers', 'End Users', 'Active'],
    legend: {
      show: true,
      floating: true,
      fontSize: '12px',
      position: 'left' as const,
      offsetX: 50,
      offsetY: 10,
      labels: {
        useSeriesColors: true,
      },
      formatter: function(seriesName: string, opts: any) {
        return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%"
      }
    },
  };

  const totalUsers = userStats.total || 1;
  const radialBarSeries = [
    Math.round((userStats.handlers / totalUsers) * 100),
    Math.round((userStats.managers / totalUsers) * 100),
    Math.round((userStats.endUsers / totalUsers) * 100),
    Math.round((userStats.active / totalUsers) * 100)
  ];

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const getRecentManagementActivities = () => {
    return incidents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(incident => ({
        activity: incident.status === 'in_progress' ? 'Task Assignment' : 'Progress Review',
        handler: incident.assignedTo || 'Unassigned',
        incidentType: incident.category,
        priority: incident.priority,
        date: new Date(incident.createdAt).toLocaleDateString(),
        status: incident.status,
        incident
      }));
  };

  const recentActivities = getRecentManagementActivities();

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case '1 - Critical': return 'badge-danger';
      case '2 - High': return 'badge-warning';
      case '3 - Medium': return 'badge-info';
      case '4 - Low': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'badge-success';
      case 'in_progress': return 'badge-primary';
      case 'pending': return 'badge-warning';
      case 'closed': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading management dashboard...</p>
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

        {/* Statistics Cards */}
        <Row>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{stats.total}</h5>
                      <span className="f-light">Total Incidents</span>
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
                      <h5 className="mb-0 counter">{userStats.handlers}</h5>
                      <span className="f-light">Active Handlers</span>
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
                      <h5 className="mb-0 counter">{stats.pending}</h5>
                      <span className="f-light">Pending Assignment</span>
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
                      <h5 className="mb-0 counter">{stats.resolved}</h5>
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
                <h5>Overview</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={mixedChartOptions}
                  series={mixedChartSeries}
                  type="line"
                  height={350}
                />
              </CardBody>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <CardHeader className="pb-0">
                <h5>Team Performance</h5>
              </CardHeader>
              <CardBody>
                {userStats.total > 0 ? (
                  <Chart
                    options={radialBarOptions}
                    series={radialBarSeries}
                    type="radialBar"
                    height={300}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No team data available</p>
                    <small className="text-muted">Unable to load user statistics</small>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col sm={12}>
            <Card>
              <CardHeader className="pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Recent Team Activities</h5>
                </div>
              </CardHeader>
              <CardBody>
                {recentActivities.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordernone">
                      <thead>
                        <tr>
                          <th>Activity</th>
                          <th>Handler Assigned</th>
                          <th>Impact</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivities.map((activity, index) => (
                          <tr key={index}>
                            <td>{activity.activity}</td>
                            <td>{activity.handler}</td>
                            <td>{activity.impact}</td>
                            <td>
                              <span className={`badge ${getPriorityBadgeClass(activity.priority)}`}>
                                {activity.priority.split(' - ')[1] || activity.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(activity.status)}`}>
                                {activity.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">No recent management activities</p>
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

export default IncidentManagerDashboard
