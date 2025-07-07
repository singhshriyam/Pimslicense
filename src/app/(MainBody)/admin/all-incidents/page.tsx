// Enhanced page.tsx for Admin Dashboard - Frontend Only
'use client'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'
import { getCurrentUser, isAuthenticated } from '../../../(MainBody)/services/userService'
import { useRouter} from 'next/navigation'
import axios from 'axios'

const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");
const formatedDate=(dateStr:string)=>{
    const [yyyy,mm,dd,hh,mi] = dateStr.split(/[/:\-T]/)
   return  `${dd}-${mm}-${yyyy} ${hh}:${mi}`
}
const AllIncidents = () => {
    const [allIncidents,setAllIncidents]=useState([])
  const router = useRouter()
  // Load user data on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login')
      return
    }
    getAllIncidents()
    })
    const getAllIncidents=async ()=>{
    try {
      const response = await  axios.get(
        `https://apexwpc.apextechno.co.uk/api/all-incidents`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
   
     setAllIncidents(response.data.data);
     console.log(response)
    } catch (error) {}
}

return (
    <Container fluid>
     
<Row>
          <Col xs={12}>
            <Card className="mb-4 mt-4">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">Admin Management - All Incidents</h4>
                    <p className="text-muted mb-0">Manage system configuration and data</p>
                  </div>
                  <Button
                    color="outline-secondary"
                    onClick={() => router.push('/dashboard/admin')}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      
   
      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>All Incidents</h5>
                <Badge color="danger" className="fs-6">
                  {allIncidents.length} Incidents
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {allIncidents.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Short Description</th>
                     
                        <th>Urgency</th>
                        <th>Assigned To</th>
                        <th>Opened At </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allIncidents.map((incident:any) => (
                        <tr key={incident.id}>
                          <td>
                            <span className="fw-medium text-primary">{incident.id}</span>
                          </td>
                          <td>
                          {incident.short_description}
                          </td>
                          <td>{incident.urgency_name}</td>
                          <td>{incident.assigned_to_name}</td>
                          <td>
                            { formatedDate(incident.created_at)}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                color="success"
                                size="sm"
                                title="Approve"
                               
                              >
                                View
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                
                              >
                                Details
                              </Button>
                              {/* <Button color="outline-primary" size="sm" title="View Details">
                                View
                              </Button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No pending approvals</p>
                  <small className="text-muted">All requests have been processed</small>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )

}

export default AllIncidents
