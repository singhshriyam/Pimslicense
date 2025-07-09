'use client'

import CreateAssetStockRoom from "@/Components/Admin/asset-management/asset-stock-room/CreateStockRoom";
import { redirect} from "next/navigation";
import React from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'



const Role = () => {

     document.title = `Create Sub Category`;
  if (localStorage.getItem("userTeam") === "Administrator" ) {
     return (
       <Container fluid>
         {/* Welcome Header */}
<br/>
         {/* Pending Approvals */}
         <Row >
           <Col xs={12} >
             <Card>
              <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Add Asset Stock Room</h5>
               
              </div>
            </CardHeader>
               <CardBody>
   <CreateAssetStockRoom></CreateAssetStockRoom>
               </CardBody>
             </Card>
           </Col>
         </Row>
       </Container>
     )
   
  } else {
    return redirect('/auth/login');
  }
};

export default Role;
