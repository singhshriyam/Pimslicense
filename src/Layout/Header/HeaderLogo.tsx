import { Col } from "reactstrap";
import { ImagePath } from "@/Constant";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import Link from "next/link";
import SVG from "@/CommonComponent/SVG";
import { setToggleSidebar } from "@/Redux/Reducers/Layout/LayoutSlice";
import Image from "next/image";

const HeaderLogo = () => {
  const dispatch = useAppDispatch();
  const { toggleSidebar } = useAppSelector((state) => state.layout)

  return (
    <Col className="header-logo-wrapper col-auto p-0">
      <div className="logo-wrapper">
        <Link href={`/dashboard/default`}>
          <Image className="img-fluid for-light" src={`${ImagePath}/logo/logo-1.png`} alt="" width={121} height={38} />
          <Image className="img-fluid for-dark" src={`${ImagePath}/logo/logo.png`} alt="" width={121} height={38} />
        </Link>
      </div>
      <div className="toggle-sidebar">
        <SVG className="sidebar-toggle" iconId="stroke-animation" onClick={() => dispatch(setToggleSidebar(!toggleSidebar))} />
      </div>
    </Col>
  );
};
export default HeaderLogo;