'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, Button } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
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

import AllIncidents from '../../../../Components/AllIncidents';

const FieldEngineerDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get('view');
  const [currentView, setCurrentView] = useState(viewParam || 'dashboard');

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

        if (!isAuthenticated()) {
          router.replace('/auth/login');
          return;
        }

        const currentUser = getCurrentUser();
        setUser({
          name: currentUser?.name || 'Field Engineer',
          team: currentUser?.team || 'Field Engineer',
          email: currentUser?.email || '',
          userId: currentUser?.id || ''
        });

        // Fetch incidents assigned to this field engineer using unified service
        const userIncidents = await fetchIncidentsByUserRole('field_engineer');

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
    setCurrentView(currentViewParam || 'dashboard');
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

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
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
    return <AllIncidents userType="field_engineer" onBack={handleBackToDashboard} />;
  }

  const handleRefreshData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      const userIncidents = await fetchIncidentsByUserRole('field_engineer');

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
    <Container fluid>
      {/* Welcome Header */}
      <Row>
        <Col xs={12}>
          <Card className="mb-4 mt-4">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">Welcome back, {user.name}!</h4>
                  <small className="text-muted">Field Engineer Dashboard - Site Inspections & Evidence Collection</small>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Simple Statistics Cards - NO CHARTS */}
      <Row>
        <Col xl={3} md={6} className="box-col-6 mt-3">
          <Card className="o-hidden">
            <CardBody className="b-r-4 card-body">
              <div className="media static-top-widget">
                <div className="align-self-center text-center">
                  <div className="d-inline-block">
                    <h5 className="mb-0 counter">{stats.total}</h5>
                    <span className="f-light">Total Assignments</span>
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
                    <h5 className="mb-0 counter">{stats.pending}</h5>
                    <span className="f-light">Pending</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Main Content - ONLY INCIDENTS TABLE */}
      <Row>
        <Col lg={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>My Field Assignments</h5>
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
                  <h6 className="text-muted">No field assignments yet</h6>
                  <p className="text-muted">You don't have any assigned field inspections at the moment. Check back later for new assignments.</p>
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
                        <th scope="col">Location</th>
                        <th scope="col">Date</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Show the most recent incidents (sorted by createdAt descending) */}
                      {dashboardData.myIncidents
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((incident) => (
                        <tr key={incident.id}>
                          <td>
                            <div>
                              <span className="fw-medium text-primary">{incident.number}</span>
                              <div><small className="text-muted">Caller: {incident.caller}</small></div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{incident.category}</div>
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
                          <td>
                            <small className="text-muted">{incident.address || 'Not specified'}</small>
                          </td>
                          <td>{formatDateLocal(incident.createdAt)}</td>
                          <td>
                            <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                              Inspect
                            </Button>
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
      </Row>
    </Container>
  )
}

export default FieldEngineerDashboard
