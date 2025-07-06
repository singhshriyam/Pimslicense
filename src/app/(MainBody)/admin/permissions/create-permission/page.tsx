"use client";

import CreatePermission from "@/Components/Admin/Permissions/CreatePermission";
import { redirect } from "next/navigation";

import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Table,
} from "reactstrap";

const AddPermissions = () => {
  if (localStorage.getItem("userTeam") === "Administrator") {
    return (
      <Container fluid>
        {/* Welcome Header */}
        <br />
        {/* Pending Approvals */}
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <h1>Permissions</h1>
              </CardHeader>
              <CardBody>
                <CreatePermission></CreatePermission>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  } else {
    return redirect("/auth/login");
  }
};

export default AddPermissions;
