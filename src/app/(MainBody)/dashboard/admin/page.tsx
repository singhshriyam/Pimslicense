'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminForms from '../../../../Components/AdminForms'

import {
  fetchAllIncidents,
  getIncidentStats,
  type Incident
} from '../../../(MainBody)/services/incidentService'

import {
  getCurrentUser,
  isAuthenticated
} from '../../../(MainBody)/services/userService'

import AllIncidents from '../../../../Components/AllIncidents'

interface User {
  id: string
  name: string
  email: string
  team: string
  lastActivity?: string
}

interface Request {
  id: string
  type: string
  description: string
  requestedBy: string
  status: string
  createdAt: string
}

interface PendingApproval {
  id: string
  type: string
  description: string
  requestedBy: string
  pendingSince: string
  priority: string
}

const AdminDashboard = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const viewParam = searchParams.get('view')
  const tabParam = searchParams.get('tab')

  // Enhanced tab checking - include all possible tabs from your menu
  const shouldShowForms = tabParam && [
    // Master Settings
    'subcategory',
    'contact-type',
    'state',
    'impact',
    'urgency',
    // Asset Management
    'asset-state',
    'asset-substate',
    'asset-function',
    'asset-location',
    'department',
    'company',
    'stock-room',
    'aisle',
    'add-asset',
    // Site Management
    'site-type',
    'sites',
    // User Management
    'users',
    // Groups
    'all-groups',
    'create-group',
    // Roles & Permissions
    'all-roles',
    'create-roles',
    'all-permissions',
    'create-permission',
    // SLA Management
    'sla-definitions',
    'sla-conditions',
    // Incident Management
    'create-incident',
    'create-manager',
    'create-handler',
    'pending-approval',
    'sla-define',
    'sla-report'
  ].includes(tabParam)

  const [showAllIncidents, setShowAllIncidents] = useState(viewParam === 'all-incidents')

  const [dashboardData, setDashboardData] = useState({
    incidents: [] as Incident[],
    totalIncidents: 0,
    resolvedIncidents: 0,
    inProgressIncidents: 0,
    pendingIncidents: 0,
    closedIncidents: 0,
    loading: true,
    error: null as string | null
  })

  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  })

  const [loggedInUsers] = useState<User[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [approvalsLoading, setApprovalsLoading] = useState(false)

  // Enhanced tab to form mapping - matches your AdminForms configuration
  const getFormTypeFromTab = (tab: string): string => {
    const tabMapping: { [key: string]: string } = {
      // Master Settings
      'subcategory': 'sub-categories',
      'contact-type': 'contact-type',
      'state': 'incident-states',
      'impact': 'impacts',
      'urgency': 'urgencies',
      // Asset Management
      'asset-state': 'asset-states',
      'asset-substate': 'asset-substates',
      'asset-function': 'asset-functions',
      'asset-location': 'asset-locations',
      'department': 'departments',
      'company': 'companies',
      'stock-room': 'stock-rooms',
      'aisle': 'aisles',
      'add-asset': 'assets',
      // Site Management
      'site-type': 'site-types',
      'sites': 'sites',
      // User Management
      'users': 'users',
      // Groups
      'all-groups': 'groups',
      'create-group': 'groups',
      // Roles & Permissions
      'all-roles': 'roles',
      'create-roles': 'roles',
      'all-permissions': 'permissions',
      'create-permission': 'permissions',
      // SLA Management
      'sla-definitions': 'sla-definitions',
      'sla-conditions': 'sla-conditions',
      // Incident Management
      'create-incident': 'incidents',
      'create-manager': 'managers',
      'create-handler': 'handlers',
      'pending-approval': 'approvals',
      'sla-define': 'sla-define',
      'sla-report': 'sla-report'
    }
    return tabMapping[tab] || 'categories'
  }

  // Debug logging with more details
  useEffect(() => {
    console.log('URL Parameters Debug:', {
      viewParam,
      tabParam,
      shouldShowForms,
      formType: tabParam ? getFormTypeFromTab(tabParam) : 'none',
      currentPath: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })
  }, [viewParam, tabParam, shouldShowForms])

  // Handle special views first
  useEffect(() => {
    const currentViewParam = searchParams.get('view')
    setShowAllIncidents(currentViewParam === 'all-incidents')
  }, [searchParams])

  // Fetch data function
  const fetchData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }))

      if (!isAuthenticated()) {
        router.replace('/auth/login')
        return
      }

      const currentUser = getCurrentUser()
      setUser({
        name: currentUser?.name || 'Administrator',
        team: currentUser?.team || 'Administrator',
        email: currentUser?.email || '',
        userId: currentUser?.id || ''
      })

      const allIncidents = await fetchAllIncidents()
      const stats = getIncidentStats(allIncidents)

      setDashboardData({
        incidents: allIncidents,
        totalIncidents: stats.total,
        resolvedIncidents: stats.resolved,
        inProgressIncidents: stats.inProgress,
        pendingIncidents: stats.pending,
        closedIncidents: stats.closed,
        loading: false,
        error: null
      })

    } catch (error: any) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }))
    }
  }

  // Placeholder functions for future API integration
  const fetchRequests = async () => {
    setRequestsLoading(true)
    try {
      setTimeout(() => {
        setRequests([])
        setRequestsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      setRequestsLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    setApprovalsLoading(true)
    try {
      setTimeout(() => {
        setPendingApprovals([])
        setApprovalsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error)
      setApprovalsLoading(false)
    }
  }

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      console.log(`${action} approval for ID: ${id}`)
      fetchPendingApprovals()
    } catch (error) {
      console.error(`Failed to ${action} approval:`, error)
    }
  }

  // Load data only when showing dashboard (not forms or incidents view)
  useEffect(() => {
    if (!shouldShowForms && !showAllIncidents) {
      fetchData()
      fetchRequests()
      fetchPendingApprovals()
    }
  }, [router, shouldShowForms, showAllIncidents])

  const handleViewAllIncidents = () => {
    setShowAllIncidents(true)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('view', 'all-incidents')
    newUrl.searchParams.delete('tab') // Clear tab when switching to incidents view
    window.history.pushState({}, '', newUrl.toString())
  }

  const handleBackToDashboard = () => {
    setShowAllIncidents(false)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('view')
    newUrl.searchParams.delete('tab')
    window.history.pushState({}, '', newUrl.toString())
  }

  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Unknown'
    }
  }

  // Render AdminForms if a form tab is selected
  if (shouldShowForms) {
    const formType = getFormTypeFromTab(tabParam!)
    console.log(`Rendering AdminForms with formType: ${formType}`)

    return (
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">Admin Management - {tabParam?.replace('-', ' ').toUpperCase()}</h4>
                    <p className="text-muted mb-0">Manage system configuration and data</p>
                  </div>
                  <Button
                    color="outline-secondary"
                    onClick={() => router.push('/dashboard/admin')}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <AdminForms initialTab={formType} />
      </Container>
    )
  }

  // Show loading state
  if (dashboardData.loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading admin dashboard...</span>
          </div>
        </div>
      </Container>
    )
  }

  // Show error state
  if (dashboardData.error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {dashboardData.error}
          <Button color="link" onClick={fetchData} className="p-0 ms-2">Try again</Button>
        </div>
      </Container>
    )
  }

  // Show all incidents view
  if (showAllIncidents) {
    return <AllIncidents userType="admin" onBack={handleBackToDashboard} />
  }

  // Show main dashboard
  return (
    <Container fluid>
      {/* Welcome Header */}
      <Row>
        <Col xs={12}>
          <Card className="mb-4 mt-4">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">Welcome {user.name}!</h4>
                  <p className="text-muted mb-0">Admin Dashboard - Manage your system</p>
                </div>
                <Button
                  color="primary"
                  onClick={handleViewAllIncidents}
                >
                  View All Incidents
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-primary h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Incidents
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData.totalIncidents}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-success h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Resolved
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData.resolvedIncidents}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-warning h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Total Requests
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {requests.length}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-danger h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Pending Approvals
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {pendingApprovals.length}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Admin Quick Actions and System Overview */}
      <Row className="mb-4">
        {/* Admin Quick Actions */}
        <Col lg={6}>
          <Card className="h-100">
            <CardHeader className="pb-0">
              <h5>Admin Quick Actions</h5>
            </CardHeader>
            <CardBody>
              <div className="d-grid gap-2">
                <Button
                  color="primary"
                  onClick={() => router.push('/dashboard/admin?tab=subcategory')}
                  className="text-start"
                >
                  Manage Sub-Categories
                </Button>
                <Button
                  color="info"
                  onClick={() => router.push('/dashboard/admin?tab=contact-type')}
                  className="text-start"
                >
                  Manage Contact Types
                </Button>
                <Button
                  color="success"
                  onClick={() => router.push('/dashboard/admin?tab=sites')}
                  className="text-start"
                >
                  Manage Sites
                </Button>
                <Button
                  color="warning"
                  onClick={() => router.push('/dashboard/admin?tab=impact')}
                  className="text-start"
                >
                  Manage Impacts
                </Button>
                <Button
                  color="secondary"
                  onClick={() => router.push('/dashboard/admin?tab=urgency')}
                  className="text-start"
                >
                  Manage Urgencies
                </Button>
                <Button
                  color="dark"
                  onClick={() => router.push('/dashboard/admin?tab=state')}
                  className="text-start"
                >
                  Manage Incident States
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Currently Logged In Users */}
        <Col lg={6}>
          <Card className="h-100">
            <CardHeader className="pb-0">
              <h5>Currently Logged In Users</h5>
            </CardHeader>
            <CardBody>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table hover className="table-borderless table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Team</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loggedInUsers.length > 0 ? (
                      loggedInUsers.map((loggedUser) => (
                        <tr key={loggedUser.id}>
                          <td className="fw-medium">{loggedUser.name}</td>
                          <td>
                            <Badge color="primary" size="sm">{loggedUser.team}</Badge>
                          </td>
                          <td>
                            <Badge color="success" size="sm">
                              Online
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          No active users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Requests List */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>System Requests</h5>
                <Button color="outline-primary" size="sm">
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {requestsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading requests...</span>
                  </div>
                </div>
              ) : requests.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Requested By</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            <span className="fw-medium text-primary">{request.id}</span>
                          </td>
                          <td>
                            <Badge color="info">{request.type}</Badge>
                          </td>
                          <td>{request.description}</td>
                          <td>{request.requestedBy}</td>
                          <td>
                            <Badge
                              color={
                                request.status === 'approved' ? 'success' :
                                request.status === 'rejected' ? 'danger' :
                                request.status === 'pending' ? 'warning' : 'secondary'
                              }
                            >
                              {request.status}
                            </Badge>
                          </td>
                          <td>{formatDateLocal(request.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button color="outline-primary" size="sm">
                                View
                              </Button>
                              <Button color="outline-secondary" size="sm">
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No requests found</p>
                  <small className="text-muted">Requests will appear here when available from the backend API</small>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Pending Approvals */}
      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Pending Approvals</h5>
                <Badge color="danger" className="fs-6">
                  {pendingApprovals.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {approvalsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading approvals...</span>
                  </div>
                </div>
              ) : pendingApprovals.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Requested By</th>
                        <th>Priority</th>
                        <th>Pending Since</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApprovals.map((approval) => (
                        <tr key={approval.id}>
                          <td>
                            <span className="fw-medium text-primary">{approval.id}</span>
                          </td>
                          <td>
                            <Badge color="warning">{approval.type}</Badge>
                          </td>
                          <td>{approval.description}</td>
                          <td>{approval.requestedBy}</td>
                          <td>
                            <Badge
                              color={
                                approval.priority === 'high' ? 'danger' :
                                approval.priority === 'medium' ? 'warning' : 'info'
                              }
                            >
                              {approval.priority}
                            </Badge>
                          </td>
                          <td>{formatDateLocal(approval.pendingSince)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                color="success"
                                size="sm"
                                title="Approve"
                                onClick={() => handleApproval(approval.id, 'approve')}
                              >
                                ✓
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleApproval(approval.id, 'reject')}
                              >
                                ✗
                              </Button>
                              <Button color="outline-primary" size="sm" title="View Details">
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No pending approvals</p>
                  <small className="text-muted">Pending approvals will appear here when available from the backend API</small>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminDashboard
