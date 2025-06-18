'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, TabContent, TabPane, Form, FormGroup, Label, Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
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
  fetchFieldEngineerIncidents,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../app/(MainBody)/services/incidentService';

interface AllIncidentsProps {
  userType?: 'enduser' | 'handler' | 'admin' | 'manager' | 'field_engineer' | 'water_pollution_expert';
  onBack?: () => void;
}

// SLA Status type
interface SLAStatus {
  slaName: string;
  type: 'Response' | 'Resolution';
  target: string;
  stage: 'Within SLA' | 'Approaching Breach' | 'Breached';
  businessTimeLeft: string;
  businessElapsedTime: string;
  startTime: string;
}

// Enhanced Incident type with SLA
interface EnhancedIncident extends Incident {
  slaStatus: SLAStatus[];
  similarIncidents?: Incident[];
}

const AllIncidents: React.FC<AllIncidentsProps> = ({ userType, onBack }) => {
  const router = useRouter();

  const [incidents, setIncidents] = useState<EnhancedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<EnhancedIncident[]>([]);
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
  const [selectedIncident, setSelectedIncident] = useState<EnhancedIncident | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<EnhancedIncident | null>(null);

  // Dropdown states for actions
  const [dropdownOpen, setDropdownOpen] = useState<{[key: string]: boolean}>({});

  // Evidence tab states
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: number;
    name: string;
    url: string;
    uploadedAt: string;
    size: string;
  }>>([]);

  // Narration with spell check
  const [narration, setNarration] = useState('');
  const [spellCheckSuggestions, setSpellCheckSuggestions] = useState<string[]>([]);

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
  const [activeTab, setActiveTab] = useState('details');

  // Mock SLA calculation function
  const calculateSLA = (incident: Incident): SLAStatus[] => {
    const createdDate = new Date(incident.createdAt);
    const now = new Date();
    const elapsedHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

    const responseSLA: SLAStatus = {
      slaName: 'Response SLA',
      type: 'Response',
      target: '4 hours',
      stage: elapsedHours < 3 ? 'Within SLA' : elapsedHours < 4 ? 'Approaching Breach' : 'Breached',
      businessTimeLeft: elapsedHours < 4 ? `${4 - elapsedHours}h remaining` : 'Breached',
      businessElapsedTime: `${elapsedHours}h`,
      startTime: createdDate.toLocaleString()
    };

    const resolutionSLA: SLAStatus = {
      slaName: 'Resolution SLA',
      type: 'Resolution',
      target: incident.priority === 'High' ? '24 hours' : incident.priority === 'Medium' ? '48 hours' : '72 hours',
      stage: elapsedHours < 20 ? 'Within SLA' : elapsedHours < 24 ? 'Approaching Breach' : 'Breached',
      businessTimeLeft: elapsedHours < 24 ? `${24 - elapsedHours}h remaining` : 'Breached',
      businessElapsedTime: `${elapsedHours}h`,
      startTime: createdDate.toLocaleString()
    };

    return [responseSLA, resolutionSLA];
  };

  // Mock similar incidents finder
  const findSimilarIncidents = (incident: Incident): Incident[] => {
    return [
      {
        id: 'similar-1',
        number: 'INC-2024-001',
        shortDescription: 'Similar sewage issue resolved',
        category: incident.category,
        status: 'resolved',
        priority: 'Medium',
        createdAt: '2024-01-15T10:00:00Z',
        caller: 'John Smith',
        description: 'Similar issue was resolved by cleaning the drain and replacing damaged pipe.'
      } as Incident,
      {
        id: 'similar-2',
        number: 'INC-2024-002',
        shortDescription: 'Sewage overflow - quick fix',
        category: incident.category,
        status: 'closed',
        priority: 'High',
        createdAt: '2024-01-10T14:30:00Z',
        caller: 'Jane Doe',
        description: 'Issue resolved by emergency response team within 2 hours.'
      } as Incident
    ];
  };

  // Spell check simulation
  const performSpellCheck = (text: string) => {
    const commonMisspellings: {[key: string]: string} = {
      'occured': 'occurred',
      'seperate': 'separate',
      'recieve': 'receive',
      'maintainance': 'maintenance',
      'enviroment': 'environment'
    };

    const suggestions: string[] = [];
    Object.keys(commonMisspellings).forEach(wrong => {
      if (text.toLowerCase().includes(wrong)) {
        suggestions.push(`Did you mean "${commonMisspellings[wrong]}" instead of "${wrong}"?`);
      }
    });

    setSpellCheckSuggestions(suggestions);
  };

  const toggleDropdown = (incidentId: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [incidentId]: !prev[incidentId]
    }));
  };

  const getSLAStatusColor = (stage: string) => {
    switch (stage) {
      case 'Within SLA': return '#10b981';
      case 'Approaching Breach': return '#f59e0b';
      case 'Breached': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSLAStatusBadge = (incident: EnhancedIncident) => {
    const responseSLA = incident.slaStatus.find(sla => sla.type === 'Response');
    if (!responseSLA) return null;

    return (
      <Badge style={{ backgroundColor: getSLAStatusColor(responseSLA.stage), color: 'white' }}>
        {responseSLA.stage}
      </Badge>
    );
  };

  // Category and subcategory mapping
  const categoryOptions = [
    { id: '1', name: 'Inside home' },
    { id: '2', name: 'Street Pavement' },
    { id: '3', name: 'SP site' },
    { id: '4', name: 'Outside drive way /garden' },
    { id: '5', name: 'River strem or lake' }
  ];

  const subcategoryOptions: Record<string, Array<{id: string, name: string}>> = {
    '1': [
      { id: '1', name: 'Leak from my pipe' },
      { id: '2', name: 'Toilet/sink /shower issues' },
      { id: '3', name: 'Sewage spillout' },
      { id: '4', name: 'Cover or lid is damaged' },
      { id: '5', name: 'Sewage smell in my home' },
      { id: '6', name: 'Blocked alarm' }
    ],
    '2': [
      { id: '7', name: 'Manhole blocked /smelly' },
      { id: '8', name: 'Cover or lid is damaged' },
      { id: '9', name: 'Smelly sewage over flowing on the street' },
      { id: '10', name: 'Roadside drain or gully that is blocked' }
    ],
    '3': [
      { id: '11', name: 'Mark the site in the map or list of SP sites' }
    ],
    '4': [
      { id: '12', name: 'Leak on my property outside' },
      { id: '13', name: 'Blocked /smelly manhole on my property' },
      { id: '14', name: 'Sewage overflow on my property' },
      { id: '15', name: 'Blocked drain on my property' },
      { id: '16', name: 'Sewage odour outside my home' }
    ],
    '5': []
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
           userTeam.includes('field') ||
           userTeam.includes('engineer') ||
           userTeam.includes('water') ||
           userTeam.includes('pollution') ||
           currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin') ||
           currentUserType.includes('field_engineer') ||
           currentUserType.includes('water_pollution_expert');
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

      // Admin and Manager see ALL incidents
      if (actualUserType.includes('admin') || actualUserType.includes('manager')) {
        console.log('📊 Fetching ALL incidents for admin/manager...');
        fetchedIncidents = await fetchAllIncidents();
      }
      // Handler gets handler incidents
      else if (actualUserType.includes('handler')) {
        console.log('📊 Fetching handler incidents...');
        fetchedIncidents = await fetchHandlerIncidents();
      }
      // Field Engineer gets assigned incidents
      else if (actualUserType.includes('field') && actualUserType.includes('engineer')) {
        console.log('📊 Fetching field engineer incidents...');
        fetchedIncidents = await fetchFieldEngineerIncidents();
      }
      // Water Pollution Expert gets assigned incidents
      else if (actualUserType.includes('water') && actualUserType.includes('pollution')) {
        console.log('📊 Fetching water pollution expert incidents...');
        fetchedIncidents = await fetchFieldEngineerIncidents();
      }
      // End user sees their own incidents
      else {
        console.log('📊 Fetching end user incidents...');
        fetchedIncidents = await fetchEndUserIncidents();
      }

      // Enhance incidents with SLA data for handlers/managers/field engineers only
      const enhancedIncidents: EnhancedIncident[] = fetchedIncidents.map(incident => ({
        ...incident,
        slaStatus: hasAdvancedEditPermissions() ? calculateSLA(incident) : [],
        similarIncidents: hasAdvancedEditPermissions() ? findSimilarIncidents(incident) : []
      }));

      console.log('✅ AllIncidents: Received', enhancedIncidents.length, 'incidents');

      setIncidents(enhancedIncidents);
      setFilteredIncidents(enhancedIncidents);
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

  const handleViewIncident = (incident: EnhancedIncident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const handleEditIncident = (incident: EnhancedIncident) => {
    setEditingIncident(incident);
    setActiveTab('details');
    setNarration('');
    setSpellCheckSuggestions([]);
    setUploadedImages([]);

    if (hasAdvancedEditPermissions()) {
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
      setEditForm({
        shortDescription: incident.shortDescription || '',
        description: incident.description || ''
      });
    }

    setShowEditModal(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const newImage = {
        id: Date.now() + Math.random(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toLocaleString(),
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      };
      setUploadedImages(prev => [...prev, newImage]);
    });
  };

  const handleImageDelete = (id: number) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleImageDownload = (image: any) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    link.click();
  };

  const handleNarrationChange = (value: string) => {
    setNarration(value);
    setAdvancedEditForm(prev => ({ ...prev, narration: value }));
    performSpellCheck(value);
  };

  const applySuggestion = (suggestion: string) => {
    const match = suggestion.match(/Did you mean "([^"]+)"/);
    if (match) {
      const correctedWord = match[1];
      const updatedNarration = narration.replace(/\b\w+\b/g, (word) => {
        if (word.toLowerCase() === correctedWord.toLowerCase()) {
          return correctedWord;
        }
        return word;
      });
      setNarration(updatedNarration);
      setAdvancedEditForm(prev => ({ ...prev, narration: updatedNarration }));
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingIncident) return;

      let updatedIncident: EnhancedIncident;

      if (hasAdvancedEditPermissions()) {
        updatedIncident = {
          ...editingIncident,
          shortDescription: advancedEditForm.shortDescription,
          description: advancedEditForm.description,
          category: advancedEditForm.category,
          subCategory: advancedEditForm.subCategory,
          impact: advancedEditForm.impact,
          priority: advancedEditForm.urgency,
          status: advancedEditForm.status as any
        };
      } else {
        updatedIncident = {
          ...editingIncident,
          shortDescription: editForm.shortDescription,
          description: editForm.description
        };
      }

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

  // Check if user has elevated permissions
  const hasElevatedPermissions = () => {
    const userTeam = user?.team?.toLowerCase() || '';
    const currentUserType = userType?.toLowerCase() || '';

    return userTeam.includes('handler') ||
           userTeam.includes('manager') ||
           userTeam.includes('admin') ||
           userTeam.includes('field') ||
           userTeam.includes('engineer') ||
           userTeam.includes('water') ||
           userTeam.includes('pollution') ||
           currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin') ||
           currentUserType.includes('field_engineer') ||
           currentUserType.includes('water_pollution_expert');
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
                            {/* Only show SLA Status for handlers/managers/field engineers */}
                            {isHandler ? (
                              <th>SLA Status</th>
                            ) : (
                              <th>Assigned</th>
                            )}
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
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium text-dark">{incident.category}</div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium text-dark">{incident.caller}</div>
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
                                {isHandler ? (
                                  getSLAStatusBadge(incident)
                                ) : (
                                  <small className="text-muted">{incident.assignedTo || 'Unassigned'}</small>
                                )}
                              </td>
                              <td>
                                <div>
                                  <span className="text-muted">{incident.address || 'Not specified'}</span>
                                </div>
                              </td>
                              <td>
                                <small className="text-dark">{formatDateOnly(incident.createdAt)}</small>
                              </td>
                              <td>
                                {isHandler ? (
                                  // Advanced dropdown for handlers/managers/field engineers
                                  <Dropdown
                                    isOpen={dropdownOpen[incident.id] || false}
                                    toggle={() => toggleDropdown(incident.id)}
                                  >
                                    <DropdownToggle tag="button" className="btn btn-link p-1 border-0 bg-transparent text-dark">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark">
                                        <circle cx="12" cy="12" r="1"/>
                                        <circle cx="12" cy="5" r="1"/>
                                        <circle cx="12" cy="19" r="1"/>
                                      </svg>
                                    </DropdownToggle>
                                    <DropdownMenu>
                                      <DropdownItem onClick={() => handleViewIncident(incident)}>
                                        View
                                      </DropdownItem>
                                      <DropdownItem onClick={() => handleEditIncident(incident)}>
                                        Edit
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                                ) : (
                                  // Simple buttons for end users
                                  <div className="d-flex gap-1">
                                    <Button color="outline-info" size="sm" onClick={() => handleViewIncident(incident)}>View</Button>
                                    <Button color="outline-warning" size="sm" onClick={() => handleEditIncident(incident)}>Edit</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

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

      {/* View Incident Modal */}
      <Modal isOpen={showViewModal} toggle={() => setShowViewModal(false)} size="xl">
        <ModalHeader toggle={() => setShowViewModal(false)}>
          Incident Details - {selectedIncident?.number}
        </ModalHeader>
        <ModalBody>
          {selectedIncident && (
            <>
              <Row>
                <Col md={6}>
                  <div className="mb-3"><strong>Incident Number:</strong> <span className="ms-2 text-primary fw-medium">{selectedIncident.number}</span></div>
                  <div className="mb-3"><strong>Title:</strong> <span className="ms-2 text-dark">{selectedIncident.shortDescription}</span></div>
                  <div className="mb-3"><strong>Category:</strong> <span className="ms-2 text-dark">{selectedIncident.category}</span></div>
                  <div className="mb-3"><strong>Sub Category:</strong> <span className="ms-2 text-dark">{selectedIncident.subCategory}</span></div>
                  <div className="mb-3"><strong>Caller:</strong> <span className="ms-2 text-dark">{selectedIncident.caller}</span></div>
                  <div className="mb-3"><strong>Contact Type:</strong> <span className="ms-2 text-dark">{selectedIncident.contactType}</span></div>
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
                  <div className="mb-3"><strong>Impact:</strong> <span className="ms-2 text-dark">{selectedIncident.impact || 'Not specified'}</span></div>
                  <div className="mb-3"><strong>Urgency:</strong> <span className="ms-2 text-dark">{selectedIncident.urgency || 'Not specified'}</span></div>
                  <div className="mb-3"><strong>Reported By:</strong> <span className="ms-2 text-dark">{selectedIncident.reportedByName}</span></div>
                  <div className="mb-3"><strong>Created:</strong> <span className="ms-2 text-dark">{formatDate(selectedIncident.createdAt)}</span></div>
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
                        {selectedIncident.address && <div className="text-dark">{selectedIncident.address}</div>}
                        {selectedIncident.postcode && <div className="text-dark"><strong>Postcode:</strong> {selectedIncident.postcode}</div>}
                        {(selectedIncident.latitude && selectedIncident.longitude) && (
                          <div className="text-dark">
                            <strong>GPS Coordinates:</strong> {selectedIncident.latitude.substring(0,8)}, {selectedIncident.longitude.substring(0,8)}
                            <span className="text-success ms-2">📍 Precise Location</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SLA Status Section - Only for handlers/managers/field engineers */}
                  {isHandler && (
                    <>
                      <hr />
                      <div className="mb-3">
                        <h5 className="text-dark">SLA Status</h5>
                        <div className="table-responsive">
                          <Table>
                            <thead>
                              <tr>
                                <th className="text-dark">SLA Name</th>
                                <th className="text-dark">Type</th>
                                <th className="text-dark">Target</th>
                                <th className="text-dark">Stage</th>
                                <th className="text-dark">Business Time Left</th>
                                <th className="text-dark">Business Elapsed Time</th>
                                <th className="text-dark">Start Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedIncident.slaStatus.map((sla, index) => (
                                <tr key={index}>
                                  <td className="text-dark">{sla.slaName}</td>
                                  <td className="text-dark">{sla.type}</td>
                                  <td className="text-dark">{sla.target}</td>
                                  <td>
                                    <Badge style={{ backgroundColor: getSLAStatusColor(sla.stage), color: 'white' }}>
                                      {sla.stage}
                                    </Badge>
                                  </td>
                                  <td className="text-dark">{sla.businessTimeLeft}</td>
                                  <td className="text-dark">{sla.businessElapsedTime}</td>
                                  <td className="text-dark">{sla.startTime}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}
                </Col>
              </Row>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* Edit Incident Modal */}
      <Modal isOpen={showEditModal} toggle={() => setShowEditModal(false)} size="xl">
        <ModalHeader toggle={() => setShowEditModal(false)}>
          Edit Incident - {editingIncident?.number}
        </ModalHeader>
        <ModalBody>
          {/* Only show advanced tabs for handlers/managers/field engineers */}
          {hasAdvancedEditPermissions() ? (
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
              <NavItem>
                <NavLink
                  className={activeTab === 'knowledge' ? 'active' : ''}
                  onClick={() => setActiveTab('knowledge')}
                  style={{ cursor: 'pointer' }}
                >
                  Knowledge Base
                </NavLink>
              </NavItem>
            </Nav>
          ) : null}

          <TabContent activeTab={hasAdvancedEditPermissions() ? activeTab : 'details'}>
            {/* Incident Details Tab */}
            <TabPane tabId="details">
              {hasAdvancedEditPermissions() ? (
                <>
                  <h5 className="text-dark">Edit Incident</h5>
                  <Form>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="incidentNo" className="text-dark">Incident No</Label>
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
                          <Label for="contactType" className="text-dark">Contact Type</Label>
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
                          <Label for="category" className="text-dark">Category</Label>
                          <Input
                            type="select"
                            id="category"
                            value={advancedEditForm.category}
                            onChange={(e) => {
                              const newCategory = e.target.value;
                              setAdvancedEditForm({
                                ...advancedEditForm,
                                category: newCategory,
                                subCategory: ''
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
                          <Label for="subCategory" className="text-dark">Sub Category</Label>
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
                          <Label for="shortDescription" className="text-dark">Short Description</Label>
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
                          <Label for="description" className="text-dark">Description</Label>
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
                          <Label for="impact" className="text-dark">Impact <span className="text-danger">*</span></Label>
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
                          <Label for="urgency" className="text-dark">Urgency <span className="text-danger">*</span></Label>
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
                          <Label for="incidentState" className="text-dark">Incident State <span className="text-danger">*</span></Label>
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
                          <Label for="narration" className="text-dark">Narration <span className="text-danger">*</span></Label>
                          <Input
                            type="textarea"
                            id="narration"
                            rows="4"
                            value={narration}
                            onChange={(e) => handleNarrationChange(e.target.value)}
                            placeholder="Add your narration here..."
                          />
                          {spellCheckSuggestions.length > 0 && (
                            <div className="mt-2">
                              <small className="text-muted">Spell check suggestions:</small>
                              {spellCheckSuggestions.map((suggestion, index) => (
                                <div key={index} className="mt-1">
                                  <Button
                                    color="link"
                                    size="sm"
                                    className="p-0 text-start text-primary"
                                    onClick={() => applySuggestion(suggestion)}
                                  >
                                    {suggestion}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </FormGroup>
                      </Col>
                    </Row>
                  </Form>
                </>
              ) : (
                <>
                  <h5 className="text-dark">Edit Incident</h5>
                  <div>
                    <div className="mb-3">
                      <label className="form-label text-dark"><strong>Title/Short Description:</strong></label>
                      <Input
                        type="text"
                        value={editForm.shortDescription}
                        onChange={(e) => setEditForm({...editForm, shortDescription: e.target.value})}
                        placeholder="Enter short description"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark"><strong>Detailed Description:</strong></label>
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
                </>
              )}
            </TabPane>

            {/* Evidence Tab - Only for handlers/managers/field engineers */}
            {hasAdvancedEditPermissions() && (
              <TabPane tabId="evidence">
                <h5 className="text-dark">Upload Photo</h5>
                <Form className="mb-4">
                  <FormGroup>
                    <Label for="photoUpload" className="text-dark">Select Photo</Label>
                    <div className="d-flex align-items-center gap-3">
                      <Input
                        type="file"
                        id="photoUpload"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ maxWidth: '300px' }}
                      />
                      <Button color="primary" disabled>
                        Upload automatically on select
                      </Button>
                    </div>
                  </FormGroup>
                </Form>

                <div className="table-responsive">
                  <Table>
                    <thead>
                      <tr>
                        <th className="text-dark">Id</th>
                        <th className="text-dark">Image</th>
                        <th className="text-dark">Name</th>
                        <th className="text-dark">Size</th>
                        <th className="text-dark">Uploaded at</th>
                        <th className="text-dark">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedImages.length > 0 ? (
                        uploadedImages.map((image) => (
                          <tr key={image.id}>
                            <td className="text-dark">{image.id}</td>
                            <td>
                              <img src={image.url} alt="Uploaded" width="50" height="50" style={{ objectFit: 'cover' }} />
                            </td>
                            <td className="text-dark">{image.name}</td>
                            <td className="text-dark">{image.size}</td>
                            <td className="text-dark">{image.uploadedAt}</td>
                            <td>
                              <Button
                                color="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleImageDownload(image)}
                              >
                                Download
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleImageDelete(image.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No photos uploaded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <hr className="my-4" />

                <h5 className="text-dark">Ammonia Reading</h5>
                <Form className="mb-4">
                  <Row>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="type" className="text-dark">Type</Label>
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
                        <Label for="date" className="text-dark">Date</Label>
                        <Input
                          type="date"
                          id="date"
                          placeholder="dd.mm.yyyy"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label for="reading" className="text-dark">Reading</Label>
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
                        <th className="text-dark">Id</th>
                        <th className="text-dark">Type</th>
                        <th className="text-dark">Reading</th>
                        <th className="text-dark">Date</th>
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
            )}

            {/* Action Tab - Only for handlers/managers/field engineers */}
            {hasAdvancedEditPermissions() && (
              <TabPane tabId="action">
                <h5 className="text-dark">Action</h5>
                <Form className="mb-4">
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="actionType" className="text-dark">Action Type</Label>
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
                        <Label for="actionStatus" className="text-dark">Action Status</Label>
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
                        <Label for="priority" className="text-dark">Priority</Label>
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
                        <Label for="raisedOn" className="text-dark">Raised On</Label>
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
                        <Label for="details" className="text-dark">Details</Label>
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
                        <Label className="text-dark">
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

                <h5 className="text-dark">Actions</h5>
                <div className="table-responsive">
                  <Table>
                    <thead>
                      <tr>
                        <th className="text-dark">Action</th>
                        <th className="text-dark">Raised</th>
                        <th className="text-dark">Complete</th>
                        <th className="text-dark">Age</th>
                        <th className="text-dark">Type</th>
                        <th className="text-dark">Priority</th>
                        <th className="text-dark">Detail</th>
                        <th className="text-dark">Status</th>
                        <th className="text-dark">Created At</th>
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
            )}

            {/* Knowledge Base Tab - Only for handlers/managers/field engineers */}
            {hasAdvancedEditPermissions() && (
              <TabPane tabId="knowledge">
                <h5 className="text-dark">Similar Resolved Incidents</h5>
                <p className="text-muted mb-4">
                  Here are similar incidents that have been resolved and closed, which may help with this case:
                </p>

                {editingIncident?.similarIncidents && editingIncident.similarIncidents.length > 0 ? (
                  <div className="table-responsive">
                    <Table>
                      <thead>
                        <tr>
                          <th className="text-dark">Incident Number</th>
                          <th className="text-dark">Description</th>
                          <th className="text-dark">Status</th>
                          <th className="text-dark">Priority</th>
                          <th className="text-dark">Resolution Date</th>
                          <th className="text-dark">Solution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingIncident.similarIncidents.map((incident) => (
                          <tr key={incident.id}>
                            <td>
                              <span className="fw-medium text-primary">{incident.number}</span>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium text-dark">{incident.shortDescription}</div>
                                <small className="text-muted">Category: {incident.category}</small>
                              </div>
                            </td>
                            <td>
                              <Badge style={{ backgroundColor: getStatusColor(incident.status || 'resolved'), color: 'white' }}>
                                {(incident.status || 'resolved').replace('_', ' ')}
                              </Badge>
                            </td>
                            <td>
                              <Badge style={{ backgroundColor: getPriorityColor(incident.priority), color: 'white' }}>
                                {incident.priority}
                              </Badge>
                            </td>
                            <td className="text-dark">{formatDateOnly(incident.createdAt)}</td>
                            <td>
                              <div className="text-truncate text-dark" style={{ maxWidth: '200px' }}>
                                {incident.description}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="mb-3">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <h6 className="text-muted">No similar incidents found</h6>
                    <p className="text-muted">No resolved incidents with similar characteristics were found in the knowledge base.</p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="text-dark">Knowledge Base Tips:</h6>
                  <ul className="mb-0 text-dark">
                    <li>Review similar cases to understand common resolution patterns</li>
                    <li>Check if any standard procedures were followed</li>
                    <li>Look for recurring issues that might indicate systemic problems</li>
                    <li>Note successful resolution techniques for future reference</li>
                  </ul>
                </div>
              </TabPane>
            )}
          </TabContent>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleSaveEdit}>
            {hasAdvancedEditPermissions() ? 'Update Incident' : 'Save Changes'}
          </Button>
          <Button color="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AllIncidents;
