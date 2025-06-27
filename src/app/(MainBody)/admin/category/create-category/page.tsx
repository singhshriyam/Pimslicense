'use client'


import CreateCategory from "@/Components/Admin/Category/CreateCategory";
import CreateRole from "@/Components/Admin/Roles/CreateRole";
import { redirect} from "next/navigation";

import React from 'react'
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Badge, Table } from 'reactstrap'



const AddCategory = () => {

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
                <h1>Category</h1>
               </CardHeader>
               <CardBody>
           <CreateCategory></CreateCategory>
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

export default AddCategory;
