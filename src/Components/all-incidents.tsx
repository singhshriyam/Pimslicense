// src/components/AllIncidents.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Input, Badge } from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  Incident,
  fetchIncidentsAPI,
  getPriorityColor,
  getStatusColor,
  formatDate,
  getIncidentStats
} from '../../src/app/(MainBody)/services/incidentService';

import {
  getStoredUserTeam,
  getStoredUserName,
  getStoredUserId,
  mapTeamToRole,
  isAuthenticated
} from '../../src/app/(MainBody)/services/userService';

// Updated interface to match your API response
interface ApiIncident {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    team_id?: number;
  };
  category_id: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  subcategory_id: number | null;
  subcategory: {
    id: number;
    name: string;
  } | null;
  contact_type: {
    id: number;
    name: string;
  };
  impact: {
    id: number;
    name: string;
  } | null;
  priority: {
    id: number;
    name: string;
  } | null;
  urgency: {
    id: number;
    name: string;
  };
  assigned_to: {
    id: number;
    name: string;
    email: string;
  } | null;
  incidentstate: {
    id: number;
    name: string;
  };
  incident_no: string;
  opened_at: string;
  closed_at: string | null;
  short_description: string;
  description: string;
  address: string | null;
  lat: string | null;
  lng: string | null;
  created_at: string;
  updated_at: string;
}

// Extended Incident interface to include rawData
interface ExtendedIncident extends Incident {
  rawData?: ApiIncident;
}

const AllIncidents = () => {
  const router = useRouter();

  const [allIncidents, setAllIncidents] = useState<ExtendedIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<ExtendedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [selectedIncident, setSelectedIncident] = useState<ExtendedIncident | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    short_description: '',
    description: '',
    address: ''
  });

  const getAuthToken = (): string | null => {
    // Check multiple possible storage locations for the token
    const possibleKeys = [
      'authToken',
      'token',
      'access_token',
      'bearerToken',
      'jwt',
      'auth_token',
      'accessToken'
    ];

    // Check localStorage first
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        return token;
      }
    }

    // Check sessionStorage
    for (const key of possibleKeys) {
      const token = sessionStorage.getItem(key);
      if (token) {
        return token;
      }
    }

    return null;
  };

  // Since fetchIncidentsAPI already transforms data, we just need to ensure it has rawData
  const normalizeIncidentData = (incidents: any[]): ExtendedIncident[] => {
    return incidents.map((incident: any) => {
      // The fetchIncidentsAPI already returns transformed Incident objects
      // We just need to ensure each has rawData for edit functionality
      const normalizedIncident: ExtendedIncident = {
        ...incident,
        // Create rawData from the transformed incident for edit functionality
        rawData: {
          id: incident.id,
          incident_no: incident.number,
          short_description: incident.shortDescription,
          description: incident.description,
          incidentstate: {
            id: incident.status === 'pending' ? 1 : incident.status === 'in_progress' ? 2 : incident.status === 'resolved' ? 3 : 4,
            name: incident.status
          },
          urgency: { id: 2, name: incident.urgency || 'Medium' },
          created_at: incident.createdAt,
          updated_at: incident.updatedAt,
          user: { name: incident.reportedByName || 'Unknown' },
          category: incident.category ? { name: incident.category } : null,
          subcategory: incident.subCategory ? { name: incident.subCategory } : null,
          assigned_to: incident.assignedTo !== 'Unassigned' ? { name: incident.assignedTo } : null,
          contact_type: { name: incident.contactType || 'Unknown' },
          impact: { name: incident.impact || 'Unknown' }
        }
      };

      return normalizedIncident;
    });
  };

  // Updated handleUpdateIncident function with proper Bearer Token authentication
  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;

    try {
      // Get user information
      const storedUserId = getStoredUserId();
      const userRole = mapTeamToRole(getStoredUserTeam() || 'user');

      // Get the Bearer token
      const authToken = getAuthToken();

      if (!authToken) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };

      // Get the proper IDs from the incident data with safe fallbacks
      const actualIncidentId = selectedIncident.rawData?.id || selectedIncident.id;
      const actualUrgencyId = selectedIncident.rawData?.urgency?.id || 2;

      // END USERS SHOULD NOT CHANGE STATUS - keep the current state
      const currentStateId = selectedIncident.rawData?.incidentstate?.id || 1; // Default to 'new' if not found

      // Validate that we have the required data
      if (!actualIncidentId) {
        alert('Cannot update incident: Missing incident ID.');
        return;
      }

      // Only allow end users to update description and address, NOT status
      const requestBody = {
        user_id: storedUserId || 6,
        incident_id: actualIncidentId,
        urgency_id: actualUrgencyId,
        incidentstate_id: currentStateId, // Keep current status - don't allow end users to change
        short_description: editFormData.short_description,
        description: editFormData.description
      };

      const response = await fetch('https://apexwpc.apextechno.co.uk/api/end-user/update-incident', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Wait a moment for the API to update, then refresh
        setTimeout(async () => {
          await handleRefresh();
          setShowEditModal(false);
          setSelectedIncident(null);
          alert('Incident updated successfully! Note: Status changes require administrator approval.');
        }, 1000);
      } else {
        const errorMessage = data.message || data.error || `API Error: ${response.status} - ${response.statusText}`;
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('Error updating incident:', error);

      if (error.message.includes('401') || error.message.includes('Unauthenticated')) {
        alert('Authentication failed. Please log in again.');
        // Clear potentially invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('token');
      } else if (error.message.includes('403')) {
        alert('You do not have permission to update this incident.');
      } else {
        alert('Failed to update incident: ' + error.message);
      }
    }
  };

  // Fetch incidents using existing service
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!isAuthenticated()) {
          setError('Please log in to view incidents');
          return;
        }

        // Get user info for API call
        const storedTeam = getStoredUserTeam();
        const storedName = getStoredUserName();
        const userEmail = storedName ? `${storedName.toLowerCase()}@gmail.com` : 'user@example.com';
        const userRole = mapTeamToRole(storedTeam || 'user');

        // Fetch incidents using existing service
        const incidents = await fetchIncidentsAPI(userEmail, userRole);

        // Always normalize the data regardless of format
        let normalizedIncidents: ExtendedIncident[] = [];
        if (incidents && incidents.length > 0) {
          normalizedIncidents = normalizeIncidentData(incidents);
        }

        setAllIncidents(normalizedIncidents);
        setFilteredIncidents(normalizedIncidents);

      } catch (error: any) {
        console.error('Error fetching incidents:', error);
        setError(error.message || 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter incidents based on status, priority, and search term
  useEffect(() => {
    let filtered = [...allIncidents];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(incident => incident.priority === priorityFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIncidents(filtered);
  }, [allIncidents, statusFilter, priorityFilter, searchTerm]);

  // Handle view incident
  const handleViewIncident = (incident: ExtendedIncident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  // Handle edit incident
  const handleEditIncident = (incident: ExtendedIncident) => {
    setSelectedIncident(incident);
    setEditFormData({
      short_description: incident.shortDescription,
      description: incident.description,
      address: incident.address || ''
    });
    setShowEditModal(true);
  };

  const handleRefresh = async () => {
    const storedTeam = getStoredUserTeam();
    const storedName = getStoredUserName();
    const userEmail = storedName ? `${storedName.toLowerCase()}@gmail.com` : 'user@example.com';
    const userRole = mapTeamToRole(storedTeam || 'user');

    try {
      setLoading(true);

      const incidents = await fetchIncidentsAPI(userEmail, userRole);

      // Always normalize the data regardless of format
      let normalizedIncidents: ExtendedIncident[] = [];
      if (incidents && incidents.length > 0) {
        normalizedIncidents = normalizeIncidentData(incidents);
      }

      setAllIncidents(normalizedIncidents);
      setFilteredIncidents(normalizedIncidents);
    } catch (error: any) {
      console.error('Refresh error:', error);
      setError(error.message || 'Failed to refresh incidents');
    } finally {
      setLoading(false);
    }
  };

  const stats = getIncidentStats(filteredIncidents);

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
          <Button color="link" onClick={handleRefresh} className="p-0 ms-2">
            Try again
          </Button>
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
                    <small className="text-muted">Manage and track all incidents</small>
                  </div>
                  <div>
                    <Button color="secondary" size="sm" onClick={() => router.push('/dashboard/enduser')}>
                      ← Back to Dashboard
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row>
          <Col md={3}>
            <Card className="text-center">
              <CardBody>
                <h5 className="text-primary">{stats.total}</h5>
                <small>Total Incidents</small>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <CardBody>
                <h5 className="text-warning">{stats.pending}</h5>
                <small>Pending</small>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <CardBody>
                <h5 className="text-info">{stats.inProgress}</h5>
                <small>In Progress</small>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <CardBody>
                <h5 className="text-success">{stats.resolved}</h5>
                <small>Resolved</small>
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
                  <Button color="outline-primary" size="sm" onClick={handleRefresh}>
                    🔄 Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={4}>
                    <label>Search</label>
                    <Input
                      type="text"
                      placeholder="Search by description, number, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <label>Status</label>
                    <Input
                      type="select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">New/Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Input>
                  </Col>
                  <Col md={4}>
                    <label>Priority/Urgency</label>
                    <Input
                      type="select"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Significant">Significant</option>
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
                <h5>Incidents ({filteredIncidents.length})</h5>
              </CardHeader>
              <CardBody>
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No incidents found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th style={{ width: '16.66%' }}>Incident</th>
                          <th style={{ width: '16.66%' }}>Category</th>
                          <th style={{ width: '16.66%' }}>Status</th>
                          <th style={{ width: '16.66%' }}>Assigned To</th>
                          <th style={{ width: '16.66%' }}>Created</th>
                          <th style={{ width: '16.7%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIncidents.map((incident) => (
                          <tr key={incident.id}>
                            <td style={{ width: '16.66%' }}>
                              <span className="fw-medium text-primary">{incident.number}</span>
                            </td>
                            <td style={{ width: '16.66%' }}>
                              <div>{incident.category}</div>
                            </td>
                            <td style={{ width: '16.66%' }}>
                              <Badge
                                style={{ backgroundColor: getStatusColor(incident.status || 'pending'), color: 'white' }}
                              >
                                {(incident.status || 'pending').replace('_', ' ')}
                              </Badge>
                            </td>
                            <td style={{ width: '16.66%' }}>
                              <small>{incident.assignedTo}</small>
                            </td>
                            <td style={{ width: '16.66%' }}>
                              <small>
                                {incident.createdAt && incident.createdAt !== 'Invalid Date'
                                  ? new Date(incident.createdAt).toLocaleDateString()
                                  : 'Unknown'}
                              </small>
                            </td>
                            <td style={{ width: '16.7%' }}>
                              <Button
                                color="outline-info"
                                size="sm"
                                onClick={() => handleViewIncident(incident)}
                                className="me-1"
                                style={{ minWidth: '70px' }}
                              >
                                👁 View
                              </Button>
                              <Button
                                color="outline-primary"
                                size="sm"
                                onClick={() => handleEditIncident(incident)}
                                style={{ minWidth: '70px' }}
                              >
                                ✏️ Edit
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

      {/* View Modal */}
      {showViewModal && selectedIncident && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Incident Details - {selectedIncident.number}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Incident Number:</strong>
                      <span className="ms-2 text-primary fw-medium">{selectedIncident.number}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Short Description:</strong>
                      <span className="ms-2">{selectedIncident.shortDescription}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Category:</strong>
                      <span className="ms-2">{selectedIncident.category}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Sub Category:</strong>
                      <span className="ms-2">{selectedIncident.subCategory}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Contact Type:</strong>
                      <span className="ms-2">{selectedIncident.contactType}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Impact:</strong>
                      <span className="ms-2">{selectedIncident.impact}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Priority:</strong>
                      <Badge
                        className="ms-2"
                        style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }}
                      >
                        {selectedIncident.priority}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <strong>Status:</strong>
                      <Badge
                        className="ms-2"
                        style={{ backgroundColor: getStatusColor(selectedIncident.status || 'pending'), color: 'white' }}
                      >
                        {(selectedIncident.status || 'pending').replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <strong>Urgency:</strong>
                      <span className="ms-2">{selectedIncident.urgency}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Assigned To:</strong>
                      <span className="ms-2">{selectedIncident.assignedTo}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Reported By:</strong>
                      <span className="ms-2">{selectedIncident.reportedByName}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Created:</strong>
                      <span className="ms-2">
                        {selectedIncident.createdAt && selectedIncident.createdAt !== 'Invalid Date'
                          ? formatDate(selectedIncident.createdAt)
                          : 'Unknown'}
                      </span>
                    </div>
                  </Col>
                  <Col xs={12}>
                    <hr />
                    <div className="mb-3">
                      <strong>Detailed Description:</strong>
                      <p className="mt-2 p-3 bg-light rounded text-dark">{selectedIncident.description}</p>
                    </div>
                    {selectedIncident.address && (
                      <div className="mb-3">
                        <strong>Address:</strong>
                        <p className="mt-2 p-3 bg-light rounded text-dark">{selectedIncident.address}</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditIncident(selectedIncident);
                  }}
                >
                  Edit Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIncident && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Incident - {selectedIncident.number}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <small><strong>Note:</strong> As an end user, you can only update the description and address. Status and priority changes require admin approval.</small>
                </div>
                <Row>
                  <Col md={12}>
                    <div className="mb-3">
                      <label className="form-label"><strong>Short Description</strong></label>
                      <Input
                        type="text"
                        value={editFormData.short_description}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          short_description: e.target.value
                        })}
                        placeholder="Enter short description"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label"><strong>Description</strong></label>
                      <Input
                        type="textarea"
                        rows={4}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          description: e.target.value
                        })}
                        placeholder="Enter detailed description"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label"><strong>Address</strong></label>
                      <Input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          address: e.target.value
                        })}
                        placeholder="Enter address"
                      />
                    </div>
                  </Col>
                </Row>

                {/* Display current incident info - READ ONLY for end users */}
                <hr />
                <div className="alert alert-secondary">
                  <h6>Current Incident Information (Read Only)</h6>
                  <Row>
                    <Col md={6}>
                      <div className="mb-2">
                        <strong>Current Status:</strong>
                        <Badge className="ms-2" style={{ backgroundColor: getStatusColor(selectedIncident.status || 'pending'), color: 'white' }}>
                          {(selectedIncident.status || 'pending').replace('_', ' ')}
                        </Badge>
                        <small className="d-block text-muted">Status can only be changed by administrators</small>
                      </div>
                      <div className="mb-2">
                        <strong>Priority:</strong>
                        <Badge className="ms-2" style={{ backgroundColor: getPriorityColor(selectedIncident.priority), color: 'white' }}>
                          {selectedIncident.priority}
                        </Badge>
                        <small className="d-block text-muted">Priority is set by system rules</small>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-2">
                        <strong>Assigned To:</strong>
                        <span className="ms-2">{selectedIncident.assignedTo}</span>
                        <small className="d-block text-muted">Assignment is managed by administrators</small>
                      </div>
                      <div className="mb-2">
                        <strong>Created:</strong>
                        <span className="ms-2">{formatDate(selectedIncident.createdAt)}</span>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateIncident}
                  disabled={!editFormData.short_description.trim() || !editFormData.description.trim()}
                >
                  Update Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllIncidents;
