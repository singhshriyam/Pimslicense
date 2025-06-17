// app/(MainBody)/dashboard/field_engineer/page.tsx - Using backend data only
'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Form, FormGroup, Label, Input, Table, Alert } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
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

import AllIncidents from '../../../../Components/AllIncidents';

interface Evidence {
  id: string;
  type: 'photo' | 'ammonia';
  data: string;
  uploadedAt: string;
}

interface AmmoniaReading {
  id: string;
  type: 'Upstream' | 'Downstream';
  reading: number;
  date: string;
  uploadedAt: string;
}

const FieldEngineerDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const [currentView, setCurrentView] = useState(viewParam || 'dashboard');

  const [dashboardData, setDashboardData] = useState({
    assignedIncidents: [] as Incident[],
    totalAssigned: 0,
    inspected: 0,
    pendingInspection: 0,
    evidenceCollected: 0,
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

  // Form states for evidence collection
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ammoniaForm, setAmmoniaForm] = useState({
    type: 'Upstream' as 'Upstream' | 'Downstream',
    reading: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

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

        // Fetch incidents assigned to this field engineer from backend
        const assignedIncidents = await fetchHandlerIncidents();
        const stats = getIncidentStats(assignedIncidents);

        // Calculate field engineer specific stats from real data
        const inspected = assignedIncidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
        const pendingInspection = assignedIncidents.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
        const evidenceCollected = assignedIncidents.filter(i => i.status !== 'pending').length;

        setDashboardData({
          assignedIncidents,
          totalAssigned: stats.total,
          inspected,
          pendingInspection,
          evidenceCollected,
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

  const handleInspectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab('details');
    loadIncidentEvidence(incident.id);
  };

  const loadIncidentEvidence = async (incidentId: string) => {
    try {
      // TODO: Replace with actual API call to load evidence
      // const evidenceData = await fetchIncidentEvidence(incidentId);
      // const ammoniaData = await fetchIncidentAmmoniaReadings(incidentId);

      // For now, start with empty arrays - data will come from actual uploads
      setEvidences([]);
      setAmmoniaReadings([]);
    } catch (error) {
      console.error('Error loading evidence:', error);
      setEvidences([]);
      setAmmoniaReadings([]);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedIncident) return;

    try {
      setUploadingEvidence(true);

      // TODO: Replace with actual API call to upload photo
      // const uploadResponse = await uploadIncidentPhoto(selectedIncident.id, photoFile);

      // Mock response - replace with actual API response
      const newEvidence: Evidence = {
        id: Date.now().toString(),
        type: 'photo',
        data: URL.createObjectURL(photoFile), // Temporary preview - replace with server URL
        uploadedAt: new Date().toISOString()
      };

      setEvidences(prev => [...prev, newEvidence]);
      setPhotoFile(null);
      setSuccessMessage('Photo uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset file input
      const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      setSuccessMessage('Failed to upload photo: ' + error.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleAmmoniaSubmit = async () => {
    if (!ammoniaForm.reading || !selectedIncident) return;

    try {
      setUploadingEvidence(true);

      // TODO: Replace with actual API call to save ammonia reading
      // const saveResponse = await saveAmmoniaReading({
      //   incidentId: selectedIncident.id,
      //   type: ammoniaForm.type,
      //   reading: parseFloat(ammoniaForm.reading),
      //   date: ammoniaForm.date
      // });

      const newReading: AmmoniaReading = {
        id: Date.now().toString(),
        type: ammoniaForm.type,
        reading: parseFloat(ammoniaForm.reading),
        date: ammoniaForm.date,
        uploadedAt: new Date().toISOString()
      };

      setAmmoniaReadings(prev => [...prev, newReading]);
      setAmmoniaForm({
        type: 'Upstream',
        reading: '',
        date: new Date().toISOString().split('T')[0]
      });
      setSuccessMessage('Ammonia reading recorded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Submit error:', error);
      setSuccessMessage('Failed to save reading: ' + error.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    try {
      // TODO: Replace with actual API call to delete evidence
      // await deleteIncidentEvidence(evidenceId);

      setEvidences(prev => prev.filter(e => e.id !== evidenceId));
      setSuccessMessage('Evidence deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Delete error:', error);
      setSuccessMessage('Failed to delete evidence: ' + error.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDeleteReading = async (readingId: string) => {
    try {
      // TODO: Replace with actual API call to delete reading
      // await deleteAmmoniaReading(readingId);

      setAmmoniaReadings(prev => prev.filter(r => r.id !== readingId));
      setSuccessMessage('Reading deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Delete error:', error);
      setSuccessMessage('Failed to delete reading: ' + error.message);
      setTimeout(() => setSuccessMessage(null), 3000);
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
    return <AllIncidents userType="field_engineer" onBack={handleBackToDashboard} />;
  }

  if (selectedIncident) {
    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="mt-4">
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Incident Inspection - {selectedIncident.number}</h5>
                  <Button color="secondary" size="sm" onClick={() => setSelectedIncident(null)}>
                    ← Back to Dashboard
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {successMessage && (
                  <Alert color={successMessage.includes('Failed') ? 'danger' : 'success'} className="mb-3">
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
                      Evidence Collection
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
                        <div className="mb-3"><strong>Assigned To:</strong> <span className="ms-2">{selectedIncident.assignedTo || 'Unassigned'}</span></div>
                        <div className="mb-3"><strong>Created:</strong> <span className="ms-2">{formatDateLocal(selectedIncident.createdAt)}</span></div>
                      </Col>
                      <Col xs={12}>
                        <hr />
                        <div className="mb-3">
                          <strong>Description:</strong>
                          <p className="mt-2 p-3 bg-light rounded">{selectedIncident.description}</p>
                        </div>
                        {selectedIncident.address && (
                          <div className="mb-3">
                            <strong>Location:</strong>
                            <div className="mt-1 p-2 bg-light rounded">
                              <div>{selectedIncident.address}</div>
                              {selectedIncident.postcode && <div><strong>Postcode:</strong> {selectedIncident.postcode}</div>}
                              {selectedIncident.latitude && selectedIncident.longitude && (
                                <div>
                                  <strong>GPS:</strong> {selectedIncident.latitude.substring(0,8)}, {selectedIncident.longitude.substring(0,8)}
                                  <span className="text-success ms-2">📍 Location Available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </TabPane>

                  {/* Evidence Collection Tab */}
                  <TabPane tabId="evidence">
                    {/* Photo Upload Section */}
                    <h5>Upload Photo Evidence</h5>
                    <Form className="mb-4">
                      <FormGroup>
                        <Label for="photoUpload">Select Photo</Label>
                        <div className="d-flex align-items-center gap-3">
                          <Input
                            type="file"
                            id="photoUpload"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            style={{ maxWidth: '300px' }}
                            disabled={uploadingEvidence}
                          />
                          <Button
                            color="primary"
                            onClick={handlePhotoUpload}
                            disabled={!photoFile || uploadingEvidence}
                          >
                            {uploadingEvidence ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                        </div>
                      </FormGroup>
                    </Form>

                    {/* Photos Table */}
                    <div className="table-responsive mb-4">
                      <Table>
                        <thead>
                          <tr>
                            <th>Id</th>
                            <th>Image</th>
                            <th>Uploaded at</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evidences.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center text-muted">
                                No photos uploaded yet
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
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  />
                                </td>
                                <td>{formatDateLocal(evidence.uploadedAt)}</td>
                                <td>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() => handleDeleteEvidence(evidence.id)}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <hr className="my-4" />

                    {/* Ammonia Reading Section */}
                    <h5>Ammonia Reading</h5>
                    <Form className="mb-4">
                      <Row>
                        <Col md={3}>
                          <FormGroup>
                            <Label for="type">Type</Label>
                            <Input
                              type="select"
                              id="type"
                              value={ammoniaForm.type}
                              onChange={(e) => setAmmoniaForm({...ammoniaForm, type: e.target.value as 'Upstream' | 'Downstream'})}
                              disabled={uploadingEvidence}
                            >
                              <option value="Upstream">Upstream</option>
                              <option value="Downstream">Downstream</option>
                            </Input>
                          </FormGroup>
                        </Col>
                        <Col md={3}>
                          <FormGroup>
                            <Label for="date">Date</Label>
                            <Input
                              type="date"
                              id="date"
                              value={ammoniaForm.date}
                              onChange={(e) => setAmmoniaForm({...ammoniaForm, date: e.target.value})}
                              disabled={uploadingEvidence}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={3}>
                          <FormGroup>
                            <Label for="reading">Reading (mg/L)</Label>
                            <Input
                              type="number"
                              id="reading"
                              placeholder="Enter reading"
                              value={ammoniaForm.reading}
                              onChange={(e) => setAmmoniaForm({...ammoniaForm, reading: e.target.value})}
                              step="0.01"
                              disabled={uploadingEvidence}
                            />
                          </FormGroup>
                        </Col>
                        <Col md={3}>
                          <FormGroup>
                            <Label>&nbsp;</Label>
                            <div>
                              <Button
                                color="primary"
                                onClick={handleAmmoniaSubmit}
                                disabled={!ammoniaForm.reading || uploadingEvidence}
                              >
                                {uploadingEvidence ? 'Saving...' : 'Submit Reading'}
                              </Button>
                            </div>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Form>

                    {/* Ammonia Readings Table */}
                    <div className="table-responsive">
                      <Table>
                        <thead>
                          <tr>
                            <th>Id</th>
                            <th>Type</th>
                            <th>Reading (mg/L)</th>
                            <th>Date</th>
                            <th>Recorded At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ammoniaReadings.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-muted">
                                No readings recorded yet
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
                                <td>{formatDateLocal(reading.uploadedAt)}</td>
                                <td>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() => handleDeleteReading(reading.id)}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
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
                  <h4 className="mb-1">🔬 Field Engineer Dashboard</h4>
                  <p className="mb-0 text-muted">Welcome back, {user.name}! Manage your field inspections and evidence collection.</p>
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
                    <h5 className="mb-0 counter">{dashboardData.totalAssigned}</h5>
                    <span className="f-light">Total Assigned</span>
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
                    <h5 className="mb-0 counter">{dashboardData.inspected}</h5>
                    <span className="f-light">Inspected</span>
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
                    <h5 className="mb-0 counter">{dashboardData.pendingInspection}</h5>
                    <span className="f-light">Pending Inspection</span>
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
                    <h5 className="mb-0 counter">{dashboardData.evidenceCollected}</h5>
                    <span className="f-light">Evidence Collected</span>
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
                <h5>📋 Assigned Incidents for Inspection</h5>
                <div>
                  {dashboardData.totalAssigned > 0 && (
                    <Button color="outline-primary" size="sm" onClick={handleViewAllIncidents}>
                      View All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {dashboardData.assignedIncidents.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <h6 className="text-muted">No incidents assigned for inspection</h6>
                  <p className="text-muted">You don't have any incidents assigned for field inspection at the moment.</p>
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
                        <th>Assigned Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.assignedIncidents.map((incident) => (
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
                            <small>{formatDateLocal(incident.createdAt)}</small>
                          </td>
                          <td>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => handleInspectIncident(incident)}
                            >
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
  );
};

export default FieldEngineerDashboard;
