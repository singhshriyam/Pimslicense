import { ImagePath, Pinned } from "@/Constant";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "react-feather";
import SimpleBar from "simplebar-react";
import { LogoWrapper } from "./LogoWrapper";
import SidebarMenuList from "./SideBarMenuList";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import Image from "next/image";
import ConfigDB from "@/Config/ThemeConfig";
import { scrollToLeft, scrollToRight } from "@/Redux/Reducers/Layout/LayoutSlice";

export const SideBar = () => {
  const { toggleSidebar, pinedMenu, margin } = useAppSelector((state) => state.layout);
  const wrapper = ConfigDB.data.settings.layout_class;
  const dispatch = useAppDispatch();

  return (
    <div className={`sidebar-wrapper ${toggleSidebar ? "close_icon" : ""}`} id="sidebar-wrapper">
      <div>
        <LogoWrapper />
        <nav className="sidebar-main">
          <div className={`left-arrow ${margin === 0 ? "disabled" : ""}`} onClick={() => dispatch(scrollToLeft())} id="left-arrow">
            <ArrowLeft />
          </div>
          <div id="sidebar-menu" style={{ position: "inherit", marginLeft: `${wrapper === "horizontal-wrapper" ? margin + "px" : "0px"}` }}>
            <ul className="sidebar-links custom-scrollbar" id="simple-bar">
              <SimpleBar style={{ width: "100%", height: "350px" }}>
                <li className="back-btn">
                  <Link href={`/dashboard/default`}> 
                    <Image className="img-fluid" src={`${ImagePath}/logo/logo-icon.png`} width={32} height={32} alt="" />
                  </Link>
                  <div className="mobile-back text-end ">
                    <span>Back </span><i className="fa fa-angle-right ps-2" />
                  </div>
                </li>
                <li className={`pin-title sidebar-main-title ${pinedMenu.length > 1 ? "show" : ""} `}>
                  <div><h6>{Pinned}</h6></div>
                </li>
                <SidebarMenuList />
              </SimpleBar>
            </ul>
          </div>
          <div className={`right-arrow ${margin === -3500 ? "disabled" : ""}`} onClick={() => dispatch(scrollToRight())} id="right-arrow">
            <ArrowRight />
          </div>
        </nav>
      </div>
    </div>
  );
};