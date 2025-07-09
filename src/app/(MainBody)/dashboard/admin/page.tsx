// Enhanced page.tsx for Admin Dashboard - Frontend Only
'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminForms from '../../../../Components/AdminForms'
import { getCurrentUser, isAuthenticated } from '../../../(MainBody)/services/userService'
import axios from 'axios'

// Mock data for dashboard
const mockPendingApprovals = [
  {
    id: '1',
    type: 'User Registration',
    module: 'User Management',
    description: 'New user registration request for John Smith',
    requestedBy: 'john.smith@company.com',
    pendingSince: '2025-06-20T10:00:00Z',
    priority: 'high' as const
  },
  {
    id: '2',
    type: 'Role Assignment',
    module: 'Access Control',
    description: 'Manager role assignment for existing user',
    requestedBy: 'admin@company.com',
    pendingSince: '2025-06-19T15:30:00Z',
    priority: 'medium' as const
  },
  {
    id: '3',
    type: 'Asset Creation',
    module: 'Asset Management',
    description: 'New water treatment facility asset registration',
    requestedBy: 'facility.manager@company.com',
    pendingSince: '2025-06-18T09:15:00Z',
    priority: 'low' as const
  }
]

const mockLicenseInfo = [
  {
    id: '1',
    moduleName: 'Incident Management',
    licenseType: 'Enterprise',
    isActive: true,
    expiryDate: '2025-12-31',
    usersCount: 50,
    maxUsers: 100
  },
  {
    id: '2',
    moduleName: 'Asset Management',
    licenseType: 'Professional',
    isActive: true,
    expiryDate: '2025-06-30',
    usersCount: 25,
    maxUsers: 50
  },
  {
    id: '3',
    moduleName: 'Reporting Suite',
    licenseType: 'Standard',
    isActive: false,
    expiryDate: '2025-03-15',
    usersCount: 0,
    maxUsers: 20
  }
]

const mockActiveUsers = [
  { id: '1', name: 'John Smith', role: 'Administrator', isOnline: true },
  { id: '2', name: 'Jane Doe', role: 'Manager', isOnline: true },
  { id: '3', name: 'Bob Wilson', role: 'Handler', isOnline: false },
  { id: '4', name: 'Alice Cooper', role: 'Engineer', isOnline: true },
  { id: '5', name: 'Charlie Brown', role: 'User', isOnline: true }
];

const mockSystemStats = {
  totalUsers: 156,
  activeUsers: 142,
  totalGroups: 12,
  totalRoles: 8,
  totalPermissions: 45,
  pendingApprovals: 3,
  systemHealth: 'good' as const
}

interface PendingApproval {
  id: string
  type: string
  module: string
  description: string
  requestedBy: string
  pendingSince: string
  priority: 'high' | 'medium' | 'low'
}

interface LicenseInfo {
  id: string
  moduleName: string
  licenseType: string
  isActive: boolean
  expiryDate: string
  usersCount: number
  maxUsers: number
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalGroups: number
  totalRoles: number
  totalPermissions: number
  pendingApprovals: number
  systemHealth: 'good' | 'warning' | 'critical'
}
const token = localStorage.getItem("authToken");
const AdminDashboard = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users,setUsers]=useState([]);
  const [loggedinUsers,setLoggedinUsers]=useState([])

  const viewParam = searchParams.get('view')
  const tabParam = searchParams.get('tab')

  // Enhanced tab checking - include all possible tabs from your menu
  const shouldShowForms = tabParam && [
    // Master Settings
    'category',
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
    // Incident Management Forms
    'create-manager',
    'create-handler'
  ].includes(tabParam)

  const [dashboardData, setDashboardData] = useState({
    systemStats: mockSystemStats,
    pendingApprovals: mockPendingApprovals,
    licenseInfo: mockLicenseInfo,
    activeUsers: mockActiveUsers,
    loading: false,
    error: null as string | null
  })

  const [user, setUser] = useState({
    name: '',
    team: '',
    email: '',
    userId: ''
  })

  // Load user data on mount
  useEffect(() => {
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
    getUsers()
    getLoggedinUsers()
    
  }, [router])

  const getUsers = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/users",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setUsers(response.data.data);
      console.log("users=", users);
    } catch (error) {}
  };
   const getLoggedinUsers = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/loggedin-users",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setLoggedinUsers(response.data.data);
      console.log("Logged in Users",response.data.data)
     
    } catch (error) {}
  };

  // Mock approval action
  const handleApproval = (id: string, action: 'approve' | 'reject') => {
    setDashboardData(prev => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.filter(approval => approval.id !== id)
    }))

    // Show success message (you can add toast notification here)
    console.log(`${action === 'approve' ? 'Approved' : 'Rejected'} request ${id}`)
  }

  const formatDateLocal = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Unknown'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    } catch (error) {
      return 'Unknown'
    }
  }

  // Render AdminForms if a form tab is selected
  if (shouldShowForms) {

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
        <AdminForms initialTab={tabParam} />
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

  // Show main admin dashboard
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
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* System Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-primary h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Users 
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {users.length}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-3">
          <Card className="border-left-info h-100">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Groups & Roles
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData.systemStats.totalGroups + dashboardData.systemStats.totalRoles}
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
                    Pending Approvals
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData.pendingApprovals.length}
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
                    Active Licenses
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {dashboardData.licenseInfo.filter(l => l.isActive).length}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Admin Quick Actions and License Information */}
      <Row className="mb-4">
        {/* Active users */}
        <Col lg={6}>
          <Card className="h-100">
            <CardHeader className="pb-0">
              <h5>Currently Active Users</h5>
            </CardHeader>
            <CardBody>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table hover className="table-borderless table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loggedinUsers.map((user:any) => (
                      <tr key={user.user_id}>
                        <td className="fw-medium">{user.user.name}</td>
                        <td>
                          <Badge color="info" size="sm">{user.team_name}</Badge>
                        </td>
                        <td>
                          <Badge
                            color={user.isOnline ? 'success' : 'success'}
                            size="sm"
                          >
                            online
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
          </Col>

        {/* License Information */}
        <Col lg={6}>
          <Card className="h-100">
            <CardHeader className="pb-0">
              <h5>License Information</h5>
            </CardHeader>
            <CardBody>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table hover className="table-borderless table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Module</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.licenseInfo.map((license) => (
                      <tr key={license.id}>
                        <td className="fw-medium">{license.moduleName}</td>
                        <td>
                          <Badge color="info" size="sm">{license.licenseType}</Badge>
                        </td>
                        <td>
                          <Badge
                            color={license.isActive ? 'success' : 'danger'}
                            size="sm"
                          >
                            {license.isActive ? 'Active' : 'Expired'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
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
                  {dashboardData.pendingApprovals.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {dashboardData.pendingApprovals.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Requested By</th>
                        <th>Priority</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.pendingApprovals.map((approval) => (
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
                              {/* <Button color="outline-primary" size="sm" title="View Details">
                                View
                              </Button> */}
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
                  <small className="text-muted">All requests have been processed</small>
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
