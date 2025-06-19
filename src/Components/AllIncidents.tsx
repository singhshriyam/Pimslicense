'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  getUserDashboard
} from '../app/(MainBody)/services/userService';

import {
  fetchIncidentsByUserRole,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../app/(MainBody)/services/incidentService';

import EditIncident from './EditIncident';
import ViewIncident from './ViewIncident';

interface AllIncidentsProps {
  userType?: 'enduser' | 'handler' | 'admin' | 'manager' | 'field_engineer' | 'water_pollution_expert';
  onBack?: () => void;
  initialStatusFilter?: string | null;
}

const AllIncidents: React.FC<AllIncidentsProps> = ({ userType, onBack, initialStatusFilter }) => {
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
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');
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

      // Use the unified fetchIncidentsByUserRole function
      const fetchedIncidents = await fetchIncidentsByUserRole(actualUserType);

      console.log('✅ AllIncidents: Received', fetchedIncidents.length, 'incidents');

      // Sort incidents by creation date (latest first)
      fetchedIncidents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  // Update filter when initialStatusFilter changes
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

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

  // If editing incident, show edit component
  if (editingIncident && showEditModal) {
    return (
      <EditIncident
        incident={editingIncident}
        userType={userType}
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
                            <th>Status</th>
                            {isHandler && <th>Priority</th>}
                            {isHandler && <th>Caller</th>}
                            {!isHandler && <th>Assigned</th>}
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
                                <Badge style={{ backgroundColor: getStatusColor(incident.status), color: 'white' }}>
                                  {incident.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              {isHandler && (
                                <td>
                                  <Badge style={{ backgroundColor: getPriorityColor(incident.priority), color: 'white' }}>
                                    {incident.priority}
                                  </Badge>
                                </td>
                              )}
                              {isHandler && (
                                <td>
                                  <div>
                                    <div className="fw-medium text-dark">{incident.caller}</div>
                                  </div>
                                </td>
                              )}
                              {!isHandler && (
                                <td>
                                  <small className="text-muted">{incident.assignedTo || 'Unassigned'}</small>
                                </td>
                              )}
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
      {showViewModal && selectedIncident && (
        <ViewIncident
          incident={selectedIncident}
          onClose={handleCloseView}
          userType={userType}
        />
      )}

      {/* Edit Incident Modal */}
      {showEditModal && editingIncident && (
        <EditIncident
          incident={editingIncident}
          userType={userType}
          onClose={handleCloseEdit}
          onSave={handleCloseEdit}
        />
      )}
    </>
  );
};

export default AllIncidents;
