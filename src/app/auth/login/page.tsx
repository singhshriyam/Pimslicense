"use client";
import UserForm from "@/Components/Auth/UserForm";
import { useRouter } from "next/navigation";
import { useEffect, memo } from "react";
import { Col, Container, Row } from "reactstrap";
import { isAuthenticated, getStoredUserTeam } from "../../(MainBody)/services/userService";

const getTeamDashboard = (team: string): string => {
  if (!team) return '/dashboard/enduser';

  const teamLower = team.toLowerCase().trim();

  // Exact matches first
  if (teamLower === 'user') {
    return '/dashboard/enduser';
  }

  if (teamLower === 'incident manager' || teamLower === 'incident_manager') {
    return '/dashboard/incident_manager';
  }

  if (teamLower === 'incident handler' || teamLower === 'incident_handler') {
    return '/dashboard/incident_handler';
  }

  if (teamLower === 'administrator' || teamLower === 'admin') {
    return '/dashboard/admin';
  }

  if (teamLower === 'sla manager' || teamLower === 'dev') {
    return '/dashboard/developer';
  }

  return '/dashboard/enduser';
};

const UserLogin = memo(() => {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const userTeam = getStoredUserTeam() || 'user';
      const dashboardRoute = getTeamDashboard(userTeam);
      router.replace(dashboardRoute);
    }
  }, [router]);

  // Remove loading and authenticated status checks since we're using localStorage
  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="login-card login-dark">
            <UserForm />
          </div>
        </Col>
      </Row>
    </Container>
  );
});

UserLogin.displayName = 'UserLogin';

export default UserLogin;
