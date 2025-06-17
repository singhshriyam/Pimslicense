'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Alert } from 'reactstrap'
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
  type: 'manager' | 'handler';
}

const AssignIncidents: React.FC<AssignIncidentsProps> = ({ userType, onBack }) => {
  const router = useRouter();

  // State management
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
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Bulk assignment state
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  // Filters - Default to showing ALL incidents
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock assignment targets (in real app, fetch from API)
  const [assignmentTargets, setAssignmentTargets] = useState<AssignmentTarget[]>([
    { id: '1', name: 'Sarah Wilson', email: 'sarah@company.com', team: 'Incident Handler', type: 'handler' },
    { id: '2', name: 'Mike Johnson', email: 'mike@company.com', team: 'Incident Handler', type: 'handler' },
    { id: '3', name: 'Emily Brown', email: 'emily@company.com', team: 'Incident Manager', type: 'manager' },
    { id: '4', name: 'David Lee', email: 'david@company.com', team: 'Incident Handler', type: 'handler' },
    { id: '5', name: 'Lisa Garcia', email: 'lisa@company.com', team: 'Incident Manager', type: 'manager' },
    { id: '6', name: 'Tom Anderson', email: 'tom@company.com', team: 'Incident Handler', type: 'handler' },
    { id: '7', name: 'Maria Rodriguez', email: 'maria@company.com', team: 'Incident Handler', type: 'handler' },
    { id: '8', name: 'James Taylor', email: 'james@company.com', team: 'Incident Handler', type: 'handler' }
  ]);

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

      // Fetch all incidents for assignment
      const fetchedIncidents = await fetchAllIncidents();
      console.log('AssignIncidents - Fetched incidents:', fetchedIncidents.length);

      setIncidents(fetchedIncidents);
      setFilteredIncidents(fetchedIncidents);
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
  }, [router, userType]);

  // Filter incidents
  useEffect(() => {
    let filtered = [...incidents];

    // Status filter
    if (statusFilter === 'unassigned') {
      filtered = filtered.filter(incident =>
        !incident.assignedTo ||
        incident.assignedTo === 'Unassigned' ||
        incident.assignedTo.trim() === ''
      );
    } else if (statusFilter === 'assigned') {
      filtered = filtered.filter(incident =>
        incident.assignedTo &&
        incident.assignedTo !== 'Unassigned' &&
        incident.assignedTo.trim() !== ''
      );
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(incident =>
        incident.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Search filter
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
  }, [incidents, statusFilter, priorityFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Assignment handlers
  const handleAssignIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setSelectedAssignee('');
    setAssignmentNotes('');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedIncident || !selectedAssignee) {
      alert('Please select an assignee');
      return;
    }

    try {
      setAssigning(true);

      // Find the selected assignee details
      const assignee = assignmentTargets.find(target => target.id === selectedAssignee);
      if (!assignee) {
        alert('Invalid assignee selected');
        return;
      }

      // Update the incident (in real app, make API call)
      const updatedIncident: Incident = {
        ...selectedIncident,
        assignedTo: assignee.name,
        status: 'in_progress' as any
      };

      // Update local state
      const updatedIncidents = incidents.map(incident =>
        incident.id === selectedIncident.id ? updatedIncident : incident
      );

      setIncidents(updatedIncidents);
      setShowAssignModal(false);
      setSelectedIncident(null);
      setSuccess(`Incident ${selectedIncident.number} successfully assigned to ${assignee.name}`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (error: any) {
      console.error('Error assigning incident:', error);
      alert('Failed to assign incident: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  // Bulk assignment handlers
  const handleSelectIncident = (incidentId: string) => {
    if (selectedIncidents.includes(incidentId)) {
      setSelectedIncidents(selectedIncidents.filter(id => id !== incidentId));
    } else {
      setSelectedIncidents([...selectedIncidents, incidentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIncidents.length === currentIncidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(currentIncidents.map(incident => incident.id));
    }
  };

  const handleBulkAssign = () => {
    if (selectedIncidents.length === 0) {
      alert('Please select incidents to assign');
      return;
    }
    setSelectedAssignee('');
    setAssignmentNotes('');
    setShowBulkAssignModal(true);
  };

  const handleSaveBulkAssignment = async () => {
    if (!selectedAssignee) {
      alert('Please select an assignee');
      return;
    }

    try {
      setAssigning(true);

      // Find the selected assignee details
      const assignee = assignmentTargets.find(target => target.id === selectedAssignee);
      if (!assignee) {
        alert('Invalid assignee selected');
        return;
      }

      // Update multiple incidents
      const updatedIncidents = incidents.map(incident => {
        if (selectedIncidents.includes(incident.id)) {
          return {
            ...incident,
            assignedTo: assignee.name,
            status: 'in_progress' as any
          };
        }
        return incident;
      });

      setIncidents(updatedIncidents);
      setShowBulkAssignModal(false);
      setSelectedIncidents([]);
      setSuccess(`${selectedIncidents.length} incidents successfully assigned to ${assignee.name}`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (error: any) {
      console.error('Error bulk assigning incidents:', error);
      alert('Failed to assign incidents: ' + error.message);
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
                    <h4 className="mb-1">📋 Assign Incidents</h4>
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
              <Alert color="success" className="mb-4">
                <strong>Success!</strong> {success}
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
                  <h5>Filter & Assign</h5>
                  <div>
                    {/* {selectedIncidents.length > 0 && (
                      <Button color="primary" size="sm" onClick={handleBulkAssign} className="me-2">
                        Bulk Assign ({selectedIncidents.length})
                      </Button>
                    )} */}
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
                        <option value="resolved">Resolved</option>
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
                        <option value="critical">Critical</option>
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
                  <h5>Incidents for Assignment ({filteredIncidents.length})</h5>
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
                            {/* <th>
                              <input
                                type="checkbox"
                                checked={selectedIncidents.length === currentIncidents.length && currentIncidents.length > 0}
                                onChange={handleSelectAll}
                              />
                            </th> */}
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
                              {/* <td>
                                <input
                                  type="checkbox"
                                  checked={selectedIncidents.includes(incident.id)}
                                  onChange={() => handleSelectIncident(incident.id)}
                                />
                              </td> */}
                              <td>
                                <div>
                                  <span className="fw-medium text-primary">{incident.number}</span>
                                  <br />
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium" style={{ maxWidth: '200px' }}>
                                    {incident.category}
                                  </div>
                                  <small className="text-muted">Caller: {incident.caller}</small>
                                </div>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getPriorityColor(incident.priority),
                                  color: 'white'
                                }}>
                                  {incident.priority}
                                </Badge>
                              </td>
                              <td>
                                <Badge style={{
                                  backgroundColor: getStatusColor(incident.status || 'pending'),
                                  color: 'white'
                                }}>
                                  {(incident.status || 'pending').replace('_', ' ')}
                                </Badge>
                              </td>
                              <td>
                                <div>
                                  {incident.assignedTo && incident.assignedTo !== 'Unassigned' && incident.assignedTo.trim() !== '' ? (
                                    <div>
                                      <span className="fw-medium text-success">{incident.assignedTo}</span>
                                      <br />
                                      <small className="text-muted">Assigned</small>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-warning fw-medium">Unassigned</span>
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
                                  {incident.assignedTo && incident.assignedTo !== 'Unassigned' && incident.assignedTo.trim() !== '' ? 'Reassign' : 'Assign'}
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
          {selectedIncident?.assignedTo && selectedIncident.assignedTo !== 'Unassigned' && selectedIncident.assignedTo.trim() !== ''
            ? `Reassign Incident - ${selectedIncident?.number}`
            : `Assign Incident - ${selectedIncident?.number}`}
        </ModalHeader>
        <ModalBody>
          {selectedIncident && (
            <>
              <div className="mb-4 p-3 text-grey rounded">
                <Row>
                  <Col md={6}>
                    <div><strong>Incident:</strong> {selectedIncident.number}</div>
                    <div><strong>Priority:</strong>
                      <Badge className="ms-2" style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }}>
                        {selectedIncident.priority}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div><strong>Category:</strong> {selectedIncident.category}</div>
                    <div><strong>Caller:</strong> {selectedIncident.caller}</div>
                  </Col>
                  <Col xs={12} className="mt-2">
                    <div><strong>Description:</strong> {selectedIncident.shortDescription}</div>
                    {selectedIncident.assignedTo && selectedIncident.assignedTo !== 'Unassigned' && selectedIncident.assignedTo.trim() !== '' && (
                      <div className="mt-2">
                        <strong>Currently Assigned To:</strong>
                        <Badge color="info" className="ms-2">{selectedIncident.assignedTo}</Badge>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              <Form>
                <FormGroup>
                  <Label for="assigneeSelect"><strong>Assign To:</strong></Label>
                  <Input
                    type="select"
                    id="assigneeSelect"
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
                </FormGroup>

                <FormGroup>
                  <Label for="assignmentNotes">Assignment Notes (Optional):</Label>
                  <Input
                    type="textarea"
                    id="assignmentNotes"
                    rows={4}
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
          <Button
            color="primary"
            onClick={handleSaveAssignment}
            disabled={assigning || !selectedAssignee}
          >
            {assigning ? 'Assigning...' : (selectedIncident?.assignedTo && selectedIncident.assignedTo !== 'Unassigned' && selectedIncident.assignedTo.trim() !== '' ? 'Reassign Incident' : 'Assign Incident')}
          </Button>
          <Button color="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal isOpen={showBulkAssignModal} toggle={() => setShowBulkAssignModal(false)} size="lg">
        <ModalHeader toggle={() => setShowBulkAssignModal(false)}>
          Bulk Assign {selectedIncidents.length} Incidents
        </ModalHeader>
        <ModalBody>
          <div className="mb-4 p-3 bg-light rounded">
            <div><strong>Selected Incidents:</strong> {selectedIncidents.length}</div>
            <div className="mt-2">
              {selectedIncidents.slice(0, 5).map(incidentId => {
                const incident = incidents.find(inc => inc.id === incidentId);
                return incident ? (
                  <div key={incidentId} className="text-sm">
                    • {incident.number} - {incident.shortDescription}
                    {incident.assignedTo && incident.assignedTo !== 'Unassigned' && incident.assignedTo.trim() !== '' && (
                      <span className="text-muted"> (Currently: {incident.assignedTo})</span>
                    )}
                  </div>
                ) : null;
              })}
              {selectedIncidents.length > 5 && (
                <div className="text-muted">...and {selectedIncidents.length - 5} more</div>
              )}
            </div>
          </div>

          <Form>
            <FormGroup>
              <Label for="bulkAssigneeSelect"><strong>Assign All To:</strong></Label>
              <Input
                type="select"
                id="bulkAssigneeSelect"
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
            </FormGroup>

            <FormGroup>
              <Label for="bulkAssignmentNotes">Assignment Notes (Optional):</Label>
              <Input
                type="textarea"
                id="bulkAssignmentNotes"
                rows={4}
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes about this bulk assignment..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleSaveBulkAssignment}
            disabled={assigning || !selectedAssignee}
          >
            {assigning ? 'Assigning...' : `Assign ${selectedIncidents.length} Incidents`}
          </Button>
          <Button color="secondary" onClick={() => setShowBulkAssignModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AssignIncidents;
