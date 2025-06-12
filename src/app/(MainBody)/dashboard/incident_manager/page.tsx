'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  clearUserData
} from '../../services/userService';

const IncidentManagerDashboard = () => {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    name: '',
    team: '',
    email: '',
    id: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated using localStorage
    if (isAuthenticated()) {
      const user = getCurrentUser();

      setUserInfo({
        name: user.name || 'Manager',
        team: user.team || 'Incident Manager',
        email: user.email || '',
        id: user.id || ''
      });

      setLoading(false);
    } else {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    }
  }, [router]);

  const handleViewAllIncidents = () => {
    router.push('/dashboard?tab=all-incidents');
  };

  const handleCreateIncident = () => {
    router.push('/dashboard?tab=create-incident');
  };

  const handleLogout = () => {
    clearUserData();
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading Incident Manager dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Welcome Header */}
      <Row>
        <Col xs={12}>
          <Card className="mb-4 mt-4 border-warning">
            <CardBody className="bg-warning bg-opacity-10">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1 text-warning">👨‍💼 Incident Manager Dashboard</h4>
                  <p className="text-muted mb-0">
                    Welcome back, <strong>{userInfo.name}</strong>! You manage team incidents and coordinate responses.
                  </p>
                  <small className="text-muted">
                    Team: {userInfo.team} | Email: {userInfo.email}
                  </small>
                </div>
                <div>
                  <Button color="warning" onClick={handleCreateIncident} className="me-2">
                    Create Incident
                  </Button>
                  <Button color="outline-warning" onClick={handleViewAllIncidents} className="me-2">
                    Manage All
                  </Button>
                  <Button color="outline-danger" size="sm" onClick={handleLogout}>
                    Logout
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
          <Card className="o-hidden border-warning">
            <CardBody className="b-r-4 card-body">
              <div className="media static-top-widget">
                <div className="align-self-center text-center">
                  <div className="d-inline-block">
                    <h5 className="mb-0 counter text-warning">0</h5>
                    <span className="f-light">Total Team Incidents</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="box-col-6 mt-3">
          <Card className="o-hidden border-success">
            <CardBody className="b-r-4 card-body">
              <div className="media static-top-widget">
                <div className="align-self-center text-center">
                  <div className="d-inline-block">
                    <h5 className="mb-0 counter text-success">0</h5>
                    <span className="f-light">Resolved</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="box-col-6 mt-3">
          <Card className="o-hidden border-primary">
            <CardBody className="b-r-4 card-body">
              <div className="media static-top-widget">
                <div className="align-self-center text-center">
                  <div className="d-inline-block">
                    <h5 className="mb-0 counter text-primary">0</h5>
                    <span className="f-light">In Progress</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xl={3} md={6} className="box-col-6 mt-3">
          <Card className="o-hidden border-danger">
            <CardBody className="b-r-4 card-body">
              <div className="media static-top-widget">
                <div className="align-self-center text-center">
                  <div className="d-inline-block">
                    <h5 className="mb-0 counter text-danger">0</h5>
                    <span className="f-light">Pending Assignment</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        <Col lg={12}>
          <Card>
            <CardHeader className="pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5>📋 Recent Team Incidents</h5>
                <Button color="outline-warning" size="sm" onClick={handleViewAllIncidents}>
                  Manage All
                </Button>
              </div>
            </CardHeader>
            <CardBody>
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
                <h6 className="text-muted">Welcome to your Incident Manager Dashboard</h6>
                <p className="text-muted">This is your dedicated incident management workspace for user: <strong>{userInfo.email}</strong></p>
                <Button color="warning" onClick={handleCreateIncident}>
                  Create New Incident
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Management Actions */}
      <Row>
        <Col lg={12}>
          <Card>
            <CardHeader className="pb-0">
              <h5>🎯 Management Actions</h5>
            </CardHeader>
            <CardBody>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="d-grid">
                    <Button color="warning" onClick={handleViewAllIncidents}>
                      📋 Manage All Incidents
                    </Button>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="d-grid">
                    <Button color="success" onClick={handleCreateIncident}>
                      ➕ Create Incident
                    </Button>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="d-grid">
                    <Button color="info" onClick={() => window.location.reload()}>
                      🔄 Refresh Data
                    </Button>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="d-grid">
                    <Button color="secondary">
                      📊 Generate Reports
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* User Info - Simplified for beginners */}
      <Row>
        <Col lg={12}>
          <Card className="border-info">
            <CardHeader className="bg-info bg-opacity-10">
              <h6 className="text-info mb-0">ℹ️ Your Dashboard Info</h6>
            </CardHeader>
            <CardBody>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Name:</strong> {userInfo.name}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Team:</strong> {userInfo.team}</p>
                  <p><strong>Role:</strong> Incident Manager</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default IncidentManagerDashboard
