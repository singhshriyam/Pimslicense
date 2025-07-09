'use client'
import CreateAssetFunction from "@/Components/Admin/asset-management/asset-function/CreateAssetFunction";
import CreateAssetState from "@/Components/Admin/asset-management/asset-state/CreateAssetState";
import { redirect} from "next/navigation";
import React from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'



const AssetFunction = () => {

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
                <h5>Add Asset Function</h5>
               
              </div>
            </CardHeader>
               <CardBody>
   <CreateAssetFunction></CreateAssetFunction>
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

export default AssetFunction;
