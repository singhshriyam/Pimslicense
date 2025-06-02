import SVG from "@/CommonComponent/SVG";
import { ImagePath } from "@/Constant";
import { notificationData } from "@/Data/Layout/Header";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "reactstrap";

const Notifications = () => {
  return (
    <li className="onhover-dropdown">
      <div className="notification-box">
        <SVG iconId="fill-Bell" />
        <Badge pill color="primary">{'3'}</Badge>
      </div>
      <div className="onhover-show-div notification-dropdown">
        <h6 className="f-18 mb-0 dropdown-title">{'NotiFications'}</h6>
        {notificationData.map((item, index) => (
          <div className={`d-flex align-items-center ${item.line === true?'figma-line':''}`} key={index}>
            <Image src={`${ImagePath}/dashboard/user/${item.image}`} width={42} height={42} alt="" />
            <div className="flex-grow-1 ms-2">
              <Link href={`/app/users/user_profile`}>
                <h5>
                  {item.title} {item.strongText && <strong> {item.strongText} </strong>}
                  {item.subText && item.subText}
                </h5>
                <span>{item.subTitle}</span>
              </Link>
            </div>
            {item.color &&
              <div className="flex-shrink-0">
                <div className={`activity-dot-${item.color}`} />
              </div>
            }
          </div>
        ))}
      </div>
    </li>
  );
};
export default Notifications;