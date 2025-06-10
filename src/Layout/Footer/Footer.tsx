import React from "react";
import { Col, Container, Row } from "reactstrap";
// import SVG from "@/CommonComponent/SVG";

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col md={6} className="p-0 footer-copyright">
            <p className="mb-0">© 2025 Apex Water Pollution Control</p>
          </Col>
          <Col md={6} className="p-0">
            <div className="social-links mb-0 d-flex align-items-center justify-content-end">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link me-3">
                <i className="fab fa-facebook-f footer-icon"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link me-3">
                <i className="fab fa-twitter footer-icon"></i>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <i className="fab fa-linkedin-in footer-icon"></i>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
