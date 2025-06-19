'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Alert, ButtonGroup } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  getUserDashboard
} from '../app/(MainBody)/services/userService';

import {
  fetchAllIncidents,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../app/(MainBody)/services/incidentService';

interface AssignIncidentsProps {
  userType?: 'admin' | 'manager' | 'handler';
  onBack?: () => void;
}

interface AssignmentTarget {
  id: string;
  name: string;
  email: string;
  team: string;
  team_id: number;
  type: 'manager' | 'handler' | 'field_engineer' | 'water_pollution_expert';
}

// Enhanced Incident type to match backend structure
interface EnhancedIncident extends Omit<Incident, 'status'> {
  incidentstate?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  } | string;
  urgency?: {
    id: number;
    name: string;
  };
  assigned_to?: {
    id: number;
    name: string;
    email: string;
    team_id: number;
  };
  status?: IncidentStatusType; // Override status with proper type
}

// Role configuration for assignment
interface RoleConfig {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
  statusChange: string;
  color: string;
  available: boolean;
}

// Status type definitions
type IncidentStatusType = 'pending' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';

// Status mapping helper functions
const mapBackendStatusToFrontend = (backendStatus: string): IncidentStatusType => {
  const statusMap: {[key: string]: IncidentStatusType} = {
    'New': 'pending',
    'InProgress': 'in_progress',
    'OnHold': 'on_hold',
    'Resolved': 'resolved',
    'Closed': 'closed'
  };
  return statusMap[backendStatus] || 'pending';
};

const AssignIncidents: React.FC<AssignIncidentsProps> = ({ userType, onBack }) => {
  const router = useRouter();

  // State management
  const [incidents, setIncidents] = useState<EnhancedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<EnhancedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<EnhancedIncident | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Assignment targets and roles
  const [assignmentTargets, setAssignmentTargets] = useState<AssignmentTarget[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(true);

  // Role configurations
  const roleConfigs: RoleConfig[] = [
    {
      id: 'handler',
      name: 'Incident Handler',
      description: 'Assign to incident handlers for immediate processing',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/incident-handeler/assign-incident',
      statusChange: 'In Progress',
      color: 'primary',
      available: true
    },
    {
      id: 'manager',
      name: 'Incident Manager',
      description: 'Escalate to incident managers for oversight',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/incident-manager/assign-incident',
      statusChange: 'Under Review',
      color: 'warning',
      available: false // Backend not ready
    },
    {
      id: 'field_engineer',
      name: 'Field Engineer',
      description: 'Assign to field engineers for on-site resolution',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/field-engineer/assign-incident',
      statusChange: 'On Hold (Field Work)',
      color: 'info',
      available: false // Backend not ready
    },
    {
      id: 'water_pollution_expert',
      name: 'Water Pollution Expert',
      description: 'Assign to specialists for complex water pollution cases',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/expert-team/assign-incident',
      statusChange: 'Expert Review',
      color: 'success',
      available: false // Backend not ready
    }
  ];

  // Fetch assignment targets based on selected role
  const fetchAssignmentTargets = async (roleType?: string) => {
    try {
      setLoadingTargets(true);

      // Fetch users from API
      const response = await fetch('https://apexwpc.apextechno.co.uk/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const userData = await response.json();
      const users = userData.data || userData;

      // Filter users based on role type
      let filteredUsers = users;

      if (roleType) {
        const teamIdMap: {[key: string]: number[]} = {
          'handler': [2], // Incident Handler
          'manager': [5, 6], // Incident Manager, SLA Manager
          'field_engineer': [9], // Field Engineer
          'water_pollution_expert': [10] // Expert Team
        };

        const allowedTeamIds = teamIdMap[roleType] || [];
        filteredUsers = users.filter((user: any) => allowedTeamIds.includes(user.team_id));
      } else {
        // Show all assignable users if no role selected
        filteredUsers = users.filter((user: any) => [2, 5, 6, 9, 10].includes(user.team_id));
      }

      const targets: AssignmentTarget[] = filteredUsers.map((user: any) => ({
        id: user.id?.toString() || Math.random().toString(),
        name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
        email: user.email,
        team: user.team_name,
        team_id: user.team_id,
        type: getTeamTypeFromId(user.team_id)
      }));

      setAssignmentTargets(targets);

    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to static data
      const fallbackTargets: AssignmentTarget[] = [
        { id: '4', name: 'Shalini', email: 'shalini_mehta@apextechno.co.uk', team: 'Incident Handler', team_id: 2, type: 'handler' },
        { id: '3', name: 'Narayan', email: 'naryan@apextecno.co.uk', team: 'Incident Handler', team_id: 2, type: 'handler' },
        { id: '5', name: 'B Pattanaik', email: 'b.pattanaik@apextechno.co.uk', team: 'Incident Handler', team_id: 2, type: 'handler' },
        { id: '7', name: 'Ujjwal', email: 'ujjwal@gmail.com', team: 'Incident Handler', team_id: 2, type: 'handler' },
        { id: '2', name: 'Shweta', email: 'shweta.bhushan@apextechno.co.uk', team: 'Incident Manager', team_id: 5, type: 'manager' },
        { id: '16', name: 'Ajay SLA Manager', email: 'ajay.pandey@apextechno.co.uk', team: 'SLA Manager', team_id: 6, type: 'manager' },
        { id: '23', name: 'Field Engineer', email: 'fe@gmail.com', team: 'Field Engineer', team_id: 9, type: 'field_engineer' },
        { id: '24', name: 'Expert Team', email: 'et@gmail.com', team: 'Expert Team', team_id: 10, type: 'water_pollution_expert' }
      ];

      if (roleType) {
        setAssignmentTargets(fallbackTargets.filter(target => target.type === roleType));
      } else {
        setAssignmentTargets(fallbackTargets);
      }
    } finally {
      setLoadingTargets(false);
    }
  };

  // Helper function to get team type from team_id
  const getTeamTypeFromId = (teamId: number): 'manager' | 'handler' | 'field_engineer' | 'water_pollution_expert' => {
    switch (teamId) {
      case 2: return 'handler';
      case 5: return 'manager';
      case 6: return 'manager';
      case 9: return 'field_engineer';
      case 10: return 'water_pollution_expert';
      default: return 'handler';
    }
  };

  // Helper function to get team name
  const getTeamName = (teamId: number) => {
    const teamMap: {[key: number]: string} = {
      1: 'Administrator',
      2: 'Incident Handler',
      3: 'User',
      5: 'Incident Manager',
      6: 'SLA Manager',
      9: 'Field Engineer',
      10: 'Expert Team'
    };
    return teamMap[teamId] || 'Unknown Team';
  };

  // Fetch incidents data
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

      const fetchedIncidents = await fetchAllIncidents();
      console.log('AssignIncidents - Fetched incidents:', fetchedIncidents.length);

      const enhancedIncidents: EnhancedIncident[] = fetchedIncidents.map(incident => ({
        ...incident,
        status: mapBackendStatusToFrontend(incident.incidentstate?.name || 'New') as IncidentStatusType,
        assignedTo: incident.assigned_to?.name || incident.assignedTo || 'Unassigned'
      }));

      setIncidents(enhancedIncidents);
      setFilteredIncidents(enhancedIncidents);
      setCurrentPage(1);

    } catch (error: any) {
      console.error('Fetch incidents error:', error);
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
    fetchAssignmentTargets(); // Fetch all targets initially
  }, [router, userType]);

  // Filter incidents
  useEffect(() => {
    let filtered = [...incidents];

    // Status filter
    if (statusFilter === 'unassigned') {
      filtered = filtered.filter(incident =>
        !incident.assigned_to?.name && (!incident.assignedTo || incident.assignedTo === 'Unassigned' || incident.assignedTo.trim() === '')
      );
    } else if (statusFilter === 'assigned') {
      filtered = filtered.filter(incident =>
        incident.assigned_to?.name || (incident.assignedTo && incident.assignedTo !== 'Unassigned' && incident.assignedTo.trim() !== '')
      );
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(incident =>
        (incident.urgency?.name?.toLowerCase() || incident.priority?.toLowerCase()) === priorityFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident =>
        incident.shortDescription?.toLowerCase().includes(term) ||
        incident.number?.toLowerCase().includes(term) ||
        (typeof incident.category === 'object' ? incident.category.name : incident.category)?.toLowerCase().includes(term) ||
        incident.caller?.toLowerCase().includes(term)
      );
    }

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, statusFilter, priorityFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setSelectedAssignee(''); // Reset assignee when role changes
    fetchAssignmentTargets(roleId); // Fetch users for this role
  };

  // Assignment handlers
  const handleAssignIncident = (incident: EnhancedIncident) => {
    setSelectedIncident(incident);
    setSelectedRole('');
    setSelectedAssignee('');
    setAssignmentNotes('');
    setShowAssignModal(true);
    fetchAssignmentTargets(); // Fetch all targets initially
  };

  const handleSaveAssignment = async () => {
    if (!selectedIncident || !selectedRole || !selectedAssignee) {
      setError('Please select both a role and an assignee');
      return;
    }

    const roleConfig = roleConfigs.find(role => role.id === selectedRole);
    if (!roleConfig) {
      setError('Invalid role selected');
      return;
    }

    if (!roleConfig.available) {
      setError(`${roleConfig.name} assignment is not yet available. Backend API is under development.`);
      return;
    }

    try {
      setAssigning(true);
      setError(null);

      const assignee = assignmentTargets.find(target => target.id === selectedAssignee);
      if (!assignee) {
        setError('Invalid assignee selected');
        return;
      }

      // Prepare assignment data
      const assignmentData = {
        incident_id: parseInt(selectedIncident.id),
        assigned_to_id: parseInt(assignee.id),
        notes: assignmentNotes,
        role_type: selectedRole
      };

      console.log('Assignment data:', assignmentData);
      console.log('Using API:', roleConfig.apiEndpoint);

      // Make API call using the role-specific endpoint
      const response = await fetch(roleConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to assign incident (${response.status})`);
      }

      const result = await response.json();
      console.log('Assignment result:', result);

      // Update local state
      const updatedIncident: EnhancedIncident = {
        ...selectedIncident,
        assignedTo: assignee.name,
        assigned_to: {
          id: parseInt(assignee.id),
          name: assignee.name,
          email: assignee.email,
          team_id: assignee.team_id
        },
        status: (selectedRole === 'field_engineer' ? 'on_hold' : 'in_progress') as IncidentStatusType
      };

      const updatedIncidents = incidents.map(incident =>
        incident.id === selectedIncident.id ? updatedIncident : incident
      );

      setIncidents(updatedIncidents);
      setShowAssignModal(false);
      setSelectedIncident(null);

      setSuccess(`Incident ${selectedIncident.number} successfully assigned to ${assignee.name} (${roleConfig.name})`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (error: any) {
      console.error('Error assigning incident:', error);
      setError(`Failed to assign incident: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // Utility functions
  const formatDateOnly = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    } else {
      const dashboardRoute = getUserDashboard(user?.team || 'user');
      router.push(dashboardRoute);
    }
  };

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
        <Button key="prev" color="outline-primary" size="sm" onClick={() => setCurrentPage(currentPage - 1)} className="me-1">‹</Button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button key={i} color={i === currentPage ? "primary" : "outline-primary"} size="sm" onClick={() => setCurrentPage(i)} className="me-1">
          {i}
        </Button>
      );
    }

    if (currentPage < totalPages) {
      buttons.push(
        <Button key="next" color="outline-primary" size="sm" onClick={() => setCurrentPage(currentPage + 1)} className="me-1">›</Button>
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
                    <h4 className="mb-1">🎯 Assign Incidents</h4>
                    <p className="text-muted mb-0">Assign incidents to appropriate team members based on their roles</p>
                  </div>
                  <div>
                    <Button color="secondary" size="sm" onClick={handleBackToDashboard}>
                      ← Back to Dashboard
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Success Alert */}
        {success && (
          <Row>
            <Col xs={12}>
              <Alert color="success" className="mb-4" toggle={() => setSuccess(null)}>
                <strong>✅ Success!</strong> {success}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Error Alert */}
        {error && (
          <Row>
            <Col xs={12}>
              <Alert color="danger" className="mb-4" toggle={() => setError(null)}>
                <strong>❌ Error!</strong> {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Filters and Actions */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>🔍 Filter & Assign</h5>
                  <div>
                    <Button color="outline-primary" size="sm" onClick={fetchData}>
                      🔄 Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Search</Label>
                      <Input
                        type="text"
                        placeholder="Search incidents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Assignment Status</Label>
                      <Input
                        type="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Incidents</option>
                        <option value="unassigned">Unassigned Only</option>
                        <option value="assigned">Assigned Only</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Priority</Label>
                      <Input
                        type="select"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </Input>
                    </FormGroup>
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
                  <h5>📋 Incidents for Assignment ({filteredIncidents.length})</h5>
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
                      </svg>
                    </div>
                    <p className="text-muted">No incidents found matching your criteria.</p>
                    <Button color="outline-primary" onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setSearchTerm('');
                    }}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Incident</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Current Assignment</th>
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
                                  <div className="text-muted small" style={{ maxWidth: '200px' }}>
                                    {incident.shortDescription}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium" style={{ maxWidth: '200px' }}>
                                    {typeof incident.category === 'object' ? incident.category?.name : incident.category}
                                  </div>
                                  <small className="text-muted">Caller: {incident.caller}</small>
                                </div>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getPriorityColor(incident.urgency?.name || incident.priority),
                                  color: 'white'
                                }}>
                                  {incident.urgency?.name || incident.priority}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getStatusColor(incident.incidentstate?.name?.toLowerCase() || incident.status || 'pending'),
                                  color: 'white'
                                }}>
                                  {incident.incidentstate?.name || (incident.status || 'pending').replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                <div>
                                  {incident.assigned_to?.name ? (
                                    <div>
                                      <span className="fw-medium text-success">
                                        {incident.assigned_to.name}
                                      </span>
                                      <br />
                                      <small className="text-muted">
                                        {getTeamName(incident.assigned_to.team_id || 2)}
                                      </small>
                                    </div>
                                  ) : incident.assignedTo && incident.assignedTo !== 'Unassigned' ? (
                                    <div>
                                      <span className="fw-medium text-success">
                                        {incident.assignedTo}
                                      </span>
                                      <br />
                                      <small className="text-muted">Assigned</small>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-warning fw-medium">⚠️ Unassigned</span>
                                      <br />
                                      <small className="text-muted">Needs assignment</small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <small>{formatDateOnly(incident.createdAt)}</small>
                              </td>
                              <td>
                                <Button
                                  color="primary"
                                  size="sm"
                                  onClick={() => handleAssignIncident(incident)}
                                >
                                  {incident.assigned_to?.name ? '🔄 Reassign' : '👤 Assign'}
                                </Button>
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

      {/* Single Assignment Modal */}
      <Modal isOpen={showAssignModal} toggle={() => setShowAssignModal(false)} size="lg">
        <ModalHeader toggle={() => setShowAssignModal(false)}>
          {selectedIncident?.assigned_to?.name
            ? `🔄 Reassign Incident - ${selectedIncident?.number}`
            : `👤 Assign Incident - ${selectedIncident?.number}`}
        </ModalHeader>
        <ModalBody>
          {selectedIncident && (
            <>
              {/* Incident Details */}
              <div className="mb-4 p-3 bg-light rounded">
                <Row>
                  <Col md={6}>
                    <div><strong>Incident:</strong> {selectedIncident.number}</div>
                    <div><strong>Priority:</strong>
                      <Badge className="ms-2" style={{ backgroundColor: getPriorityColor(selectedIncident.urgency?.name || selectedIncident.priority), color: 'white' }}>
                        {selectedIncident.urgency?.name || selectedIncident.priority}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div><strong>Category:</strong> {typeof selectedIncident.category === 'object' ? selectedIncident.category?.name : selectedIncident.category}</div>
                    <div><strong>Caller:</strong> {selectedIncident.caller}</div>
                  </Col>
                  <Col xs={12} className="mt-2">
                    <div><strong>Description:</strong> {selectedIncident.shortDescription}</div>
                    {selectedIncident.assigned_to?.name && (
                      <div className="mt-2">
                        <strong>Currently Assigned To:</strong>
                        <Badge color="info" className="ms-2">
                          {selectedIncident.assigned_to.name} - {getTeamName(selectedIncident.assigned_to.team_id || 2)}
                        </Badge>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              <Form>
                {/* Step 1: Select Role */}
                <FormGroup>
                  <Label className="fw-bold">Step 1: Select Role Type</Label>
                  <div className="mt-2">
                    <ButtonGroup className="w-100">
                      {roleConfigs.map((role) => (
                        <Button
                          key={role.id}
                          color={selectedRole === role.id ? role.color : 'outline-secondary'}
                          onClick={() => handleRoleSelect(role.id)}
                          disabled={!role.available}
                          className="text-start"
                          style={{ flex: 1 }}
                        >
                          <div>
                            <div className="fw-medium">
                              {role.name}
                              {!role.available && ' (Coming Soon)'}
                            </div>
                            <small className="d-block text-muted">{role.description}</small>
                            {selectedRole === role.id && (
                              <small className="d-block text-success">
                                Status will change to: {role.statusChange}
                              </small>
                            )}
                          </div>
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>
                  {!selectedRole && (
                    <small className="text-muted mt-1">
                      Please select a role type to see available assignees
                    </small>
                  )}
                </FormGroup>

                {/* Step 2: Select User */}
                {selectedRole && (
                  <FormGroup>
                    <Label className="fw-bold">Step 2: Select Assignee</Label>
                    {loadingTargets ? (
                      <div className="text-center p-3">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Loading available {roleConfigs.find(r => r.id === selectedRole)?.name}s...
                      </div>
                    ) : (
                      <>
                        <Input
                          type="select"
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                        >
                          <option value="">Select an assignee...</option>
                          {assignmentTargets.map(target => (
                            <option key={target.id} value={target.id}>
                              {target.name} - {target.team} ({target.email})
                            </option>
                          ))}
                        </Input>
                        <small className="text-muted mt-1">
                          {assignmentTargets.length} available {roleConfigs.find(r => r.id === selectedRole)?.name}(s)
                        </small>
                      </>
                    )}
                  </FormGroup>
                )}

                {/* Assignment Notes */}
                {selectedRole && selectedAssignee && (
                  <FormGroup>
                    <Label>Assignment Notes (Optional)</Label>
                    <Input
                      type="textarea"
                      rows={4}
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Add any notes about this assignment..."
                    />
                    {selectedRole === 'field_engineer' && (
                      <small className="text-warning mt-1">
                        <strong>⚠️ Note:</strong> Assigning to Field Engineer will change incident status to "On Hold"
                      </small>
                    )}
                  </FormGroup>
                )}
              </Form>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleSaveAssignment}
            disabled={assigning || !selectedRole || !selectedAssignee || loadingTargets}
          >
            {assigning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Assigning...
              </>
            ) : (
              selectedIncident?.assigned_to?.name ? '🔄 Reassign Incident' : '✅ Assign Incident'
            )}
          </Button>
          <Button color="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AssignIncidents;
