import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Card, CardBody, Col } from "reactstrap";
import { BasicDemoMap } from "@/Constant";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import { basicCenter, basicContainerStyle } from "@/Data/Miscellaneous/Maps/Maps";

const BasicMap = () => {
  // const { isLoaded } = useJsApiLoader({
  //   id: "google-map-script",
  //   googleMapsApiKey: "https://maps.googleapis.com/maps/api/js?key=your_api_key",
  // });

  return (
    <Col lg={6} md={12}>
      <Card>
        <CommonCardHeader title={BasicDemoMap} headClass="pb-0" />
        <CardBody>
          <div className="map-js-height overflow-hidden">
            <div id="gmap-simple" className="map-block">
              <GoogleMap mapContainerStyle={basicContainerStyle} center={basicCenter} zoom={10} />
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};

export default BasicMap;
