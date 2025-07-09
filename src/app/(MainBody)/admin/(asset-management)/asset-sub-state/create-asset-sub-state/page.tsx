'use client'

import CreateAssetSubState from "@/Components/Admin/asset-management/asset-sub-state/CreateAssetSubState";


import { redirect} from "next/navigation";
import React from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'



const AddAssetSubState = () => {

     document.title = `Create Asset Sub State`;
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
                <h5>Add Asset Sub State</h5>
               
              </div>
            </CardHeader>
               <CardBody>
       <CreateAssetSubState></CreateAssetSubState>
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

export default AddAssetSubState;
