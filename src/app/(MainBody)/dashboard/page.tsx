"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import IncidentCreationForm from "../../../Components/Forms/IncidentCreationForm";
import AllIncidents from '../../../Components/all-incidents';

// Team to dashboard mapping - EXACT MATCHES ONLY
const getTeamDashboard = (team: string): string => {
  if (!team) return '/dashboard/enduser';

  const teamLower = team.toLowerCase().trim();

  // Exact matches only
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

  return '/dashboard/enduser';
};

// All Incidents Component
const AllIncidentsView = ({
  onBack,
  userEmail,
  userTeam
}: {
  onBack: () => void;
  userEmail: string;
  userTeam: string;
}) => {
  return (
    <Container fluid className="p-4">
      <AllIncidents />
    </Container>
  );
};

const DashboardPageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

      // If we have a tab parameter, don't redirect - show the tab content
      if (activeTab === 'create-incident' || activeTab === 'all-incidents') {
        return;
      }

      // Only redirect if we're on the EXACT '/dashboard' path (not sub-routes)
      if (currentPath === '/dashboard') {
        const dashboardRoute = getTeamDashboard(user.team);
        router.replace(dashboardRoute);
        return;
      }

      // If we're on a specific dashboard route (like /dashboard/enduser), do nothing
      if (currentPath.startsWith('/dashboard/')) {
        return;
      }
    } else if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [session, status, router, activeTab]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="mt-3 text-muted">Checking authentication...</h5>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show Create Incident Form if tab is active
  if (status === "authenticated" && session?.user && activeTab === 'create-incident') {
    const user = session.user as any;
    const userEmail = user.email || '';
    const userName = user.name || '';
    const userTeam = user.team || 'user';

    const handleFormCancel = () => {
      const dashboardRoute = getTeamDashboard(userTeam);
      router.push(dashboardRoute);
    };

    return (
      <IncidentCreationForm
        userRole={userTeam}
        userEmail={userEmail}
        userName={userName}
        onCancel={handleFormCancel}
        onIncidentCreated={() => {}}
        onSuccess={() => {
          const dashboardRoute = getTeamDashboard(userTeam);
          router.push(dashboardRoute);
        }}
        showBackButton={true}
        compactMode={false}
      />
    );
  }

  // Show All Incidents if tab is active
  if (status === "authenticated" && session?.user && activeTab === 'all-incidents') {
    const user = session.user as any;
    const userEmail = user.email || '';
    const userTeam = user.team || 'user';

    const handleAllIncidentsBack = () => {
      const dashboardRoute = getTeamDashboard(userTeam);
      router.push(dashboardRoute);
    };

    return (
      <AllIncidentsView
        onBack={handleAllIncidentsBack}
        userEmail={userEmail}
        userTeam={userTeam}
      />
    );
  }

  // If we reach here, we're redirecting
  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mt-3 text-muted">Redirecting to your dashboard...</h5>
              {session?.user && (
                <p className="text-muted mt-2">
                  User: {(session.user as any).name} | Team: {(session.user as any).team}
                </p>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

const DashboardPage = () => {
  return (
    <Suspense fallback={
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
              <div className="text-center">
                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="mt-3 text-muted">Loading dashboard...</h5>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    }>
      <DashboardPageContent />
    </Suspense>
  );
};

export default DashboardPage;
