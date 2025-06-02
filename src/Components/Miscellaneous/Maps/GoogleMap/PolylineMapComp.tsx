import { Card, CardBody, Col } from "reactstrap";
import { GoogleMap, useJsApiLoader, } from "@react-google-maps/api";
import { Polygons } from "@/Constant";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import { polylineCenter, polylineContainerStyle } from "@/Data/Miscellaneous/Maps/Maps";

const PolylineMapComp = () => {
  // const { isLoaded } = useJsApiLoader({
  //   id: "google-map-script",
  //   googleMapsApiKey: "https://maps.googleapis.com/maps/api/js?key=your_api_key",
  // });

  return (
    <Col lg={6} md={12}>
      <Card>
        <CommonCardHeader title={Polygons} headClass="pb-0" />
        <CardBody>
          <div className="map-js-height overflow-hidden">
            <div id="gmap-simple" className="map-block">
                <GoogleMap
                  mapContainerStyle={polylineContainerStyle}
                  center={polylineCenter}
                  zoom={10}
                ></GoogleMap>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};

export default PolylineMapComp;