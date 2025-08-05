"use client";
import LoginSimpleContainer from "@/Components/login/LoginSimpleContainer";
import { useRouter } from "next/navigation";
import { useEffect, memo } from "react";
import { Col, Container, Row } from "reactstrap";
// import { isAuthenticated, getStoredUserTeam, getUserDashboard } from "../../(MainBody)/services/userService";

const UserLogin = memo(() => {
  const router = useRouter();

    useEffect(() => {
      const authToken = sessionStorage.getItem('authToken');
      if (authToken) {
        // User is already logged in, redirect to dashboard
        router.replace('/dashboard');
      }
    }, [router]);

  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="login-card login-dark">
            <LoginSimpleContainer />
          </div>
        </Col>
      </Row>
    </Container>
  );
});

UserLogin.displayName = 'UserLogin';

export default UserLogin;
