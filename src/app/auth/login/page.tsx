"use client";
import UserForm from "@/Components/Auth/UserForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, memo } from "react";
import { Col, Container, Row } from "reactstrap";

const UserLogin = memo(() => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // SIMPLIFIED: Only redirect if user is authenticated
    // Let UserForm handle the specific dashboard routing based on role
    if (status === "authenticated" && session) {
      console.log("User is authenticated, but letting UserForm handle redirection");
      // Don't redirect here - let UserForm.tsx handle the role-based redirection
    }
  }, [session, status, router]);

  // Show loading while checking session
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

  // Don't render login form if user is already authenticated
  if (status === "authenticated" && session) {
    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="login-card login-dark">
              <div className="text-center p-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Redirecting...</span>
                </div>
                <p className="mt-3 text-success">Redirecting to dashboard...</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show login form for unauthenticated users
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

// Add display name for debugging
UserLogin.displayName = 'UserLogin';

export default UserLogin;
