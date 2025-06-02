import { Row } from "reactstrap";
import HeaderLogo from "./HeaderLogo";
import SearchInput from "./SearchInput/SearchInput";
import RightHeaderIcon from "./RightHeaderIcon/RightHeaderIcon";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import { useEffect } from "react";
import { headerResponsive } from "@/Redux/Reducers/Layout/LayoutSlice";

const Header = () => {
  const { toggleSidebar } = useAppSelector((state) => state.layout);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(headerResponsive());
  }, []);

  return (
    <div className={`page-header ${toggleSidebar ? "close_icon" : ""}`}>
      <Row className='header-wrapper m-0'>
        <HeaderLogo />
        <SearchInput />
        <RightHeaderIcon />
      </Row>
    </div>
  );
};
export default Header;