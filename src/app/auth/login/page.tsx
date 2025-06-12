"use client";
import UserForm from "@/Components/Auth/UserForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, memo } from "react";
import { Col, Container, Row } from "reactstrap";

// Enhanced team to dashboard mapping with exact matching
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

  if (teamLower === 'developer' || teamLower === 'dev') {
    return '/dashboard/developer';
  }

  // // Partial matches
  // if (teamLower.includes('manager')) {
  //   return '/dashboard/incident_manager';
  // }

  // if (teamLower.includes('handler')) {
  //   return '/dashboard/incident_handler';
  // }

  // if (teamLower.includes('admin')) {
  //   return '/dashboard/admin';
  // }

  // if (teamLower.includes('dev')) {
  //   return '/dashboard/developer';
  // }

  return '/dashboard/enduser';
};

const UserLogin = memo(() => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      const dashboardRoute = getTeamDashboard(user.team);

      router.replace(dashboardRoute);
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="login-card login-dark">
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Checking authentication...</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (status === "authenticated" && session) {
    const user = session.user as any;
    const dashboardRoute = getTeamDashboard(user.team);

    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="login-card login-dark">
              <div className="text-center p-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Redirecting...</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

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
