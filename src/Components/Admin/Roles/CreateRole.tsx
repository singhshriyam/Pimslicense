import Breadcrumbs from "@/CommonComponent/BreadCrumbs";
import { Page } from "@/Constant";
import { Card, CardBody, Col, Container, Row } from "reactstrap";



export default function() {
  return (
    <>
      <Breadcrumbs mainTitle='Create Role' parent='Admin' title='Create Role' />
      <Container fluid>
        <Row>
          <Col sm={12}>
            <Card>
            
              <CardBody>
                <p>Create Role </p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>

  );
};

