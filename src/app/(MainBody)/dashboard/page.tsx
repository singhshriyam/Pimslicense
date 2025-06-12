"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Container, Row, Col } from "reactstrap";
import {
  isAuthenticated,
  getStoredUserTeam,
  getUserDashboard,
  getCurrentUser
} from "../services/userService";


import IncidentCreationForm from "../../../Components/Forms/IncidentCreationForm";
import AllIncidents from "../../../Components/all-incidents";

const DashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    // Get current user data
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const userTeam = currentUser.team || "user";
    const currentPath = window.location.pathname;

    console.log("User team:", userTeam);
    console.log("Current path:", currentPath);

    // If we have a tab parameter, don't redirect - show the tab content
    if (activeTab === 'create-incident' || activeTab === 'all-incidents') {
      setLoading(false);
      return;
    }

    // If on exact '/dashboard' path, redirect to appropriate dashboard
    if (currentPath === '/dashboard') {
      const dashboardRoute = getUserDashboard(userTeam);
      console.log("Redirecting to:", dashboardRoute);
      router.replace(dashboardRoute);
      return;
    }

    setLoading(false);
  }, [router, activeTab]);

  if (loading) {
    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
              <div className="text-center">
                <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="mt-3 text-muted">Loading dashboard...</h5>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show Create Incident Form if tab is active
  if (activeTab === 'create-incident') {
    const handleFormCancel = () => {
      const dashboardRoute = getUserDashboard(user?.team || "user");
      router.push(dashboardRoute);
    };

    const handleFormSuccess = () => {
      const dashboardRoute = getUserDashboard(user?.team || "user");
      router.push(dashboardRoute);
    };

    return (
      <IncidentCreationForm
        userRole={user?.team || 'user'}
        userEmail={user?.email || ''}
        userName={user?.name || ''}
        onCancel={handleFormCancel}
        onIncidentCreated={() => {}}
        onSuccess={handleFormSuccess}
        showBackButton={true}
        compactMode={false}
      />
    );
  }

  // Show All Incidents if tab is active
  if (activeTab === 'all-incidents') {
    return <AllIncidents />;
  }

  // Default redirecting state
  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mt-3 text-muted">Redirecting to your dashboard...</h5>
              {user && (
                <p className="text-muted mt-2">
                  User: {user.name} | Team: {user.team}
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
                <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="mt-3 text-muted">Loading dashboard...</h5>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    }>
      <DashboardContent />
    </Suspense>
  );
};

export default DashboardPage;
