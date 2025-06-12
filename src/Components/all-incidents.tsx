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

const AllIncidents = () => {
  const router = useRouter();

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    short_description: '',
    description: '',
    address: ''
  });

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

        console.log('Fetching incidents...');

        // Fetch incidents using existing service - NO parameters needed
        const incidents = await fetchIncidentsAPI();

        console.log('Fetched incidents:', incidents);

        // Set the incidents data
        setAllIncidents(incidents);
        setFilteredIncidents(incidents);

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
  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  // Handle edit incident
  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setEditFormData({
      short_description: incident.shortDescription,
      description: incident.description,
      address: incident.address || ''
    });
    setShowEditModal(true);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const incidents = await fetchIncidentsAPI();
      setAllIncidents(incidents);
      setFilteredIncidents(incidents);
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
                    <small className="text-muted">
                      {allIncidents.length === 0
                        ? "You haven't created any incidents yet. Go back to dashboard to create your first incident."
                        : "Try adjusting your search filters."}
                    </small>
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
                      <strong>Assigned To:</strong>
                      <span className="ms-2">{selectedIncident.assignedTo}</span>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllIncidents;
