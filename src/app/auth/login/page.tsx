"use client";
import LoginSimpleContainer from "@/Components/login/LoginSimpleContainer";
import { useRouter } from "next/navigation";
import { useEffect, memo } from "react";
import { Col, Container, Row } from "reactstrap";
import { isAuthenticated } from "@/services/apiService";

const UserLogin = memo(() => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      console.log('✅ User already authenticated, redirecting to dashboard');
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
