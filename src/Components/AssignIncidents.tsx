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

// Define our own incident interface to avoid conflicts
interface AssignIncident {
  id: string;
  number: string;
  shortDescription: string;
  caller: string;
  createdAt: string;
  updatedAt?: string;
  priority?: string;
  assignedTo?: string;
  // Backend specific fields
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
  // Frontend status field
  status?: string;
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

// Status mapping helper functions
const mapBackendStatusToFrontend = (backendStatus: string): string => {
  const statusMap: {[key: string]: string} = {
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
  const [incidents, setIncidents] = useState<AssignIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<AssignIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<AssignIncident | null>(null);
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

  // Role configurations - PRODUCTION READY
  const roleConfigs: RoleConfig[] = [
    {
      id: 'handler',
      name: 'Incident Handler',
      description: 'Assign to incident handlers for immediate processing and resolution',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/incident-handeler/assign-incident',
      statusChange: 'In Progress',
      color: 'primary',
      available: true
    },
    {
      id: 'manager',
      name: 'Incident Manager',
      description: 'Escalate to incident managers for oversight and coordination',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/incident-manager/assign-incident',
      statusChange: 'Under Management Review',
      color: 'warning',
      available: false // Backend API under development
    },
    {
      id: 'field_engineer',
      name: 'Field Engineer',
      description: 'Assign to field engineers for on-site investigation and resolution',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/field-engineer/assign-incident',
      statusChange: 'On Hold (Field Work Required)',
      color: 'info',
      available: false // Backend API under development
    },
    {
      id: 'water_pollution_expert',
      name: 'Water Pollution Expert',
      description: 'Assign to specialists for complex environmental incidents',
      apiEndpoint: 'https://apexwpc.apextechno.co.uk/api/expert-team/assign-incident',
      statusChange: 'Expert Analysis Required',
      color: 'success',
      available: false // Backend API under development
    }
  ];

  // Fetch assignment targets based on selected role - PRODUCTION VERSION (NO FALLBACK)
  const fetchAssignmentTargets = async (roleType?: string) => {
    try {
      setLoadingTargets(true);
      setError(null); // Clear any previous errors

      // Fetch users from API - PRODUCTION ONLY, NO FALLBACK DATA
      const response = await fetch('https://apexwpc.apextechno.co.uk/api/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch users from server: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      const users = userData.data || userData;

      if (!Array.isArray(users)) {
        throw new Error('Invalid user data format received from server');
      }

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

      // PRODUCTION: Validate all required fields exist, NO fallback data
      const targets: AssignmentTarget[] = filteredUsers
        .filter((user: any) => {
          // Strict validation - all fields must exist
          return user.id &&
                 user.first_name &&
                 user.email &&
                 user.team_id &&
                 user.team_name;
        })
        .map((user: any) => ({
          id: user.id.toString(),
          name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
          email: user.email,
          team: user.team_name,
          team_id: user.team_id,
          type: getTeamTypeFromId(user.team_id)
        }))
        // Sort targets by name for better UX
        .sort((a, b) => a.name.localeCompare(b.name));

      setAssignmentTargets(targets);

      // Production feedback - inform user if no assignees available
      if (targets.length === 0) {
        const roleLabel = roleType ? roleConfigs.find(r => r.id === roleType)?.name : 'assignable users';
        setError(`No ${roleLabel} found in the system. Please contact administrator.`);
      }

    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Failed to load assignment targets: ${error.message}`);
      setAssignmentTargets([]); // PRODUCTION: Clear targets on error, no fallback
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

      if (!Array.isArray(fetchedIncidents)) {
        throw new Error('Invalid incidents data format received from API');
      }

      console.log('AssignIncidents - Fetched incidents:', fetchedIncidents.length);

      // Convert base incidents to our assign incident format and sort by latest first
      const assignIncidents: AssignIncident[] = fetchedIncidents
        .filter((incident: any) => incident.id && incident.number) // Ensure required fields exist
        .map((incident: any) => ({
          id: incident.id,
          number: incident.number,
          shortDescription: incident.shortDescription || 'No description available',
          caller: incident.caller || 'Unknown',
          createdAt: incident.createdAt,
          updatedAt: incident.updatedAt,
          priority: incident.priority,
          assignedTo: incident.assigned_to?.name || incident.assignedTo || 'Unassigned',
          incidentstate: incident.incidentstate,
          category: incident.category,
          urgency: incident.urgency,
          assigned_to: incident.assigned_to,
          status: mapBackendStatusToFrontend(incident.incidentstate?.name || 'New')
        }))
        // Sort by creation date - LATEST FIRST (most recent incidents at top)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA; // Descending order - newest incidents first
        });

      if (assignIncidents.length === 0) {
        setError('No incidents found in the system');
      }

      setIncidents(assignIncidents);
      setFilteredIncidents(assignIncidents);
      setCurrentPage(1);

    } catch (error: any) {
      console.error('Fetch incidents error:', error);
      setError(error.message || 'Failed to load incidents from server');
      setIncidents([]);
      setFilteredIncidents([]);
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

  // Filter incidents - maintain latest first order after filtering
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

    // IMPORTANT: Maintain latest-first order after filtering
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Latest incidents first
    });

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, statusFilter, priorityFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Handle role selection with error clearing
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setSelectedAssignee(''); // Reset assignee when role changes
    setError(null); // Clear any previous errors
    fetchAssignmentTargets(roleId); // Fetch users for this role
  };

  // Assignment handlers with comprehensive validation
  const handleAssignIncident = (incident: AssignIncident) => {
    setSelectedIncident(incident);
    setSelectedRole('');
    setSelectedAssignee('');
    setAssignmentNotes('');
    setError(null); // Clear any previous errors
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

      // Validate incident ID and assignee ID are numeric
      const incidentId = parseInt(selectedIncident.id);
      const assigneeId = parseInt(assignee.id);

      if (isNaN(incidentId) || isNaN(assigneeId)) {
        setError('Invalid incident or assignee ID');
        return;
      }

      // Prepare assignment data
      const assignmentData = {
        incident_id: incidentId,
        assigned_to_id: assigneeId,
        notes: assignmentNotes.trim(),
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
          // Add authorization header if your API requires it
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to assign incident (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use default error message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Assignment result:', result);

      // Update local state and maintain latest-first order
      const updatedIncident: AssignIncident = {
        ...selectedIncident,
        assignedTo: assignee.name,
        assigned_to: {
          id: assigneeId,
          name: assignee.name,
          email: assignee.email,
          team_id: assignee.team_id
        },
        status: selectedRole === 'field_engineer' ? 'on_hold' : 'in_progress',
        updatedAt: new Date().toISOString()
      };

      // Update incidents and maintain latest-first sorting
      const updatedIncidents = incidents
        .map(incident => incident.id === selectedIncident.id ? updatedIncident : incident)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA; // Keep latest incidents first
        });

      setIncidents(updatedIncidents);
      setShowAssignModal(false);
      setSelectedIncident(null);
      setSelectedRole('');
      setSelectedAssignee('');
      setAssignmentNotes('');

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
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
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

  // Enhanced refresh functionality
  const handleRefresh = async () => {
    setError(null);
    await fetchData();
    if (selectedRole) {
      await fetchAssignmentTargets(selectedRole);
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
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading incidents...</span>
          </div>
          <h5 className="text-muted">Loading Incidents for Assignment</h5>
          <p className="text-muted">Fetching latest incidents from server...</p>
        </div>
      </Container>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 text-danger">⚠️ Unable to Load Incidents</h4>
                    <p className="text-muted mb-0">There was an error loading incident data</p>
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
        <Row>
          <Col xs={12}>
            <div className="alert alert-danger">
              <h5 className="alert-heading">🚨 System Error</h5>
              <p className="mb-3">{error}</p>
              <div className="d-flex gap-2">
                <Button color="danger" onClick={fetchData}>
                  🔄 Retry Loading
                </Button>
                <Button color="outline-danger" onClick={() => window.location.reload()}>
                  🔃 Refresh Page
                </Button>
              </div>
            </div>
          </Col>
        </Row>
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
                    <p className="text-muted mb-0">
                      Assign incidents to appropriate team members based on their roles
                      <span className="ms-2 badge bg-info">Latest incidents shown first</span>
                    </p>
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
                    <Button color="outline-primary" size="sm" onClick={handleRefresh}>
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
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    {incidents.length === 0 ? (
                      <div>
                        <p className="text-muted">No incidents found in the system.</p>
                        <Button color="primary" onClick={fetchData}>
                          🔄 Refresh Data
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted">No incidents found matching your criteria.</p>
                        <Button color="outline-primary" onClick={() => {
                          setStatusFilter('all');
                          setPriorityFilter('all');
                          setSearchTerm('');
                        }}>
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <small className="text-muted">
                        📅 Showing {filteredIncidents.length} incidents (latest first) |
                        Last updated: {new Date().toLocaleTimeString()}
                      </small>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>
                              <div className="d-flex align-items-center">
                                Incident
                                <small className="text-muted ms-1">(Latest First)</small>
                              </div>
                            </th>
                            <th>Category & Caller</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assignment</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentIncidents.map((incident, index) => (
                            <tr key={incident.id} className={index === 0 ? "table-warning" : ""}>
                              <td>
                                <div>
                                  <span className="fw-medium text-primary">
                                    {incident.number}
                                    {index === 0 && <span className="badge bg-success ms-2 small">Latest</span>}
                                  </span>
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
                                  <small className="text-muted">👤 {incident.caller}</small>
                                </div>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getPriorityColor(incident.urgency?.name || incident.priority || 'medium'),
                                  color: 'white'
                                }}>
                                  {incident.urgency?.name || incident.priority || 'Medium'}
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
                                        ✅ {incident.assigned_to.name}
                                      </span>
                                      <br />
                                      <small className="text-muted">
                                        {getTeamName(incident.assigned_to.team_id || 2)}
                                      </small>
                                    </div>
                                  ) : incident.assignedTo && incident.assignedTo !== 'Unassigned' ? (
                                    <div>
                                      <span className="fw-medium text-success">
                                        ✅ {incident.assignedTo}
                                      </span>
                                      <br />
                                      <small className="text-muted">Assigned</small>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-danger fw-medium">❌ Unassigned</span>
                                      <br />
                                      <small className="text-muted">Needs assignment</small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <small>
                                  <div>📅 {formatDateOnly(incident.createdAt)}</div>
                                  <div className="text-muted">⏰ {formatDateTime(incident.createdAt).split(' ')[1]}</div>
                                  {incident.updatedAt && incident.updatedAt !== incident.createdAt && (
                                    <div className="text-info small">Updated: {formatDateOnly(incident.updatedAt)}</div>
                                  )}
                                </small>
                              </td>
                              <td>
                                <Button
                                  color={incident.assigned_to?.name ? "warning" : "primary"}
                                  size="sm"
                                  onClick={() => handleAssignIncident(incident)}
                                  className="btn-sm"
                                >
                                  {incident.assigned_to?.name ? '🔄 Reassign' : '👤 Assign'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded">
                        <div>
                          <small className="text-muted">
                            📄 Page {currentPage} of {totalPages} |
                            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length} incidents
                          </small>
                        </div>
                        <div className="d-flex align-items-center">
                          <small className="text-muted me-3">Go to page:</small>
                          <div>{renderPaginationButtons()}</div>
                        </div>
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
                      <Badge className="ms-2" style={{ backgroundColor: getPriorityColor(selectedIncident.urgency?.name || selectedIncident.priority || 'medium'), color: 'white' }}>
                        {selectedIncident.urgency?.name || selectedIncident.priority || 'Medium'}
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

                {/* Step 2: Select User (only show if role is selected) */}
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
                        {assignmentTargets.length === 0 ? (
                          <div className="text-center p-3 text-muted">
                            <i className="fas fa-users-slash me-2"></i>
                            No {roleConfigs.find(r => r.id === selectedRole)?.name}s available in system
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
                      rows={3}
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Add any notes about this assignment..."
                      maxLength={500}
                    />
                    <small className="text-muted">
                      {assignmentNotes.length}/500 characters
                    </small>
                    {selectedRole === 'field_engineer' && (
                      <div className="alert alert-warning mt-2 py-2">
                        <small>
                          <strong>⚠️ Note:</strong> Assigning to Field Engineer will change incident status to "On Hold"
                        </small>
                      </div>
                    )}
                  </FormGroup>
                )}

                {/* Assignment Summary */}
                {selectedRole && selectedAssignee && (
                  <div className="alert alert-info mt-3">
                    <h6 className="alert-heading">📋 Assignment Summary</h6>
                    <div className="mb-2">
                      <strong>Incident:</strong> {selectedIncident.number} - {selectedIncident.shortDescription}
                    </div>
                    <div className="mb-2">
                      <strong>Assignee:</strong> {assignmentTargets.find(t => t.id === selectedAssignee)?.name}
                      ({assignmentTargets.find(t => t.id === selectedAssignee)?.team})
                    </div>
                    <div className="mb-2">
                      <strong>Role:</strong> {roleConfigs.find(r => r.id === selectedRole)?.name}
                    </div>
                    <div>
                      <strong>Status Change:</strong> {roleConfigs.find(r => r.id === selectedRole)?.statusChange}
                    </div>
                  </div>
                )}
              </Form>
            </>
          )}
        </ModalBody>
        <ModalFooter className="d-flex justify-content-between">
          <small className="text-muted">
            {selectedIncident && `Incident ID: ${selectedIncident.id} | Created: ${formatDateTime(selectedIncident.createdAt)}`}
          </small>
          <div>
            <Button color="secondary" onClick={() => setShowAssignModal(false)} className="me-2">
              Cancel
            </Button>
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
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AssignIncidents;
