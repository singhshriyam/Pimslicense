'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, TabContent, TabPane, Form, FormGroup, Label, Table } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  getUserDashboard
} from '../app/(MainBody)/services/userService';

import {
  fetchEndUserIncidents,
  fetchHandlerIncidents,
  fetchAllIncidents,
  fetchIncidentsByUserRole,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../app/(MainBody)/services/incidentService';

interface AllIncidentsProps {
  userType?: 'enduser' | 'handler' | 'admin' | 'manager';
  onBack?: () => void;
}

const AllIncidents: React.FC<AllIncidentsProps> = ({ userType, onBack }) => {
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  // Basic edit form for end users
  const [editForm, setEditForm] = useState({
    shortDescription: '',
    description: ''
  });

  // Advanced edit form for handlers/managers/admins
  const [advancedEditForm, setAdvancedEditForm] = useState({
    shortDescription: '',
    description: '',
    category: '',
    subCategory: '',
    contactType: '',
    impact: '',
    urgency: '',
    status: '',
    narration: ''
  });

  // Tab state for advanced editing
  const [activeTab, setActiveTab] = useState('edit');

  // Category and subcategory mapping (same as creation form)
  const categoryOptions = [
    { id: '1', name: 'Inside home' },
    { id: '2', name: 'Street Pavement' },
    { id: '3', name: 'SP site' },
    { id: '4', name: 'Outside drive way /garden' },
    { id: '5', name: 'River strem or lake' }
  ];

  const subcategoryOptions: Record<string, Array<{id: string, name: string}>> = {
    '1': [ // Inside home
      { id: '1', name: 'Leak from my pipe' },
      { id: '2', name: 'Toilet/sink /shower issues' },
      { id: '3', name: 'Sewage spillout' },
      { id: '4', name: 'Cover or lid is damaged' },
      { id: '5', name: 'Sewage smell in my home' },
      { id: '6', name: 'Blocked alarm' }
    ],
    '2': [ // Street Pavement
      { id: '7', name: 'Manhole blocked /smelly' },
      { id: '8', name: 'Cover or lid is damaged' },
      { id: '9', name: 'Smelly sewage over flowing on the street' },
      { id: '10', name: 'Roadside drain or gully that is blocked' }
    ],
    '3': [ // SP site
      { id: '11', name: 'Mark the site in the map or list of SP sites' }
    ],
    '4': [ // Outside drive way /garden
      { id: '12', name: 'Leak on my property outside' },
      { id: '13', name: 'Blocked /smelly manhole on my property' },
      { id: '14', name: 'Sewage overflow on my property' },
      { id: '15', name: 'Blocked drain on my property' },
      { id: '16', name: 'Sewage odour outside my home' }
    ],
    '5': [ // River stream or lake
      // Add subcategories if available
    ]
  };

  // Helper functions to get category/subcategory by name
  const getCategoryIdByName = (name: string) => {
    const category = categoryOptions.find(cat => cat.name === name);
    return category?.id || '';
  };

  const getSubCategoryOptions = (categoryName: string) => {
    const categoryId = getCategoryIdByName(categoryName);
    if (!categoryId || !subcategoryOptions[categoryId]) {
      return [];
    }
    return subcategoryOptions[categoryId];
  };

  // Check if user has advanced edit permissions
  const hasAdvancedEditPermissions = () => {
    const userTeam = user?.team?.toLowerCase() || '';
    const currentUserType = userType?.toLowerCase() || '';

    return userTeam.includes('handler') ||
           userTeam.includes('manager') ||
           userTeam.includes('admin') ||
           currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin');
  };

  // Fetch incidents based on user type
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }

      setUser(currentUser);

      console.log('🔍 AllIncidents: Fetching data...');
      console.log('👤 User Type (prop):', userType);
      console.log('👤 User Team:', currentUser?.team);

      const actualUserType = userType || currentUser?.team?.toLowerCase() || 'enduser';
      let fetchedIncidents: Incident[] = [];

      // Admin and Manager see ALL incidents - same logic
      if (actualUserType.includes('admin') || actualUserType.includes('manager')) {
        console.log('📊 Fetching ALL incidents for admin/manager...');
        fetchedIncidents = await fetchAllIncidents();
      }
      // Handler sees handler incidents
      else if (actualUserType.includes('handler')) {
        console.log('📊 Fetching handler incidents...');
        fetchedIncidents = await fetchHandlerIncidents();
      }
      // End user sees their own incidents
      else {
        console.log('📊 Fetching end user incidents...');
        fetchedIncidents = await fetchEndUserIncidents();
      }

      console.log('✅ AllIncidents: Received', fetchedIncidents.length, 'incidents');

      setIncidents(fetchedIncidents);
      setFilteredIncidents(fetchedIncidents);
      setCurrentPage(1);

    } catch (error: any) {
      console.error('❌ Fetch incidents error:', error);
      setError(error.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
    fetchData();
  }, [router, userType]);

  // Filter incidents
  useEffect(() => {
    let filtered = [...incidents];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident =>
        incident.shortDescription?.toLowerCase().includes(term) ||
        incident.number?.toLowerCase().includes(term) ||
        incident.category?.toLowerCase().includes(term) ||
        incident.caller?.toLowerCase().includes(term)
      );
    }

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    } else {
      const dashboardRoute = getUserDashboard(user?.team || 'user');
      router.push(dashboardRoute);
    }
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setEditingIncident(incident);
    setActiveTab('edit'); // Reset to first tab

    if (hasAdvancedEditPermissions()) {
      // Advanced edit form for handlers/managers/admins
      setAdvancedEditForm({
        shortDescription: incident.shortDescription || '',
        description: incident.description || '',
        category: incident.category || '',
        subCategory: incident.subCategory || '',
        contactType: incident.contactType || '',
        impact: incident.impact || '',
        urgency: incident.priority || incident.urgency || '',
        status: incident.status || '',
        narration: ''
      });
    } else {
      // Basic edit form for end users
      setEditForm({
        shortDescription: incident.shortDescription || '',
        description: incident.description || ''
      });
    }

    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingIncident) return;

      let updatedIncident: Incident;

      if (hasAdvancedEditPermissions()) {
        // Update with advanced form data
        updatedIncident = {
          ...editingIncident,
          shortDescription: advancedEditForm.shortDescription,
          description: advancedEditForm.description,
          category: advancedEditForm.category,
          subCategory: advancedEditForm.subCategory,
          impact: advancedEditForm.impact,
          priority: advancedEditForm.urgency,
          status: advancedEditForm.status as any // Type assertion for status
        };
      } else {
        // Update with basic form data
        updatedIncident = {
          ...editingIncident,
          shortDescription: editForm.shortDescription,
          description: editForm.description
        };
      }

      // Update local state (in real app, call API)
      const updatedIncidents = incidents.map(incident =>
        incident.id === editingIncident.id ? updatedIncident : incident
      );

      setIncidents(updatedIncidents);
      setShowEditModal(false);
      setEditingIncident(null);
      alert('Incident updated successfully!');

    } catch (error: any) {
      console.error('Error updating incident:', error);
      alert('Failed to update incident: ' + error.message);
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const stats = getIncidentStats(filteredIncidents);

  // Check if user has elevated permissions (handler, manager, admin)
  const hasElevatedPermissions = () => {
    const userTeam = user?.team?.toLowerCase() || '';
    const currentUserType = userType?.toLowerCase() || '';

    return userTeam.includes('handler') ||
           userTeam.includes('manager') ||
           userTeam.includes('admin') ||
           currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin');
  };

  const isHandler = hasElevatedPermissions();

  // Pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    if (currentPage > 1) {
      buttons.push(
        <Button key="prev" color="outline-primary" size="sm" onClick={() => handlePageChange(currentPage - 1)} className="me-1">‹</Button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button key={i} color={i === currentPage ? "primary" : "outline-primary"} size="sm" onClick={() => handlePageChange(i)} className="me-1">
          {i}
        </Button>
      );
    }

    if (currentPage < totalPages) {
      buttons.push(
        <Button key="next" color="outline-primary" size="sm" onClick={() => handlePageChange(currentPage + 1)} className="me-1">›</Button>
      );
    }

    return buttons;
  };

  // Render basic edit modal for end users
  const renderBasicEditModal = () => (
    <Modal isOpen={showEditModal} toggle={() => setShowEditModal(false)} size="lg">
      <ModalHeader toggle={() => setShowEditModal(false)}>
        Edit Incident - {editingIncident?.number}
      </ModalHeader>
      <ModalBody>
        <div>
          <div className="mb-3">
            <label className="form-label"><strong>Title/Short Description:</strong></label>
            <Input
              type="text"
              value={editForm.shortDescription}
              onChange={(e) => setEditForm({...editForm, shortDescription: e.target.value})}
              placeholder="Enter short description"
            />
          </div>
          <div className="mb-3">
            <label className="form-label"><strong>Detailed Description:</strong></label>
            <Input
              type="textarea"
              rows={6}
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              placeholder="Enter detailed description"
            />
          </div>
          <div className="mb-3 p-3 bg-light rounded">
            <small className="text-muted">
              <strong>Note:</strong> You can only edit the title and description of this incident.
              Other fields like status, priority, and assignment are managed by the support team.
            </small>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSaveEdit}>Save Changes</Button>
        <Button color="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  // Render advanced edit modal for handlers/managers/admins
  const renderAdvancedEditModal = () => (
    <Modal isOpen={showEditModal} toggle={() => setShowEditModal(false)} size="xl">
      <ModalHeader toggle={() => setShowEditModal(false)}>
        Edit Incident - {editingIncident?.number}
      </ModalHeader>
      <ModalBody>
        {/* Navigation Tabs */}
        <Nav tabs className="mb-4">
          <NavItem>
            <NavLink
              className={activeTab === 'edit' ? 'active' : ''}
              onClick={() => setActiveTab('edit')}
              style={{ cursor: 'pointer' }}
            >
              Edit
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
                      value={editingIncident?.number}
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
                      value={advancedEditForm.contactType}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, contactType: e.target.value})}
                    >
                      <option value="">Select Contact Type</option>
                      <option value="SelfService">SelfService</option>
                      <option value="Phone">Phone</option>
                      <option value="Email">Email</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Walking">Walking</option>
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
                      value={advancedEditForm.category}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        setAdvancedEditForm({
                          ...advancedEditForm,
                          category: newCategory,
                          subCategory: '' // Reset subcategory when category changes
                        });
                      }}
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="subCategory">Sub Category</Label>
                    <Input
                      type="select"
                      id="subCategory"
                      value={advancedEditForm.subCategory}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, subCategory: e.target.value})}
                      disabled={!advancedEditForm.category}
                    >
                      <option value="">Select Sub Category</option>
                      {getSubCategoryOptions(advancedEditForm.category).map(subCat => (
                        <option key={subCat.id} value={subCat.name}>{subCat.name}</option>
                      ))}
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
                      value={advancedEditForm.shortDescription}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, shortDescription: e.target.value})}
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
                      value={advancedEditForm.description}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, description: e.target.value})}
                    />
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
                      value={advancedEditForm.impact}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, impact: e.target.value})}
                      required
                    >
                      <option value="">Select Impact</option>
                      <option value="Significant">Significant</option>
                      <option value="Moderate">Moderate</option>
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
                      value={advancedEditForm.urgency}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, urgency: e.target.value})}
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
                      value={advancedEditForm.status}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, status: e.target.value})}
                    >
                      <option value="pending">New</option>
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
                      value={advancedEditForm.narration}
                      onChange={(e) => setAdvancedEditForm({...advancedEditForm, narration: e.target.value})}
                      placeholder="Add your narration here..."
                    />
                  </FormGroup>
                </Col>
              </Row>
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
                  <tr>
                    <td colSpan={3} className="text-center text-muted">
                      No photos uploaded yet
                    </td>
                  </tr>
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
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSaveEdit}>Update Incident</Button>
        <Button color="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading incidents...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {error}
          <Button color="link" onClick={fetchData} className="p-0 ms-2">Try again</Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container fluid>
        {/* Header */}
        <Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">All Incidents</h4>
                    <small className="text-muted">
                      View and track all reported incidents ({filteredIncidents.length} total)
                    </small>
                  </div>
                  <div>
                    <Button color="secondary" size="sm" onClick={handleBackToDashboard}>← Back to Dashboard</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Filter Incidents</h5>
                  <Button color="outline-primary" size="sm" onClick={fetchData}>🔄 Refresh</Button>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={6}>
                    <label>Search</label>
                    <Input
                      type="text"
                      placeholder="Search by number, caller, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <label>Status</label>
                    <Input type="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Input>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Incidents Table */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>
                    {isHandler ? 'All System Incidents' : 'My Incidents'} ({filteredIncidents.length})
                  </h5>
                  <div>
                    <small className="text-muted">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length}
                    </small>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No incidents found matching your criteria.</p>
                    <Button color="primary" onClick={fetchData}>Refresh Data</Button>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Incident</th>
                            <th>Category</th>
                            <th>Caller</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assigned</th>
                            <th>Location</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentIncidents.map((incident) => (
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
                                <div>
                                  <div className="fw-medium">{incident.caller}</div>
                                  <small className="text-muted">{incident.reportedBy}</small>
                                </div>
                              </td>
                              <td>
                                <Badge style={{ backgroundColor: getStatusColor(incident.status || 'pending'), color: 'white' }}>
                                  {(incident.status || 'pending').replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{ backgroundColor: getPriorityColor(incident.priority), color: 'white' }}>
                                  {incident.priority || 'Medium'}
                                </Badge>
                              </td>
                              <td>
                                <small className="text-muted">{incident.assignedTo || 'Unassigned'}</small>
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
                                <small>{formatDateOnly(incident.createdAt)}</small>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button color="outline-info" size="sm" onClick={() => handleViewIncident(incident)}>View</Button>
                                  <Button color="outline-warning" size="sm" onClick={() => handleEditIncident(incident)}>Edit</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <small className="text-muted">Page {currentPage} of {totalPages}</small>
                        </div>
                        <div>{renderPaginationButtons()}</div>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* View Modal */}
      <Modal isOpen={showViewModal} toggle={() => setShowViewModal(false)} size="lg">
        <ModalHeader toggle={() => setShowViewModal(false)}>
          Incident Details - {selectedIncident?.number}
        </ModalHeader>
        <ModalBody>
          {selectedIncident && (
            <Row>
              <Col md={6}>
                <div className="mb-3"><strong>Incident Number:</strong> <span className="ms-2 text-primary fw-medium">{selectedIncident.number}</span></div>
                <div className="mb-3"><strong>Title:</strong> <span className="ms-2">{selectedIncident.shortDescription}</span></div>
                <div className="mb-3"><strong>Category:</strong> <span className="ms-2">{selectedIncident.category}</span></div>
                <div className="mb-3"><strong>Sub Category:</strong> <span className="ms-2">{selectedIncident.subCategory}</span></div>
                <div className="mb-3"><strong>Caller:</strong> <span className="ms-2">{selectedIncident.caller}</span></div>
                <div className="mb-3"><strong>Contact Type:</strong> <span className="ms-2">{selectedIncident.contactType}</span></div>
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
                <div className="mb-3"><strong>Urgency:</strong> <span className="ms-2">{selectedIncident.urgency || 'Not specified'}</span></div>
                <div className="mb-3"><strong>Reported By:</strong> <span className="ms-2">{selectedIncident.reportedByName}</span></div>
                <div className="mb-3"><strong>Assigned To:</strong> <span className="ms-2">{selectedIncident.assignedTo || 'Unassigned'}</span></div>
                <div className="mb-3"><strong>Created:</strong> <span className="ms-2">{formatDate(selectedIncident.createdAt)}</span></div>
              </Col>
              <Col xs={12}>
                <hr />
                <div className="mb-3">
                  <strong>Detailed Description:</strong>
                  <p className="mt-2 p-3 bg-light rounded text-dark">{selectedIncident.description || selectedIncident.shortDescription}</p>
                </div>
                {(selectedIncident.address || selectedIncident.postcode || (selectedIncident.latitude && selectedIncident.longitude)) && (
                  <div className="mb-3">
                    <strong>Location:</strong>
                    <div className="mt-1 p-2 bg-light rounded text-dark">
                      {selectedIncident.address && <div>{selectedIncident.address}</div>}
                      {selectedIncident.postcode && <div><strong>Postcode:</strong> {selectedIncident.postcode}</div>}
                      {(selectedIncident.latitude && selectedIncident.longitude) && (
                        <div>
                          <strong>GPS Coordinates:</strong> {selectedIncident.latitude.substring(0,8)}, {selectedIncident.longitude.substring(0,8)}
                          <span className="text-success ms-2">📍 Precise Location</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal - Conditionally render based on user permissions */}
      {hasAdvancedEditPermissions() ? renderAdvancedEditModal() : renderBasicEditModal()}
    </>
  );
};

export default AllIncidents;
