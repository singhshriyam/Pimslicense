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

const IncidentHandlerDashboard = () => {
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
          name: storedName || session?.user?.name || 'Handler',
          team: storedTeam || 'Incident Handler',
          email: userEmail
        });

        // Fetch incidents assigned to this handler
        const userRole = mapTeamToRole(storedTeam || 'incident_handler');
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

  // Convert incidents to tasks for display
  const assignedTasks = incidents.map((incident) => ({
    id: incident.id,
    title: incident.shortDescription,
    priority: incident.priority === '1 - Critical' ? 'high' :
              incident.priority === '2 - High' ? 'high' :
              incident.priority === '3 - Medium' ? 'medium' : 'low',
    dueDate: new Date(incident.createdAt).toLocaleDateString(),
    status: incident.status === 'resolved' ? 'completed' :
            incident.status === 'in_progress' ? 'active' : 'pending',
    incident: incident
  }));

  // Donut chart for task distribution
  const donutChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 350
    },
    labels: ['Completed', 'Active', 'Pending'],
    colors: ['#10b981', '#3b82f6', '#f59e0b'],
    legend: {
      position: 'bottom' as const
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    }
  };

  const donutChartSeries = [
    stats.resolved,
    stats.inProgress,
    stats.pending
  ];

  // Line chart for performance over time
  const lineChartOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    title: {
      text: 'My Task Completion Trend',
      align: 'left' as const
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      },
    },
    xaxis: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    },
    colors: ['#10b981', '#3b82f6']
  };

  const lineChartSeries = [{
    name: "Tasks Completed",
    data: [2, 3, 4, 2, 3, stats.resolved || 0]
  }, {
    name: "Tasks Assigned",
    data: [3, 4, 3, 5, 4, stats.total || 0]
  }];

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'active': return 'badge-primary';
      case 'pending': return 'badge-secondary';
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
          <p className="mt-2 text-muted">Loading your assigned incidents...</p>
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
            <Card className="mb-4 mt-4 border-success">
              <CardBody className="bg-success bg-opacity-10">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 text-success">🔧 Incident Handler Dashboard</h4>
                    <p className="text-muted mb-0">
                      Welcome back, <strong>{userInfo.name}</strong>! You are responsible for investigating and resolving incidents.
                    </p>
                  </div>
                  <div>
                    <Button color="success" onClick={handleViewAllIncidents}>
                      View My Assignments
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-success">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-success">{stats.total}</h5>
                      <span className="f-light">My Total Assignments</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col xl={3} md={6} className="box-col-6">
            <Card className="o-hidden border-primary">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter text-primary">{stats.inProgress}</h5>
                      <span className="f-light">Active Tasks</span>
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
                      <h5 className="mb-0 counter text-success">{stats.resolved}</h5>
                      <span className="f-light">Completed Tasks</span>
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
                      <h5 className="mb-0 counter text-warning">{stats.pending}</h5>
                      <span className="f-light">Pending Tasks</span>
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
                <div className="d-flex justify-content-between align-items-center">
                  <h5>🚰 My Assigned Water Pollution Incidents</h5>
                  <Button color="outline-success" size="sm" onClick={handleViewAllIncidents}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {assignedTasks.length === 0 ? (
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
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Incident Details</th>
                          <th scope="col">Priority Level</th>
                          <th scope="col">Reported Date</th>
                          <th scope="col">Current Status</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedTasks.slice(0, 10).map((task, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <div className="fw-medium">{task.title}</div>
                                <small className="text-muted">
                                  {task.incident.number} - {task.incident.category}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                                {task.priority} Priority
                              </span>
                            </td>
                            <td>{task.dueDate}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                {task.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button className="btn btn-sm btn-outline-primary">View</button>
                                <button className="btn btn-sm btn-primary">Work On</button>
                              </div>
                            </td>
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
              <CardHeader className="pb-0">
                <h5>📊 My Task Distribution</h5>
              </CardHeader>
              <CardBody>
                {stats.total > 0 ? (
                  <Chart
                    options={donutChartOptions}
                    series={donutChartSeries}
                    type="donut"
                    height={300}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No data to display</p>
                    <small className="text-muted">No incidents assigned yet</small>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>📈 My Performance Overview</h5>
              </CardHeader>
              <CardBody>
                <Chart
                  options={lineChartOptions}
                  series={lineChartSeries}
                  type="line"
                  height={350}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>🚀 Quick Actions</h5>
              </CardHeader>
              <CardBody>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="success" onClick={handleViewAllIncidents}>
                        📋 View All My Incidents
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="info">
                        📊 Generate My Report
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="warning">
                        🔔 View Notifications
                      </Button>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="d-grid">
                      <Button color="secondary">
                        ⚙️ Update Profile
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

export default IncidentHandlerDashboard
