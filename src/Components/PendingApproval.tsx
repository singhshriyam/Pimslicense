'use client'
import React, { useState, useEffect } from 'react'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Button, Input, Badge, Alert, Modal, ModalHeader, ModalBody, ModalFooter,
  Nav, NavItem, NavLink, TabContent, TabPane
} from 'reactstrap'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  isAuthenticated,
  getUserDashboard,
  User,
  getStoredToken
} from '../app/(MainBody)/services/userService'
import {
  getStatusColor,
  getPriorityColor,
  type Incident
} from '../app/(MainBody)/services/incidentService'
import {
  fetchCategories,
  fetchContactTypes,
  fetchImpacts,
  fetchUrgencies,
  fetchIncidentStates,
  fetchUsers
} from '../app/(MainBody)/services/masterService'
import EvidenceTab from '../Components/tabs/EvidenceTab'

interface PendingApprovalProps {
  userType?: 'expert_team'
  onBack?: () => void
}

interface PendingApprovalIncident {
  id: number
  incident_id?: number
  incidentstate_id: number
  site_id: number
  asset_id: number
  category_id: number
  subcategory_id?: number
  contact_type_id: number
  impact_id: number
  priority_id?: number
  urgency_id: number
  assigned_to_id: number
  user_id?: number
  type: number
  short_description: string
  description: string
  root_cause_analysis?: string
  conclusion?: string
  narration?: string
  is_approved: number
  is_email: number
  approved_at: string | null
  approved_by_id: number | null
  pass_code: string
  updated_by_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const PendingApproval: React.FC<PendingApprovalProps> = ({
  userType,
  onBack
}) => {
  const router = useRouter()

  // State Management
  const [pendingIncidents, setPendingIncidents] = useState<PendingApprovalIncident[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<PendingApprovalIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Master data for ID to name mapping
  const [masterData, setMasterData] = useState({
    categories: [] as Array<{id: number, name: string}>,
    contactTypes: [] as Array<{id: number, name: string}>,
    impacts: [] as Array<{id: number, name: string}>,
    urgencies: [] as Array<{id: number, name: string}>,
    incidentStates: [] as Array<{id: number, name: string}>,
    users: [] as Array<{id: number, first_name: string, last_name: string | null, email: string}>,
    loaded: false
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<PendingApprovalIncident | null>(null)
  const [processingApproval, setProcessingApproval] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  // Safe function for rendering values
  const safe = (value: any): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  // Data Helpers - Production ready
  const getCategoryName = (incident: PendingApprovalIncident): string => {
    if (!incident.category_id) {
      return ''
    }

    const category = masterData.categories.find(cat => cat.id === incident.category_id);
    return category?.name || '';
  };

  const getPriorityName = (incident: PendingApprovalIncident): string => {
    if (incident.impact_id) {
      const impact = masterData.impacts.find(imp => imp.id === incident.impact_id)
      return impact?.name || '';
    }
    if (incident.urgency_id) {
      const urgency = masterData.urgencies.find(urg => urg.id === incident.urgency_id)
      return urgency?.name || '';
    }
    return ''
  }

  const getCallerName = (incident: PendingApprovalIncident): string => {
    return ''
  }

  const getIncidentNumber = (incident: PendingApprovalIncident): string => {
    if (incident.incident_id) {
      return `IN${String(incident.incident_id).padStart(4, '0')}`
    }
    if (incident.id) {
      return `IN${String(incident.id).padStart(4, '0')}`
    }
    return ''
  }

  const getAssignedTo = (incident: PendingApprovalIncident): string => {
    if (!incident.assigned_to_id) return ''
    const user = masterData.users.find(u => u.id === incident.assigned_to_id)
    if (user) {
      const fullName = user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name
      return fullName || user.email || ''
    }
    return ''
  }

  const getStatus = (incident: PendingApprovalIncident): string => {
    if (!incident.incidentstate_id) return ''
    const state = masterData.incidentStates.find(st => st.id === incident.incidentstate_id)
    return state?.name || '';
  }

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return '-'
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return '-'
    }
  }

  // Load master data for ID to name mapping
  const loadMasterData = async () => {
    try {
      const [categoriesRes, contactTypesRes, impactsRes, urgenciesRes, incidentStatesRes, usersRes] =
        await Promise.all([
          fetchCategories(),
          fetchContactTypes(),
          fetchImpacts(),
          fetchUrgencies(),
          fetchIncidentStates(),
          fetchUsers()
        ])

      setMasterData({
        categories: categoriesRes.data || [],
        contactTypes: contactTypesRes.data || [],
        impacts: impactsRes.data || [],
        urgencies: urgenciesRes.data || [],
        incidentStates: incidentStatesRes.data || [],
        users: usersRes.data || [],
        loaded: true
      })
    } catch (error) {
      setMasterData(prev => ({ ...prev, loaded: true }))
    }
  }

  // Fetch pending approval incidents
  const fetchPendingApprovals = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUser = getCurrentUser()
      if (!currentUser) {
        router.replace('/auth/login')
        return
      }

      setUser(currentUser)

      const token = getStoredToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('https://apexwpc.apextechno.co.uk/api/admin/pending-approval', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch pending approvals: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        const sortedIncidents = result.data.sort((a: PendingApprovalIncident, b: PendingApprovalIncident) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setPendingIncidents(sortedIncidents)
        setFilteredIncidents(sortedIncidents)
      } else {
        setPendingIncidents([])
        setFilteredIncidents([])
      }

    } catch (error: any) {
      setError(error.message || 'Failed to load pending approvals')
      setPendingIncidents([])
      setFilteredIncidents([])
    } finally {
      setLoading(false)
    }
  }

  // Handle approval/rejection
  const handleApprovalAction = async (action: 'approve' | 'reject', incident: PendingApprovalIncident) => {
    try {
      setProcessingApproval(true)
      const token = getStoredToken()

      if (!token) {
        throw new Error('Authentication token not found')
      }

      // This is a placeholder - need to implement the actual approval API endpoint
      const endpoint = action === 'approve'
        ? '/api/admin/approve-incident'
        : '/api/admin/reject-incident'

      const requestBody = {
        incident_id: incident.id,
        action: action
      }

      const response = await fetch(`https://apexwpc.apextechno.co.uk${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} incident: ${response.status}`)
      }

      // Remove the incident from pending list
      setPendingIncidents(prev => prev.filter(inc => inc.id !== incident.id))
      setFilteredIncidents(prev => prev.filter(inc => inc.id !== incident.id))

      // Show success message
      setSuccess(`Incident ${action}d successfully`)

    } catch (error: any) {
      setError(error.message || `Failed to ${action} incident`)
    } finally {
      setProcessingApproval(false)
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisibleButtons = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2))
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1)

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1)
    }

    if (currentPage > 1) {
      buttons.push(
        <Button
          key="prev"
          color="outline-primary"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          className="me-1"
        >
          ‹
        </Button>
      )
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          color={i === currentPage ? "primary" : "outline-primary"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="me-1"
        >
          {i}
        </Button>
      )
    }

    if (currentPage < totalPages) {
      buttons.push(
        <Button
          key="next"
          color="outline-primary"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          className="me-1"
        >
          ›
        </Button>
      )
    }

    return buttons
  }

  // Event Handlers
  const handleBackToDashboard = () => {
    if (onBack) {
      onBack()
    } else {
      const dashboardRoute = getUserDashboard(user?.team_name || 'expert_team')
      router.push(dashboardRoute)
    }
  }

  const openApprovalModal = (incident: PendingApprovalIncident) => {
    setSelectedIncident(incident)
    setActiveTab('details') // Reset to details tab when opening modal
    setShowApprovalModal(true)
  }

  const closeApprovalModal = () => {
    setShowApprovalModal(false)
    setSelectedIncident(null)
    setActiveTab('details')
  }

  // Initialization
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login')
      return
    }

    const initializeData = async () => {
      await loadMasterData()
      await fetchPendingApprovals()
    }

    initializeData()
  }, [router])

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Loading State
  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading pending approvals...</span>
          </div>
          <p className="mt-3 text-muted">Loading pending approvals...</p>
        </div>
      </Container>
    )
  }

  // Error State
  if (error && !pendingIncidents.length) {
    return (
      <Container fluid>
        <Alert color="danger" className="mt-3">
          <strong>Error:</strong> {error}
          <div className="mt-2">
            <Button color="primary" onClick={fetchPendingApprovals} className="me-2">
              Try again
            </Button>
            <Button color="secondary" onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <Container fluid>
        {/* Success/Error Alerts */}
        {success && (
          <Alert color="success" className="mt-3" toggle={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert color="danger" className="mt-3" toggle={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">Pending Approvals</h4>
                  </div>
                  <div>
                    <Button
                      color="secondary"
                      size="sm"
                      onClick={handleBackToDashboard}
                    >
                      ← Back to Dashboard
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Pending Approvals Table */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>
                    Incidents Pending Approval ({filteredIncidents.length})
                  </h5>
                  <Button
                    color="outline-primary"
                    size="sm"
                    onClick={fetchPendingApprovals}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-4">
                    <h6 className="text-muted">No pending approvals found</h6>
                    <Button color="primary" onClick={fetchPendingApprovals}>
                      Refresh Data
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Incident Number</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assigned To</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentIncidents.map((incident) => (
                            <tr key={incident.id}>
                              <td>
                                <span className="fw-medium text-primary">
                                  {getIncidentNumber(incident)}
                                </span>
                              </td>
                              <td>
                                <div className="fw-medium text-dark">
                                  {getCategoryName(incident) || '-'}
                                </div>
                                {incident.short_description && (
                                  <small className="text-muted d-block">
                                    {incident.short_description.length > 50
                                      ? `${incident.short_description.substring(0, 50)}...`
                                      : incident.short_description
                                    }
                                  </small>
                                )}
                              </td>
                              <td>
                                {getStatus(incident) ? (
                                  <Badge
                                    style={{
                                      backgroundColor: getStatusColor(getStatus(incident)),
                                      color: 'white'
                                    }}
                                  >
                                    {getStatus(incident)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                {getPriorityName(incident) ? (
                                  <Badge
                                    style={{
                                      backgroundColor: getPriorityColor(getPriorityName(incident)),
                                      color: 'white'
                                    }}
                                  >
                                    {getPriorityName(incident)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <div className="fw-medium text-dark">
                                  {getAssignedTo(incident) || '-'}
                                </div>
                              </td>
                              <td>
                                <small className="text-dark">
                                  {formatDateOnly(incident.created_at)}
                                </small>
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1">
                                  <Button
                                    color="outline-info"
                                    size="sm"
                                    onClick={() => handleApprovalAction('approve', incident)}
                                    disabled={processingApproval}
                                    style={{ minWidth: '110px', fontSize: '12px' }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    color="outline-info"
                                    size="sm"
                                    onClick={() => handleApprovalAction('reject', incident)}
                                    disabled={processingApproval}
                                    style={{ minWidth: '110px', fontSize: '12px' }}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    color="outline-info"
                                    size="sm"
                                    onClick={() => openApprovalModal(incident)}
                                    style={{ minWidth: '110px', fontSize: '12px' }}
                                  >
                                    View
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <small className="text-muted">
                            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length} | Page {currentPage} of {totalPages}
                          </small>
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

      {/* View Details Modal with Tabs */}
      <Modal isOpen={showApprovalModal} toggle={closeApprovalModal} size="xl">
        <ModalHeader toggle={closeApprovalModal}>
          {selectedIncident && `Incident ${getIncidentNumber(selectedIncident)} - Details`}
        </ModalHeader>
        <ModalBody>
          {selectedIncident && (
            <>
              {/* Navigation Tabs */}
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={activeTab === 'details' ? 'active' : ''}
                    onClick={() => setActiveTab('details')}
                    style={{ cursor: 'pointer' }}
                  >
                    Details
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
              </Nav>

              {/* Tab Content */}
              <TabContent activeTab={activeTab} className="mt-3">
                {/* Details Tab */}
                <TabPane tabId="details">
                  <div>
                    <h6 className="mb-3">Incident Information</h6>
                    <Row>
                      <Col md={6}>
                        <p><strong>Incident Number:</strong> {getIncidentNumber(selectedIncident) || '-'}</p>
                        <p><strong>Status:</strong> {getStatus(selectedIncident) || '-'}</p>
                        <p><strong>Priority:</strong> {getPriorityName(selectedIncident) || '-'}</p>
                        <p><strong>Category:</strong> {getCategoryName(selectedIncident) || '-'}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Assigned To:</strong> {getAssignedTo(selectedIncident) || '-'}</p>
                        <p><strong>Caller:</strong> {getCallerName(selectedIncident) || '-'}</p>
                        <p><strong>Created:</strong> {formatDateTime(selectedIncident.created_at)}</p>
                      </Col>
                    </Row>

                    {selectedIncident.short_description && (
                      <div className="mb-3">
                        <p><strong>Short Description:</strong></p>
                        <p className="text-muted">{selectedIncident.short_description}</p>
                      </div>
                    )}

                    {selectedIncident.description && (
                      <div className="mb-3">
                        <p><strong>Description:</strong></p>
                        <p className="text-muted">{selectedIncident.description}</p>
                      </div>
                    )}

                    {selectedIncident.root_cause_analysis && (
                      <div className="mb-3">
                        <p><strong>Root Cause Analysis:</strong></p>
                        <p className="text-muted">{selectedIncident.root_cause_analysis}</p>
                      </div>
                    )}

                    {selectedIncident.conclusion && (
                      <div className="mb-3">
                        <p><strong>Conclusion:</strong></p>
                        <p className="text-muted">{selectedIncident.conclusion}</p>
                      </div>
                    )}

                    {selectedIncident.narration && (
                      <div className="mb-3">
                        <p><strong>Narration:</strong></p>
                        <div
                          className="text-muted"
                          dangerouslySetInnerHTML={{ __html: selectedIncident.narration }}
                        />
                      </div>
                    )}
                  </div>
                </TabPane>

                {/* Evidence Tab */}
                <TabPane tabId="evidence">
                  <EvidenceTab
                    incident={selectedIncident}
                    currentUser={user}
                    canEditEvidence={false} // Read-only for pending approvals
                    isFieldEngineer={false} // Not a field engineer in approval context
                    setError={setError}
                    setSuccess={setSuccess}
                    safe={safe}
                  />
                </TabPane>
              </TabContent>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={closeApprovalModal}>
            Close
          </Button>
          {selectedIncident && (
            <div className="d-flex gap-2">
              <Button
                color="success"
                onClick={() => {
                  handleApprovalAction('approve', selectedIncident)
                  closeApprovalModal()
                }}
                disabled={processingApproval}
                style={{ minWidth: '120px' }}
              >
                {processingApproval ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  'Approve'
                )}
              </Button>
              <Button
                color="danger"
                onClick={() => {
                  handleApprovalAction('reject', selectedIncident)
                  closeApprovalModal()
                }}
                disabled={processingApproval}
                style={{ minWidth: '120px' }}
              >
                {processingApproval ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  'Reject'
                )}
              </Button>
            </div>
          )}
        </ModalFooter>
      </Modal>
    </>
  )
}

export default PendingApproval
