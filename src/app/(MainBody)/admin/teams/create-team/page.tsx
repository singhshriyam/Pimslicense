"use client";


import CreateTeam from "@/Components/Admin/teams/CreateTeam";
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

const AddTeam = () => {
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
                <h1>Teams </h1>
              </CardHeader>
              <CardBody>
             <CreateTeam></CreateTeam>
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

export default AddTeam;
