"use client";

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Button, Badge } from 'reactstrap';
import { User, Mail, Phone, MapPin, Calendar, Users, Hash, Edit, Settings } from 'lucide-react';

interface UserData {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  mobile: string | null;
  address: string | null;
  postcode: string | null;
  created_at: string;
  team_id: number;
  team_name: string;
}

interface UserProfileProps {
  userId?: number;
  userData?: UserData;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, userData }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(!userData);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from API if not provided via props
  useEffect(() => {
    if (userData) {
      setUser(userData);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token from localStorage
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

        const headers: Record<string, string> = {
          "Accept": "application/json",
        };

        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch('https://apexwpc.apextechno.co.uk/api/users', {
          method: "GET",
          headers: headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          if (userId) {
            // Find specific user by ID
            const specificUser = result.data.find((user: UserData) => user.id === userId);
            if (specificUser) {
              setUser(specificUser);
            } else {
              throw new Error(`User with ID ${userId} not found`);
            }
          } else {
            // Get current user from localStorage
            const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
            if (currentUserId) {
              const currentUser = result.data.find((user: UserData) => user.id === parseInt(currentUserId));
              setUser(currentUser || result.data[0]);
            } else {
              setUser(result.data[0]);
            }
          }
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, userData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleRefreshData = async () => {
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading user profile...</span>
          </div>
          <p className="mt-3 text-muted">Loading user profile...</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container fluid>
        <div className="alert alert-danger mt-3">
          <strong>Error:</strong> {error}
          <div className="mt-2">
            <Button color="danger" onClick={handleRefreshData} className="me-2">
              Try again
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container fluid>
        <div className="alert alert-warning mt-3">
          <strong>No Data:</strong> Unable to load user information.
          <div className="mt-2">
            <Button color="warning" onClick={handleRefreshData}>
              Retry
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>

      {/* Profile Header Card */}
      <Row>
        <Col xs={12}>
          <Card className="mb-4 mt-4">
            <CardBody>
              <div className="d-flex align-items-center">
                <div className="me-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle text-dark fw-bold"
                    style={{
                      width: '80px',
                      height: '80px',
                      fontSize: '28px',
                      border: '2px solid #dee2e6'
                    }}
                  >
                    {user.first_name ? getInitials(user.first_name, user.last_name) : <User size={32} />}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h3 className="mb-1">{user.first_name} {user.last_name || ''}</h3>
                  <p className="text-muted mb-0 mt-1">{user.email}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Information Cards */}
      <Row>
        {/* Personal Information */}
        <Col lg={12} className="mb-4">
          <Card className="h-100">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <User size={20} className="text-primary me-2" />
                <h5 className="mb-0">Personal Information</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted ps-0">
                        <User size={14} className="me-2" />
                        First Name
                      </td>
                      <td>{user.first_name || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-0">
                        <User size={14} className="me-2" />
                        Last Name
                      </td>
                      <td>{user.last_name || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-0">
                        <Calendar size={14} className="me-2" />
                        Member Since
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Team Information */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <Users size={20} className="text-info me-2" />
                <h5 className="mb-0">Team Information</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted ps-0" style={{ width: '35%' }}>
                        <Users size={14} className="me-2" />
                        Team Name
                      </td>
                      <td className="fw-medium">
                        {user.team_name || 'Not assigned'}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-0">
                        <Hash size={14} className="me-2" />
                        Team ID
                      </td>
                      <td className="fw-medium">{user.team_id || 'Not assigned'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Contact Information */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <CardBody>
              <div className="d-flex align-items-center mb-3">
                <Mail size={20} className="text-success me-2" />
                <h5 className="mb-0">Contact Information</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted ps-0" style={{ width: '35%' }}>
                        <Mail size={14} className="me-2" />
                        Email Address
                      </td>
                      <td className="fw-medium">{user.email || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-0">
                        <Phone size={14} className="me-2" />
                        Mobile Number
                      </td>
                      <td>{user.mobile || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-0">
                        <MapPin size={14} className="me-2" />
                        Address
                      </td>
                      <td>
                        {user.address || 'Not provided'}
                        {user.postcode && (
                          <div className="text-muted small">Postcode: {user.postcode}</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;
