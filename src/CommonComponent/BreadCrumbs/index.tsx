import { Breadcrumb, BreadcrumbItem, Col, Container, Row } from "reactstrap";
import Link from "next/link";
import { BreadcrumbsProps } from "@/Types/CommonComponent.type";
import SVG from "../SVG";

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ mainTitle, parent, title }) => {
  return (
    <Container fluid>
      <div className="page-title">
        <Row>
          <Col sm={6} className="p-0">
            <h3>{mainTitle}</h3>
          </Col>
          <Col sm={6} className="p-0">
            <Breadcrumb>
              <BreadcrumbItem>
                <Link href={`/dashboard/default`}>
                  <SVG iconId="stroke-home" className="stroke-icon" />
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>{parent}</BreadcrumbItem>
              <BreadcrumbItem active>{title}</BreadcrumbItem>
            </Breadcrumb>
          </Col>
        </Row>
      </div>
    </Container>
  );
};
export default Breadcrumbs;