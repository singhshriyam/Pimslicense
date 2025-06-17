'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Table, Alert, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  getCurrentUser,
  isAuthenticated,
  clearUserData
} from '../../services/userService';

import {
  fetchAllIncidents,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../../services/incidentService';

import AllIncidents from '../../../../Components/AllIncidents';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Evidence {
  id: string;
  incidentId: string;
  type: 'photo' | 'ammonia';
  data: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface AmmoniaReading {
  id: string;
  incidentId: string;
  type: 'Upstream' | 'Downstream';
  reading: number;
  date: string;
  uploadedAt: string;
  uploadedBy: string;
}

const WaterPollutionExpertDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const [currentView, setCurrentView] = useState(viewParam || 'dashboard');

  const [dashboardData, setDashboardData] = useState({
    allIncidents: [] as Incident[],
    totalIncidents: 0,
    needsApproval: 0,
    approved: 0,
    underReview: 0,
    loading: true,
    error: null as string | null
  });

  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [ammoniaReadings, setAmmoniaReadings] = useState<AmmoniaReading[]>([]);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: 'ea@environment-agency.gov.uk',
    subject: '',
    message: '',
    attachEvidence: true
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
          name: currentUser?.name || 'Water Pollution Expert',
          team: currentUser?.team || 'Water Pollution Expert',
          email: currentUser?.email || '',
          userId: currentUser?.id || ''
        });

        // Fetch all incidents for water pollution expert review
        const allIncidents = await fetchAllIncidents();
        const stats = getIncidentStats(allIncidents);

        // Calculate water pollution expert specific stats
        const needsApproval = allIncidents.filter(i => i.status === 'resolved').length;
        const approved = allIncidents.filter(i => i.status === 'closed').length;
        const underReview = allIncidents.filter(i => i.status === 'in_progress').length;

        setDashboardData({
          allIncidents,
          totalIncidents: stats.total,
          needsApproval,
          approved,
          underReview,
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

  const handleViewAllIncidents = () => {
    setCurrentView('all-incidents');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('view', 'all-incidents');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedIncident(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('view');
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleReviewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab('details');
    loadIncidentEvidence(incident.id);
    setEmailForm({
      ...emailForm,
      subject: `EA Approval Required - Incident ${incident.number}`,
      message: `Dear Environment Agency,\n\nWe are requesting approval for the following water pollution incident:\n\nIncident Number: ${incident.number}\nLocation: ${incident.address || 'Not specified'}\nCategory: ${incident.category}\nDescription: ${incident.shortDescription}\n\nPlease find attached evidence and ammonia readings for your review.\n\nBest regards,\n${user.name}\nWater Pollution Expert`
    });
  };

  const loadIncidentEvidence = (incidentId: string) => {
    // Mock function - in real app, fetch from API
    // Simulating some evidence for demonstration
    setEvidences([
      {
        id: '1',
        incidentId,
        type: 'photo',
        data: '/api/placeholder/400/300',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Field Engineer'
      }
    ]);

    setAmmoniaReadings([
      {
        id: '1',
        incidentId,
        type: 'Upstream',
        reading: 2.5,
        date: new Date().toISOString().split('T')[0],
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Field Engineer'
      },
      {
        id: '2',
        incidentId,
        type: 'Downstream',
        reading: 4.8,
        date: new Date().toISOString().split('T')[0],
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Field Engineer'
      }
    ]);
  };

  const handleDownloadEvidence = (evidenceId: string) => {
    // Mock download function - in real app, download from server
    const evidence = evidences.find(e => e.id === evidenceId);
    if (evidence) {
      const link = document.createElement('a');
      link.href = evidence.data;
      link.download = `evidence_${evidenceId}.jpg`;
      link.click();
      setSuccessMessage('Evidence downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDownloadReadings = () => {
    // Create CSV data for ammonia readings
    const csvData = [
      ['ID', 'Type', 'Reading (mg/L)', 'Date', 'Uploaded By', 'Uploaded At'],
      ...ammoniaReadings.map(reading => [
        reading.id,
        reading.type,
        reading.reading.toString(),
        reading.date,
        reading.uploadedBy,
        new Date(reading.uploadedAt).toLocaleString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ammonia_readings_${selectedIncident?.number}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    setSuccessMessage('Ammonia readings downloaded successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSendEmailToEA = async () => {
    try {
      // Mock email sending - in real app, call email API
      console.log('Sending email to EA:', emailForm);

      setShowEmailModal(false);
      setSuccessMessage('Email sent to Environment Agency successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);

      // Reset form
      setEmailForm({
        to: 'ea@environment-agency.gov.uk',
        subject: '',
        message: '',
        attachEvidence: true
      });
    } catch (error) {
      console.error('Email sending error:', error);
    }
  };

  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  // Render different views
  if (currentView === 'all-incidents') {
    return <AllIncidents userType="water_pollution_expert" onBack={handleBackToDashboard} />;
  }

  if (selectedIncident) {
    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="mt-4">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">🔬 Incident Review - {selectedIncident.number}</h5>
                  <div>
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => setShowEmailModal(true)}
                      className="me-2"
                    >
                      📧 Email to EA
                    </Button>
                    <Button color="secondary" size="sm" onClick={() => setSelectedIncident(null)}>
                      ← Back to Dashboard
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {successMessage && (
                  <Alert color="success" className="mb-3">
                    {successMessage}
                  </Alert>
                )}

                {/* Navigation Tabs */}
                <Nav tabs className="mb-4">
                  <NavItem>
                    <NavLink
                      className={activeTab === 'details' ? 'active' : ''}
                      onClick={() => setActiveTab('details')}
                      style={{ cursor: 'pointer' }}
                    >
                      Incident Details
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === 'evidence' ? 'active' : ''}
                      onClick={() => setActiveTab('evidence')}
                      style={{ cursor: 'pointer' }}
                    >
                      Evidence Review
                    </NavLink>
                  </NavItem>
                </Nav>

                <TabContent activeTab={activeTab}>
                  {/* Incident Details Tab */}
                  <TabPane tabId="details">
                    <Row>
                      <Col md={6}>
                        <div className="mb-3"><strong>Incident Number:</strong> <span className="ms-2 text-primary fw-medium">{selectedIncident.number}</span></div>
                        <div className="mb-3"><strong>Category:</strong> <span className="ms-2">{selectedIncident.category}</span></div>
                        <div className="mb-3"><strong>Sub Category:</strong> <span className="ms-2">{selectedIncident.subCategory}</span></div>
                        <div className="mb-3"><strong>Caller:</strong> <span className="ms-2">{selectedIncident.caller}</span></div>
                        <div className="mb-3"><strong>Reported By:</strong> <span className="ms-2">{selectedIncident.reportedByName}</span></div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Priority:</strong>
                          <Badge className="ms-2" style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }}>
                            {selectedIncident.priority}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <strong>Status:</strong>
                          <Badge className="ms-2" style={{ backgroundColor: getStatusColor(selectedIncident.status || 'pending'), color: 'white' }}>
                            {(selectedIncident.status || 'pending').replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="mb-3"><strong>Impact:</strong> <span className="ms-2">{selectedIncident.impact || 'Not specified'}</span></div>
                        <div className="mb-3"><strong>Assigned To:</strong> <span className="ms-2">{selectedIncident.assignedTo || 'Unassigned'}</span></div>
                        <div className="mb-3"><strong>Created:</strong> <span className="ms-2">{formatDateLocal(selectedIncident.createdAt)}</span></div>
                      </Col>
                      <Col xs={12}>
                        <hr />
                        <div className="mb-3">
                          <strong>Description:</strong>
                          <p className="mt-2 p-3 bg-light rounded">{selectedIncident.description}</p>
                        </div>
                        {(selectedIncident.address || selectedIncident.postcode || (selectedIncident.latitude && selectedIncident.longitude)) && (
                          <div className="mb-3">
                            <strong>Location Information:</strong>
                            <div className="mt-1 p-3 bg-light rounded">
                              {selectedIncident.address && <div><strong>Address:</strong> {selectedIncident.address}</div>}
                              {selectedIncident.postcode && <div><strong>Postcode:</strong> {selectedIncident.postcode}</div>}
                              {selectedIncident.latitude && selectedIncident.longitude && (
                                <div>
                                  <strong>GPS Coordinates:</strong> {selectedIncident.latitude.substring(0,8)}, {selectedIncident.longitude.substring(0,8)}
                                  <span className="text-success ms-2">📍 Precise Location Available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Evidence Review Tab */}
                  <TabPane tabId="evidence">
                    {/* Photo Evidence Section */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>📷 Photo Evidence</h5>
                      <Button color="outline-primary" size="sm" onClick={() => handleDownloadEvidence('all')}>
                        Download All Photos
                      </Button>
                    </div>

                    <div className="table-responsive mb-4">
                      <Table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Preview</th>
                            <th>Uploaded By</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evidences.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted">
                                No photo evidence available
                              </td>
                            </tr>
                          ) : (
                            evidences.map((evidence) => (
                              <tr key={evidence.id}>
                                <td>{evidence.id}</td>
                                <td>
                                  <img
                                    src={evidence.data}
                                    alt="Evidence"
                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                    className="rounded"
                                  />
                                </td>
                                <td>{evidence.uploadedBy}</td>
                                <td>{formatDateLocal(evidence.uploadedAt)}</td>
                                <td>
                                  <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => handleDownloadEvidence(evidence.id)}
                                  >
                                    Download
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <hr className="my-4" />

                    {/* Ammonia Readings Section */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>🧪 Ammonia Readings</h5>
                      <Button color="outline-success" size="sm" onClick={handleDownloadReadings}>
                        📊 Download CSV
                      </Button>
                    </div>

                    <div className="table-responsive">
                      <Table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Reading (mg/L)</th>
                            <th>Sample Date</th>
                            <th>Recorded By</th>
                            <th>Upload Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ammoniaReadings.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-muted">
                                No ammonia readings available
                              </td>
                            </tr>
                          ) : (
                            ammoniaReadings.map((reading) => (
                              <tr key={reading.id}>
                                <td>{reading.id}</td>
                                <td>
                                  <Badge color={reading.type === 'Upstream' ? 'info' : 'warning'}>
                                    {reading.type}
                                  </Badge>
                                </td>
                                <td>
                                  <span className={reading.reading > 3.0 ? 'text-danger fw-bold' : 'text-success'}>
                                    {reading.reading}
                                  </span>
                                  {reading.reading > 3.0 && (
                                    <small className="text-danger d-block">⚠️ Above normal</small>
                                  )}
                                </td>
                                <td>{reading.date}</td>
                                <td>{reading.uploadedBy}</td>
                                <td>{formatDateLocal(reading.uploadedAt)}</td>
                                <td>
                                  <Badge color={reading.reading > 3.0 ? 'danger' : 'success'}>
                                    {reading.reading > 3.0 ? 'Requires Action' : 'Normal'}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>

                    {/* Analysis Summary */}
                    {ammoniaReadings.length > 0 && (
                      <div className="mt-4 p-3 bg-light rounded">
                        <h6>📊 Analysis Summary</h6>
                        <Row>
                          <Col md={6}>
                            <div><strong>Total Readings:</strong> {ammoniaReadings.length}</div>
                            <div><strong>Upstream Readings:</strong> {ammoniaReadings.filter(r => r.type === 'Upstream').length}</div>
                            <div><strong>Downstream Readings:</strong> {ammoniaReadings.filter(r => r.type === 'Downstream').length}</div>
                          </Col>
                          <Col md={6}>
                            <div><strong>Average Reading:</strong> {(ammoniaReadings.reduce((sum, r) => sum + r.reading, 0) / ammoniaReadings.length).toFixed(2)} mg/L</div>
                            <div><strong>Highest Reading:</strong> {Math.max(...ammoniaReadings.map(r => r.reading))} mg/L</div>
                            <div>
                              <strong>Status:</strong>
                              <Badge className="ms-2" color={ammoniaReadings.some(r => r.reading > 3.0) ? 'danger' : 'success'}>
                                {ammoniaReadings.some(r => r.reading > 3.0) ? 'EA Approval Required' : 'Within Normal Limits'}
                              </Badge>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </TabPane>
                </TabContent>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Email to EA Modal */}
        <Modal isOpen={showEmailModal} toggle={() => setShowEmailModal(false)} size="lg">
          <ModalHeader toggle={() => setShowEmailModal(false)}>
            📧 Send Email to Environment Agency
          </ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup>
                <Label for="emailTo">To:</Label>
                <Input
                  type="email"
                  id="emailTo"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                />
              </FormGroup>
              <FormGroup>
                <Label for="emailSubject">Subject:</Label>
                <Input
                  type="text"
                  id="emailSubject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                />
              </FormGroup>
              <FormGroup>
                <Label for="emailMessage">Message:</Label>
                <Input
                  type="textarea"
                  id="emailMessage"
                  rows={8}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                />
              </FormGroup>
              <FormGroup check>
                <Input
                  type="checkbox"
                  id="attachEvidence"
                  checked={emailForm.attachEvidence}
                  onChange={(e) => setEmailForm({...emailForm, attachEvidence: e.target.checked})}
                />
                <Label check for="attachEvidence">
                  Attach evidence and ammonia readings
                </Label>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleSendEmailToEA}>
              📤 Send Email
            </Button>
            <Button color="secondary" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    );
  }

  if (dashboardData.loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
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
                  <h4 className="mb-1">🧪 Water Pollution Expert Dashboard</h4>
                  <p className="mb-0 text-muted">Welcome back, {user.name}! Review incidents and coordinate with Environment Agency.</p>
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
                    <span className="f-light">Total Incidents</span>
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
                    <h5 className="mb-0 counter">{dashboardData.needsApproval}</h5>
                    <span className="f-light">Needs EA Approval</span>
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
                    <h5 className="mb-0 counter">{dashboardData.underReview}</h5>
                    <span className="f-light">Under Review</span>
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
                    <h5 className="mb-0 counter">{dashboardData.approved}</h5>
                    <span className="f-light">Approved</span>
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
                <h5>🔬 Incidents for Expert Review</h5>
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
              {dashboardData.allIncidents.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <h6 className="text-muted">No incidents available for review</h6>
                  <p className="text-muted">There are currently no water pollution incidents requiring expert review.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Incident</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Assigned To</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.allIncidents.slice(0, 10).map((incident) => (
                        <tr key={incident.id}>
                          <td>
                            <div>
                              <span className="fw-medium text-primary">{incident.number}</span>
                              <div className="small text-muted">{incident.shortDescription}</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{incident.category}</div>
                              <small className="text-muted">{incident.subCategory}</small>
                            </div>
                          </td>
                          <td>
                            <Badge style={{ backgroundColor: getPriorityColor(incident.priority), color: 'white' }}>
                              {incident.priority}
                            </Badge>
                          </td>
                          <td>
                            <Badge style={{ backgroundColor: getStatusColor(incident.status || 'pending'), color: 'white' }}>
                              {(incident.status || 'pending').replace('_', ' ')}
                            </Badge>
                          </td>
                          <td>
                            <div>
                              <span className="text-muted">{incident.address || 'Not specified'}</span>
                              {incident.postcode && (
                                <div className="small text-muted">{incident.postcode}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">{incident.assignedTo || 'Unassigned'}</small>
                          </td>
                          <td>
                            <small>{formatDateLocal(incident.createdAt)}</small>
                          </td>
                          <td>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => handleReviewIncident(incident)}
                            >
                              Review
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
  );
};

export default WaterPollutionExpertDashboard;
