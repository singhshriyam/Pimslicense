'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Form, FormGroup, Label, Input, Table } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  getCurrentUser,
  isAuthenticated,
  clearUserData
} from '../../services/userService';

import {
  fetchHandlerIncidents,
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
  const [currentView, setCurrentView] = useState(viewParam || 'dashboard');

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

  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState('edit');

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
        const userIncidents = await fetchHandlerIncidents();
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

    fetchData();
  }, [router]);

  useEffect(() => {
    const currentViewParam = searchParams.get('view');
    setCurrentView(currentViewParam || 'dashboard');
  }, [searchParams]);

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
    setEditingIncident(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleEditIncident = (incident: Incident) => {
    setEditingIncident(incident);
    setActiveTab('edit');
  };

  const handleCloseEdit = () => {
    setEditingIncident(null);
    setActiveTab('edit');
  };

  const handleUpdateIncident = () => {
    // Handle incident update logic here
    console.log('Updating incident:', editingIncident);
    // make an API call here to update the incident
    setEditingIncident(null);
  };

  // Format date for display
  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const [photos, setPhotos] = useState([
    // Sample starting data
    { id: 1, url: "https://via.placeholder.com/100", uploadedAt: "2024-01-01" },
  ]);

  const handleMockPhotoUpload = () => {
    const newPhoto = {
      id: Date.now(),
      url: "https://via.placeholder.com/100", // Placeholder
      uploadedAt: new Date().toISOString().split("T")[0],
    };
    setPhotos((prev) => [...prev, newPhoto]);
  };

  const handleMockPhotoDelete = (id: number) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };


  // Render different views based on current view
  if (currentView === 'all-incidents') {
    return <AllIncidents userType="handler" onBack={handleBackToDashboard} />;
  }

  if (currentView === 'assign-incidents') {
    return <AssignIncidents userType="handler" onBack={handleBackToDashboard} />;
  }

  // If editing an incident, show the edit modal
  if (editingIncident) {
    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="mt-4">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Edit Incident</h5>
                  <Button color="secondary" size="sm" onClick={handleCloseEdit}>
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {/* Navigation Tabs */}
                <Nav tabs className="mb-4">
                  <NavItem>
                    <NavLink
                      className={activeTab === 'edit' ? 'active' : ''}
                      onClick={() => setActiveTab('edit')}
                      style={{ cursor: 'pointer' }}
                    >
                      Incident detail
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === 'evidence' ? 'active' : ''}
                      onClick={() => setActiveTab('evidence')}
                      style={{ cursor: 'pointer' }}
                    >
                      Evidence
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === 'action' ? 'active' : ''}
                      onClick={() => setActiveTab('action')}
                      style={{ cursor: 'pointer' }}
                    >
                      Action
                    </NavLink>
                  </NavItem>
                </Nav>

                {/* Tab Content */}
                <TabContent activeTab={activeTab}>
                  {/* Edit Tab */}
                  <TabPane tabId="edit">
                    <h5>Edit Incident</h5>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="incidentNo">Incident No</Label>
                            <Input
                              type="text"
                              id="incidentNo"
                              value={editingIncident.number}
                              disabled
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="contactType">Contact Type</Label>
                            <Input
                              type="select"
                              id="contactType"
                              defaultValue="SelfService"
                            >
                              <option value="SelfService">SelfService</option>
                              <option value="Phone">Phone</option>
                              <option value="Email">Email</option>
                              <option value="Walk-in">Walk-in</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="category">Category</Label>
                            <Input
                              type="select"
                              id="category"
                              defaultValue={editingIncident.category}
                            >
                              <option value="">Select Category</option>
                              <option value="Hardware">Hardware</option>
                              <option value="Software">Software</option>
                              <option value="Network">Network</option>
                              <option value="Security">Security</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="subCategory">Sub Category</Label>
                            <Input
                              type="select"
                              id="subCategory"
                              defaultValue={editingIncident.subCategory}
                            >
                              <option value="">Select Sub Category</option>
                              <option value="Desktop">Desktop</option>
                              <option value="Laptop">Laptop</option>
                              <option value="Server">Server</option>
                              <option value="Printer">Printer</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="shortDescription">Short Description</Label>
                            <Input
                              type="textarea"
                              id="shortDescription"
                              rows="3"
                              defaultValue={editingIncident.shortDescription}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="description">Description</Label>
                            <Input
                              type="textarea"
                              id="description"
                              rows="3"
                              defaultValue={editingIncident.description}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="site">Site <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              id="site"
                              required
                            >
                              <option value="">Select Site</option>
                              <option value="Main Office">Main Office</option>
                              <option value="Branch 1">Branch 1</option>
                              <option value="Branch 2">Branch 2</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="asset">Asset <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              id="asset"
                              required
                            >
                              <option value="">Select Asset</option>
                              <option value="Computer">Computer</option>
                              <option value="Server">Server</option>
                              <option value="Network Device">Network Device</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="impact">Impact <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              id="impact"
                              required
                            >
                              <option value="">Select Impact</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="urgency">Urgency <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              id="urgency"
                              defaultValue={editingIncident.priority}
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="incidentState">Incident State <span className="text-danger">*</span></Label>
                            <Input
                              type="select"
                              id="incidentState"
                              defaultValue={editingIncident.status}
                            >
                              <option value="New">New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="narration">Narration <span className="text-danger">*</span></Label>
                            <Input
                              type="textarea"
                              id="narration"
                              rows="4"
                              placeholder="Add your narration here..."
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <div className="text-end">
                        <Button color="primary" onClick={handleUpdateIncident}>
                          Update Incident
                        </Button>
                      </div>
                    </Form>
                  </TabPane>

                  {/* Evidence Tab */}
                  <TabPane tabId="evidence">
                    <h5>Upload Photo</h5>
                    <Form className="mb-4">
                      <FormGroup>
                        <Label for="photoUpload">Select Photo</Label>
                        <div className="d-flex align-items-center gap-3">
                          <Input
                            type="file"
                            id="photoUpload"
                            accept="image/*"
                            style={{ maxWidth: '300px' }}
                          />
                          <Button color="primary">Upload Photo</Button>
                        </div>
                      </FormGroup>
                    </Form>

                    <div className="table-responsive">
                      <Table>
                        <thead>
                          <tr>
                            <th>Id</th>
                            <th>Image</th>
                            <th>Uploaded at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {photos.length > 0 ? (
                            photos.map((photo) => (
                              <tr key={photo.id}>
                                <td>{photo.id}</td>
                                <td><img src={photo.url} alt="Uploaded" width="80" /></td>
                                <td>{photo.uploadedAt}</td>
                                <td>
                                  <Button color="danger" size="sm" onClick={() => handleMockPhotoDelete(photo.id)}>
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center text-muted">
                                No photos uploaded yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <hr className="my-4" />

                    <h5>Ammonia Reading</h5>
                    <Form className="mb-4">
                      <Row>
                        <Col md={4}>
                          <FormGroup>
                            <Label for="type">Type</Label>
                            <Input
                              type="select"
                              id="type"
                              defaultValue="Upstream"
                            >
                              <option value="Upstream">Upstream</option>
                              <option value="Downstream">Downstream</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup>
                            <Label for="date">Date</Label>
                            <Input
                              type="date"
                              id="date"
                              placeholder="dd.mm.yyyy"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup>
                            <Label for="reading">Reading</Label>
                            <div className="d-flex align-items-center gap-2">
                              <Input
                                type="number"
                                id="reading"
                                placeholder="Enter reading"
                              />
                              <Button color="primary">Submit</Button>
                            </div>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Form>

                    <div className="table-responsive">
                      <Table>
                        <thead>
                          <tr>
                            <th>Id</th>
                            <th>Type</th>
                            <th>Reading</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={4} className="text-center text-muted">
                              No readings recorded yet
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>

                  {/* Action Tab */}
                  <TabPane tabId="action">
                    <h5>Action</h5>
                    <Form className="mb-4">
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="actionType">Action Type</Label>
                            <Input
                              type="select"
                              id="actionType"
                            >
                              <option value="">Select Action Type</option>
                              <option value="Investigation">Investigation</option>
                              <option value="Resolution">Resolution</option>
                              <option value="Follow-up">Follow-up</option>
                              <option value="Escalation">Escalation</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="actionStatus">Action Status</Label>
                            <Input
                              type="select"
                              id="actionStatus"
                            >
                              <option value="">Select Action Status</option>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </Input>
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="priority">Priority</Label>
                            <Input
                              type="select"
                              id="priority"
                            >
                              <option value="">Select Priority</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="raisedOn">Raised On</Label>
                            <Input
                              type="date"
                              id="raisedOn"
                              placeholder="dd.mm.yyyy"
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="details">Details</Label>
                            <Input
                              type="textarea"
                              id="details"
                              rows="4"
                              placeholder="Enter action details..."
                            />
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label>
                              <Input
                                type="checkbox"
                                className="me-2"
                              />
                              Is Complete
                            </Label>
                          </FormGroup>
                        </Col>
                      </Row>

                      <div className="text-end">
                        <Button color="primary">Submit</Button>
                      </div>
                    </Form>

                    <hr className="my-4" />

                    <h5>Actions</h5>
                    <div className="table-responsive">
                      <Table>
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Raised</th>
                            <th>Complete</th>
                            <th>Age</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Detail</th>
                            <th>Status</th>
                            <th>Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={9} className="text-center text-muted">
                              No actions recorded yet
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

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
      height: 350
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
    }]
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
      const userIncidents = await fetchHandlerIncidents();
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

        {/* Statistics Cards - ORIGINAL STYLE */}
        <Row>
          <Col xl={3} md={6} className="box-col-6 mt-3">
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{dashboardData.totalIncidents}</h5>
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
                      <h5 className="mb-0 counter">{dashboardData.solvedIncidents}</h5>
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
                  <h5>My Assigned Incidents</h5>
                  <div>
                    {dashboardData.totalIncidents > 0 && (
                      <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                        View All
                      </Button>
                    )}
                  </div>
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
                          <th scope="col">Status</th>
                          <th scope="col">Assigned</th>
                          <th scope="col">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.myIncidents.slice(0, 4).map((incident) => (
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
                                style={{ backgroundColor: getStatusColor(incident.status || 'pending'), color: 'white' }}
                              >
                                {(incident.status || 'pending').replace('_', ' ')}
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
                <h5>Task Overview</h5>
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
                    <small className="text-muted">No incidents assigned yet</small>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Monthly Trends - ORIGINAL STYLE */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="pb-0">
                <h5>My Monthly Performance Trends</h5>
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
