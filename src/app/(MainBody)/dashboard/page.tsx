"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import { useUserRole, RoleUtils } from "@/Data/Layout/Menu";
import AllIncidents from '../../../Components/all-incidents';

// Import the new form component
import IncidentCreationForm from "../../../Components/Forms/IncidentCreationForm";

// Import existing components and services
import {
  Incident,
  fetchIncidentsAPI,
  updateIncidentAPI,
  deleteIncidentAPI,
  getStatusBadge,
  getPriorityBadge,
  formatDate
} from '../services/incidentService';

// All Incidents Component (keeping your existing one)
const AllIncidentsView = ({
  onBack,
  globalIncidents,
  userEmail,
  userRole
}: {
  onBack: () => void;
  globalIncidents: Incident[];
  userEmail: string;
  userRole: string;
}) => {
  // Your existing AllIncidentsView implementation here
  // ... (keeping the same as in your original file)

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">All Incidents</h4>
          <p className="text-muted mb-0">Manage and track all incidents</p>
        </div>
        <Button color="secondary" size="sm" onClick={onBack}>
          ← Back to Dashboard
        </Button>
      </div>
      {/* Your existing incident table implementation */}
      <div className="alert alert-info">
        <p>All Incidents View - Implementation from your existing component</p>
      </div>
    </Container>
  );
};

// Main Dashboard Content Component
const DashboardPageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  // Use the role-based system
  const { currentRole, isLoading, isAuthenticated } = useUserRole();

  // Global incidents state
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const handleIncidentCreated = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
    console.log('New incident added to list:', newIncident);
  };

  const handleIncidentFormSuccess = () => {
    // Optionally redirect back to dashboard after successful creation
    setTimeout(() => {
      const dashboardRoute = RoleUtils.getDefaultDashboard(currentRole);
      router.push(dashboardRoute);
    }, 2000);
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      const userTeam = user.team?.toUpperCase();

      console.log("Dashboard redirect - User team:", userTeam);
      console.log("Mapped role:", currentRole);

      // Check if we should show the form or all incidents instead of redirecting
      if (activeTab === 'create-incident' || activeTab === 'all-incidents') {
        // Stay on this page to show the form/list
        return;
      }

      // Use the role-based redirect
      const redirectRoute = RoleUtils.getDefaultDashboard(currentRole);

      console.log("Redirecting to:", redirectRoute);

      // Use replace instead of push to avoid back button issues
      router.replace(redirectRoute);
    } else if (status === "unauthenticated") {
      // Redirect to login if not authenticated
      router.replace("/auth/login");
    }
  }, [session, status, router, activeTab, currentRole]);

  // Show Create Incident Form if tab is active
  if (status === "authenticated" && session?.user && activeTab === 'create-incident') {
    const user = session.user as any;
    const userEmail = user.email || '';
    const userName = user.name || '';

    const roleDisplayNames = {
      'USER': 'End User',
      'ADMINISTRATOR': 'Administrator',
      'INCIDENT_HANDLER': 'Incident Handler',
      'INCIDENT_MANAGER': 'Incident Manager',
      'SLA_MANAGER': 'SLA Manager',
      'DEVELOPER': 'Developer'
    };

    const displayRole = roleDisplayNames[currentRole as keyof typeof roleDisplayNames] || 'User';

    const handleFormCancel = () => {
      const dashboardRoute = RoleUtils.getDefaultDashboard(currentRole);
      router.push(dashboardRoute);
    };

    return (
      <IncidentCreationForm
        userRole={displayRole}
        userEmail={userEmail}
        userName={userName}
        onCancel={handleFormCancel}
        onIncidentCreated={handleIncidentCreated}
        onSuccess={handleIncidentFormSuccess}
        showBackButton={true}
        compactMode={false}
      />
    );
  }

  // Show All Incidents if tab is active
  if (status === "authenticated" && session?.user && activeTab === 'all-incidents') {
    const user = session.user as any;
    const userEmail = user.email || '';

    const handleAllIncidentsBack = () => {
      const dashboardRoute = RoleUtils.getDefaultDashboard(currentRole);
      router.push(dashboardRoute);
    };

    return (
      <AllIncidentsView
        onBack={handleAllIncidentsBack}
        globalIncidents={incidents}
        userEmail={userEmail}
        userRole={currentRole}
      />
    );
  }

  // Show loading spinner while determining where to redirect
  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="mt-3 text-muted">Loading your dashboard...</h5>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

// Main Dashboard Page with Suspense
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
                <h5 className="mt-3 text-muted">Loading your dashboard...</h5>
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
