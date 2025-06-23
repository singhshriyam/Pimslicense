'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  clearUserData
} from '../../services/userService';

import {
  // fetchFieldEngineerIncidents, // TODO: Implement this endpoint
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../../services/incidentService';

import EditIncident from '../../../../Components/EditIncident';
import ViewIncident from '../../../../Components/ViewIncident';

const FieldEngineerDashboard = () => {
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
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Dropdown states for actions
  const [dropdownOpen, setDropdownOpen] = useState<{[key: string]: boolean}>({});

  const toggleDropdown = (incidentId: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [incidentId]: !prev[incidentId]
    }));
  };

  // Helper function to safely get status - uses the transform function logic
  const getStatus = (incident: Incident): 'pending' | 'in_progress' | 'resolved' | 'closed' => {
    if (incident.status) return incident.status;
    const state = incident.incidentstate?.name?.toLowerCase() || '';
    if (state === 'new') return 'pending';
    if (state === 'inprogress') return 'in_progress';
    if (state === 'resolved') return 'resolved';
    if (state === 'closed') return 'closed';
    return 'pending';
  };

  // Helper function to safely get category name
  const getCategoryName = (incident: Incident) => {
    if (incident.category?.name) return incident.category.name;
    return 'Uncategorized';
  };

  // Helper function to safely get priority name
  const getPriorityName = (incident: Incident) => {
    if (incident.priority?.name) return incident.priority.name;
    return incident.urgency?.name || 'Medium';
  };

  // Helper function to safely get caller name
  const getCallerName = (incident: Incident) => {
    const fullName = incident.user.last_name
      ? `${incident.user.name} ${incident.user.last_name}`
      : incident.user.name;
    return fullName;
  };

  // Helper function to safely get incident number
  const getIncidentNumber = (incident: Incident) => {
    return incident.incident_no;
  };

  // Helper function to safely get created date
  const getCreatedAt = (incident: Incident) => {
    return incident.created_at;
  };

  // Helper function to get address
  const getAddress = (incident: Incident) => {
    return incident.address || 'Not specified';
  };

  // Helper function to get short description
  const getShortDescription = (incident: Incident) => {
    return incident.short_description || 'No description';
  };

  // Fetch field engineer incidents
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }

      setUser({
        name: currentUser?.name || 'Field Engineer',
        team: currentUser?.team || 'Field Engineer',
        email: currentUser?.email || '',
        userId: currentUser?.id || ''
      });

      // TODO: Implement fetchFieldEngineerIncidents() endpoint
      // const fieldIncidents = await fetchFieldEngineerIncidents();

      // Temporary: Use fake data until endpoint is ready
      // FAKE DATA FOR DEMO - DELETE THIS WHEN REAL API IS READY
      const fieldIncidents: Incident[] = [
        {
          id: 'demo-1',
          incident_no: 'FE-2024-001',
          status: 'in_progress',
          category: { name: 'Electrical Safety' },
          priority: 'High', // Fixed: String instead of object
          user: { name: 'John', last_name: 'Smith' },
          created_at: '2024-01-15T10:30:00Z',
          address: '123 Industrial Park, Building A',
          assigned_to: { name: 'Current', last_name: 'User' },
          incidentstate: { name: 'inprogress' },
          urgency: { name: 'High' },
          short_description: 'Electrical panel overheating in main building'
        },
        {
          id: 'demo-2',
          incident_no: 'FE-2024-002',
          status: 'pending',
          category: { name: 'Equipment Failure' },
          priority: 'Medium', // Fixed: String instead of object
          user: { name: 'Sarah', last_name: 'Johnson' },
          created_at: '2024-01-16T14:20:00Z',
          address: '456 Factory Road, Unit 12',
          assigned_to: { name: 'Current', last_name: 'User' },
          incidentstate: { name: 'new' },
          urgency: { name: 'Medium' },
          short_description: 'Conveyor belt motor making unusual noises'
        }
      ];

      // Sort incidents by creation date (latest first)
      fieldIncidents.sort((a, b) => new Date(getCreatedAt(b)).getTime() - new Date(getCreatedAt(a)).getTime());

      setIncidents(fieldIncidents);
      setFilteredIncidents(fieldIncidents);
      setCurrentPage(1);

    } catch (error: any) {
      console.error('❌ Fetch field engineer incidents error:', error);
      setError(error.message || 'Failed to load field assignments');
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
  }, [router]);

  // Filter incidents
  useEffect(() => {
    let filtered = [...incidents];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => {
        const incidentStatus = getStatus(incident);
        return incidentStatus === statusFilter;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident =>
        getShortDescription(incident).toLowerCase().includes(term) ||
        getIncidentNumber(incident).toLowerCase().includes(term) ||
        getCategoryName(incident).toLowerCase().includes(term) ||
        getCallerName(incident).toLowerCase().includes(term) ||
        getAddress(incident).toLowerCase().includes(term)
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

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setEditingIncident(incident);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setEditingIncident(null);
    setShowEditModal(false);
    // Refresh data after edit
    fetchData();
  };

  const handleCloseView = () => {
    setShowViewModal(false);
    setSelectedIncident(null);
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleRefreshData = async () => {
    await fetchData();
  };

  const handleLogout = () => {
    clearUserData();
    router.replace('/auth/login');
  };

  // Get statistics
  const stats = getIncidentStats(filteredIncidents);

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

  // If editing incident, show edit component
  if (editingIncident && showEditModal) {
    return (
      <EditIncident
        incident={editingIncident}
        userType="field_engineer"
        onClose={handleCloseEdit}
        onSave={handleCloseEdit}
      />
    );
  }

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading your field assignments...</span>
          </div>
          <p className="mt-3 text-muted">Loading your field assignments...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {error}
          <div className="mt-2">
            <Button color="primary" onClick={handleRefreshData} className="me-2">
              Try again
            </Button>
          </div>
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
                    <h4 className="mb-1">Welcome back, {user?.name}!</h4>
                    <small className="text-muted">Field Engineer Dashboard - Site Inspections & Evidence Collection</small>
                  </div>
                  <div>
                    <Button color="outline-primary" size="sm" onClick={handleRefreshData}>
                      🔄 Refresh
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
            <Card className="o-hidden">
              <CardBody className="b-r-4 card-body">
                <div className="media static-top-widget">
                  <div className="align-self-center text-center">
                    <div className="d-inline-block">
                      <h5 className="mb-0 counter">{stats.total}</h5>
                      <span className="f-light">Total Field Assignments</span>
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

        {/* Filters */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>Filter Field Assignments</h5>
                  <Button color="outline-primary" size="sm" onClick={handleRefreshData}>🔄 Refresh</Button>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={6}>
                    <label>Search</label>
                    <Input
                      type="text"
                      placeholder="Search by number, caller, description, location..."
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

        {/* Field Assignments Table */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>
                    My Field Assignments ({filteredIncidents.length})
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
                    <div className="mb-3">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </div>
                    <h6 className="text-muted">No field assignments found</h6>
                    <p className="text-muted">No assignments match your current filters. Try adjusting your search criteria.</p>
                    <Button color="primary" onClick={handleRefreshData}>Refresh Data</Button>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Incident</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentIncidents.map((incident) => (
                            <tr key={incident.id}>
                              <td>
                                <div>
                                  <span className="fw-medium text-primary">{getIncidentNumber(incident)}</span>
                                  <div><small className="text-muted">Caller: {getCallerName(incident)}</small></div>
                                </div>
                              </td>
                              <td>
                                <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {getShortDescription(incident)}
                                </div>
                              </td>
                              <td>
                                <div className="fw-medium text-dark">{getCategoryName(incident)}</div>
                              </td>
                              <td>
                                <Badge style={{ backgroundColor: getPriorityColor(getPriorityName(incident)), color: 'white' }}>
                                  {getPriorityName(incident)}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{ backgroundColor: getStatusColor(getStatus(incident)), color: 'white' }}>
                                  {getStatus(incident).replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                <small className="text-muted">{getAddress(incident)}</small>
                              </td>
                              <td>
                                <small className="text-dark">{formatDateOnly(getCreatedAt(incident))}</small>
                              </td>
                              <td>
                                {/* Field Engineer specific dropdown */}
                                <Dropdown
                                  isOpen={dropdownOpen[incident.id.toString()] || false}
                                  toggle={() => toggleDropdown(incident.id.toString())}
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
      {showViewModal && selectedIncident && (
        <ViewIncident
          incident={selectedIncident}
          onClose={handleCloseView}
          userType="field_engineer"
        />
      )}

      {/* Edit Incident Modal */}
      {showEditModal && editingIncident && (
        <EditIncident
          incident={editingIncident}
          userType="field_engineer"
          onClose={handleCloseEdit}
          onSave={handleCloseEdit}
        />
      )}
    </>
  )
}

export default FieldEngineerDashboard
