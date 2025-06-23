'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Alert, ButtonGroup } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  getUserDashboard,
  getStoredToken
} from '../app/(MainBody)/services/userService';

import {
  fetchAllIncidentsForAssignment,
  getIncidentStats,
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../app/(MainBody)/services/incidentService';

// Import fake data from Expert Team Dashboard
// FAKE DATA FOR DEMO - DELETE THIS IMPORT WHEN REAL API IS READY
import { EXPERT_TEAM_FAKE_DATA } from '../app/(MainBody)/dashboard/expert_team/page';

interface AssignIncidentsProps {
  userType?: 'admin' | 'manager' | 'handler' | 'expert' | 'expert_team';
  onBack?: () => void;
}

interface AssignmentTarget {
  id: string;
  name: string;
  email: string;
  team: string;
  team_id: number;
}

const API_BASE_URL = 'https://apexwpc.apextechno.co.uk/api';

const AssignIncidents: React.FC<AssignIncidentsProps> = ({ userType, onBack }) => {
  const router = useRouter();

  // State management - using proper Incident interface
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Assignment targets
  const [assignmentTargets, setAssignmentTargets] = useState<AssignmentTarget[]>([]);
  const [allUsers, setAllUsers] = useState<AssignmentTarget[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper functions based on actual Incident interface
  const getIncidentNumber = (incident: Incident) => {
    return incident.incident_no;
  };

  const getShortDescription = (incident: Incident) => {
    return incident.short_description;
  };

  const getCategoryName = (incident: Incident) => {
    if (incident.category?.name) return incident.category.name;
    return 'Uncategorized';
  };

  const getCallerName = (incident: Incident) => {
    const fullName = incident.user.last_name
      ? `${incident.user.name} ${incident.user.last_name}`
      : incident.user.name;
    return fullName;
  };

  const getPriorityName = (incident: Incident) => {
    if (incident.priority?.name) return incident.priority.name;
    if (incident.priority && typeof incident.priority === 'string') return incident.priority;
    return incident.urgency?.name || 'Medium';
  };

  const getStatus = (incident: Incident): 'pending' | 'in_progress' | 'resolved' | 'closed' => {
    if (incident.status) return incident.status;
    const state = incident.incidentstate?.name?.toLowerCase();
    if (state === 'new') return 'pending';
    if (state === 'inprogress') return 'in_progress';
    if (state === 'resolved') return 'resolved';
    if (state === 'closed') return 'closed';
    return 'pending';
  };

  const getAssignedToName = (incident: Incident) => {
    if (!incident.assigned_to) return 'Unassigned';
    const fullName = incident.assigned_to.last_name
      ? `${incident.assigned_to.name} ${incident.assigned_to.last_name}`
      : incident.assigned_to.name;
    return fullName;
  };

  const getCreatedAt = (incident: Incident) => {
    return incident.created_at;
  };

  const isAssigned = (incident: Incident) => {
    return incident.assigned_to && incident.assigned_to.name;
  };

  // Fetch assignment targets from backend with role filtering
  const fetchAssignmentTargets = async () => {
    const token = getStoredToken();
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoadingTargets(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const users = result.data || result.users || result;


      if (!Array.isArray(users)) {
        console.error('Users data is not an array:', users);
        throw new Error('Invalid users data format from backend');
      }

      if (users.length === 0) {
        throw new Error('No users found in the system');
      }

      // Get current user role for filtering
      const currentUserRole = user?.team?.toLowerCase();

      // Define assignable roles based on current user
      let assignableRoles: string[] = [];

      if (currentUserRole?.includes('handler')) {
        // Handler can assign to: Handler, Field Engineer, Expert Team
        assignableRoles = ['handler', 'field', 'engineer', 'expert', 'water', 'pollution'];
      } else if (currentUserRole?.includes('manager')) {
        // Manager can assign to: Handler, Field Engineer, Expert Team
        assignableRoles = ['handler', 'field', 'engineer', 'expert', 'water', 'pollution'];
      } else {
        // Default: show all for other roles
        assignableRoles = ['handler', 'field', 'engineer', 'expert', 'water', 'pollution'];
      }

      // Map users to assignment targets with role filtering
      const targets: AssignmentTarget[] = users
        .map((user, index) => {
          const hasName = user.first_name;
          const hasEmail = user.email;

          if (!hasName || !hasEmail) {
            return null;
          }

          const fullName = user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`.trim()
            : user.first_name;

          const userId = user.id;
          const userTeam = (user.team_name || '').toLowerCase();

          // Filter based on assignable roles
          const isAssignable = assignableRoles.some(role => userTeam.includes(role));

          if (!isAssignable) {
            return null;
          }

          const target = {
            id: String(userId),
            name: fullName,
            email: user.email,
            team: user.team_name,
            team_id: user.team_id || 0
          };

          return target;
        })
        .filter(target => target !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      setAssignmentTargets(targets);
      setAllUsers(targets);

      // Extract unique teams from filtered users only
      const teams = [...new Set(targets.map(user => user.team).filter(Boolean))].sort();
      setAvailableTeams(teams);

      if (targets.length === 0) {
        setError('No assignable users found for your role');
      }

    } catch (error: any) {
      setError(`Failed to load users: ${error.message}`);
      setAssignmentTargets([]);
    } finally {
      setLoadingTargets(false);
    }
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

      let fetchedIncidents: Incident[] = [];

      if (userType?.includes('expert')) {
        console.log('🎯 AssignIncidents: Using expert team demo data');
        // FAKE DATA FOR DEMO - DELETE THIS WHEN REAL API IS READY
        // Using shared fake data from ExpertTeamDashboard for consistency
        // Remove this when fetchAllIncidentsForAssignment() API endpoint is implemented
        fetchedIncidents = EXPERT_TEAM_FAKE_DATA;
      } else {
        fetchedIncidents = await fetchAllIncidentsForAssignment();
      }

      // Sort by creation date - latest first
      fetchedIncidents.sort((a, b) => new Date(getCreatedAt(b)).getTime() - new Date(getCreatedAt(a)).getTime());

      // Count assigned vs unassigned
      const assignedCount = fetchedIncidents.filter(incident => isAssigned(incident)).length;
      const unassignedCount = fetchedIncidents.length - assignedCount;

      setIncidents(fetchedIncidents);
      setFilteredIncidents(fetchedIncidents);

    } catch (error: any) {
      setError(`Failed to load incidents: ${error.message}`);
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
    fetchAssignmentTargets();
  }, [router]);

  // Filter incidents
  useEffect(() => {
    let filtered = [...incidents];

    // Apply assignment status filter
    if (statusFilter === 'unassigned') {
      filtered = filtered.filter(incident => !isAssigned(incident));
    } else if (statusFilter === 'assigned') {
      filtered = filtered.filter(incident => isAssigned(incident));
    } else if (statusFilter !== 'all') {
      // Filter by specific status
      filtered = filtered.filter(incident => getStatus(incident) === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(incident =>
        getPriorityName(incident).toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident =>
        getShortDescription(incident).toLowerCase().includes(term) ||
        getIncidentNumber(incident).toLowerCase().includes(term) ||
        getCategoryName(incident).toLowerCase().includes(term) ||
        getCallerName(incident).toLowerCase().includes(term)
      );
    }

    // Always sort by creation date - latest first
    filtered.sort((a, b) => new Date(getCreatedAt(b)).getTime() - new Date(getCreatedAt(a)).getTime());

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, statusFilter, priorityFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Team selection handler
  const handleTeamChange = (selectedTeam: string) => {
    setSelectedTeam(selectedTeam);
    setSelectedAssignee(''); // Reset assignee selection

    if (!selectedTeam) {
      // Show all users if no team selected
      setAssignmentTargets(allUsers);
    } else {
      // Filter users by selected team
      const filteredUsers = allUsers.filter(user => user.team === selectedTeam);
      setAssignmentTargets(filteredUsers);
    }
  };

  // Assignment handlers
  const handleAssignIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setSelectedAssignee('');
    setSelectedTeam(''); // Reset team selection
    setAssignmentNotes('');
    setError(null);

    // Reset to show all users initially
    setAssignmentTargets(allUsers);

    setShowAssignModal(true);

    // Fetch fresh user data when opening assignment modal
    if (allUsers.length === 0) {
      fetchAssignmentTargets();
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedIncident || !selectedAssignee) {
      setError('Please select an assignee');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError('Authentication required');
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

      const assignmentData = {
        user_id: user.id,
        incident_id: parseInt(selectedIncident.id.toString()),
        from: user.id,
        to: parseInt(assignee.id),
        // notes: assignmentNotes.trim()
      };
      const response = await fetch(`${API_BASE_URL}/incident-handeler/assign-incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Assignment failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      const updatedIncident: Incident = {
        ...selectedIncident,
        assigned_to: {
          ...selectedIncident.assigned_to,
          id: parseInt(assignee.id),
          name: assignee.name.split(' ')[0],
          last_name: assignee.name.split(' ').slice(1).join(' ') || null,
          email: assignee.email,
          team_id: assignee.team_id
        } as any,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };

      const updatedIncidents = incidents
        .map(incident => incident.id === selectedIncident.id ? updatedIncident : incident)
        .sort((a, b) => new Date(getCreatedAt(b)).getTime() - new Date(getCreatedAt(a)).getTime());

      setIncidents(updatedIncidents);
      setShowAssignModal(false);
      setSelectedIncident(null);
      setSelectedAssignee('');
      setAssignmentNotes('');

      setSuccess(`Incident ${getIncidentNumber(selectedIncident)} successfully assigned to ${assignee.name}`);
      setTimeout(() => setSuccess(null), 5000);

    } catch (error: any) {
      setError(`Assignment failed: ${error.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    } else {
      const dashboardRoute = getUserDashboard(user?.team);
      router.push(dashboardRoute);
    }
  };

  const handleRefresh = () => {
    fetchData();
    fetchAssignmentTargets();
  };

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Incidents</h5>
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
                  </div>
                  <Button color="secondary" size="sm" onClick={handleBackToDashboard}>
                    ← Back to Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Success Alert */}
        {success && (
          <Row>
            <Col xs={12}>
              <Alert color="success" toggle={() => setSuccess(null)}>
                <strong>✅ Success!</strong> {success}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Error Alert */}
        {error && (
          <Row>
            <Col xs={12}>
              <Alert color="danger" toggle={() => setError(null)}>
                <strong>❌ Error!</strong> {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>🔍 Filter Incidents</h5>
                  <Button color="outline-primary" size="sm" onClick={handleRefresh}>
                    🔄 Refresh
                  </Button>
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
                        <option value="critical">Critical</option>
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
                <h5>📋 Incidents ({filteredIncidents.length} of {incidents.length})</h5>
              </CardHeader>
              <CardBody>
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">
                      {incidents.length === 0 ? 'No incidents found' : 'No incidents match the current filters'}
                    </p>
                    <Button color="primary" onClick={handleRefresh}>🔄 Refresh</Button>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Incident</th>
                            <th>Category & Caller</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assignment</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentIncidents.map((incident) => (
                            <tr key={incident.id}>
                              <td>
                                <div>
                                  <div className="fw-medium">{getIncidentNumber(incident)}</div>
                                  <small className="text-muted">👤 {getCallerName(incident)}</small>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium">{getCategoryName(incident)}</div>
                                </div>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getPriorityColor(getPriorityName(incident)),
                                  color: 'white'
                                }}>
                                  {getPriorityName(incident)}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getStatusColor(getStatus(incident)),
                                  color: 'white'
                                }}>
                                  {getStatus(incident).replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                {isAssigned(incident) ? (
                                  <div>
                                    <span className="fw-medium text-success">{getAssignedToName(incident)}</span>
                                    <br />
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-danger fw-medium">❌ Unassigned</span>
                                    <br />
                                    <small className="text-muted">Needs assignment</small>
                                  </div>
                                )}
                              </td>
                              <td>
                                <small>{formatDate(getCreatedAt(incident))}</small>
                              </td>
                              <td>
                                <Button
                                  color={isAssigned(incident) ? "warning" : "primary"}
                                  size="sm"
                                  onClick={() => handleAssignIncident(incident)}
                                >
                                  {isAssigned(incident) ? 'Reassign' : 'Assign'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-4">
                        <ButtonGroup>
                          <Button
                            outline
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                              key={page}
                              color={currentPage === page ? "primary" : "outline-primary"}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            outline
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </ButtonGroup>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Assignment Modal */}
      <Modal isOpen={showAssignModal} toggle={() => setShowAssignModal(false)} size="lg">
        <ModalHeader toggle={() => setShowAssignModal(false)}>
          Assign Incident - {selectedIncident ? getIncidentNumber(selectedIncident) : ''}
        </ModalHeader>
        <ModalBody>
          {selectedIncident && (
            <>
              <Form>
                <FormGroup>
                  <Label className="fw-bold">Select Team First</Label>
                  <Input
                    type="select"
                    value={selectedTeam}
                    onChange={(e) => handleTeamChange(e.target.value)}
                  >
                    <option value="">All Teams</option>
                    {availableTeams.map(team => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </Input>
                  <small className="text-muted mt-1">
                    {availableTeams.length} teams available
                  </small>
                </FormGroup>

                <FormGroup>
                  <Label className="fw-bold">Select Assignee</Label>
                  {loadingTargets ? (
                    <div className="text-center p-3">
                      <div className="spinner-border spinner-border-sm me-2"></div>
                      Loading users...
                    </div>
                  ) : assignmentTargets.length === 0 ? (
                    <div className="text-center p-3 text-muted">
                      {selectedTeam ?
                        `No users found in ${selectedTeam} team` :
                        'No users available for assignment'
                      }
                      <Button color="outline-primary" size="sm" className="mt-2" onClick={fetchAssignmentTargets}>
                        🔄 Retry Loading Users
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="select"
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        disabled={!selectedTeam && availableTeams.length > 1}
                      >
                        <option value="">
                          {selectedTeam ?
                            `Select from ${selectedTeam} team...` :
                            'Select an assignee...'
                          }
                        </option>
                        {assignmentTargets.map(target => (
                          <option key={target.id} value={target.id}>
                            {target.name} ({target.email})
                          </option>
                        ))}
                      </Input>
                      <small className="text-muted mt-1">
                        {assignmentTargets.length} users available
                        {selectedTeam && ` in ${selectedTeam} team`}
                      </small>
                    </>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>Assignment Notes (Optional)</Label>
                  <Input
                    type="textarea"
                    rows={3}
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any notes about this assignment..."
                  />
                </FormGroup>
              </Form>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={handleSaveAssignment}
            disabled={assigning || !selectedAssignee}
          >
            {assigning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Assigning...
              </>
            ) : (
              'Assign Incident'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AssignIncidents;
