import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import { Username, UsernameAlerts } from "@/Constant";
import { usernameAlertData } from "@/Data/BonusUi/SweetAlert";
import { Button, Card, CardBody, Col } from "reactstrap";
import SweetAlert from "sweetalert2";

const UsernameAlert = () => {
  const displayAlert = () => {
    SweetAlert.fire({ text: "Please! Submit Your Username :", input: "text", confirmButtonColor: "#5C61F2" }).then((result) => {
      if (result.value) {
        SweetAlert.fire({ text: `Your name is : ${result.value}`, confirmButtonColor: "#5C61F2" });
      } else {
        SweetAlert.fire({ text: `Your name is : ${result.value}`, confirmButtonColor: "#5C61F2" });
      }
    });
  };

  return (
    <Col xxl={3} lg={4} sm={6} xs={12}>
      <Card className="height-equal">
        <CommonCardHeader title={UsernameAlerts} span={usernameAlertData} />
        <CardBody className="btn-showcase">
          <Button color="secondary" className="sweet-13" onClick={displayAlert}>{Username}</Button>
        </CardBody>
      </Card>
    </Col>
  );
};

export default UsernameAlert;