'use client'

import CreateAssetAisle from "@/Components/Admin/asset-management/asset-aisle/CreateAssetAisle";
import CreateAssetLocation from "@/Components/Admin/asset-management/asset-location/CreateAssetLocation";
import CreateAssetSubState from "@/Components/Admin/asset-management/asset-sub-state/CreateAssetSubState";
import CreateSite from "@/Components/Admin/Site/CreateSite";


import { redirect} from "next/navigation";
import React from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'



const AddSite = () => {

     document.title = `Create Asset Aisle`;
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
                <h5>Add Site</h5>
               
              </div>
            </CardHeader>
               <CardBody>
<CreateSite></CreateSite>
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

export default AddSite;
