import { Col, Card, CardBody } from "reactstrap";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { PolygonsTitle } from "@/Constant";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import { polygonCenter, polygonContainerStyle } from "@/Data/Miscellaneous/Maps/Maps";

const PolygonsComp = () => {
  // const { isLoaded } = useJsApiLoader({
  //   id: "google-map-script",
  //   googleMapsApiKey: "https://maps.googleapis.com/maps/api/js?key=your_api_key",
  // });

  return (
    <Col lg={6} md={12}>
      <Card>
        <CommonCardHeader title={PolygonsTitle} headClass="pb-0" />
        <CardBody>
          <div className="map-js-height overflow-hidden">
            <div id="gmap-simple" className="map-block">
                <GoogleMap
                  mapContainerStyle={polygonContainerStyle}
                  center={polygonCenter}
                  zoom={10}
                ></GoogleMap>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};
export default PolygonsComp;