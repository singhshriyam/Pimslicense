import { ImagePath, Pinned } from "@/Constant";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "react-feather";
// @ts-ignore - SimpleBar may not have type definitions
import SimpleBar from "simplebar-react";
import { LogoWrapper } from "./LogoWrapper";
import SidebarMenuList from "./SideBarMenuList";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import Image from "next/image";
import ConfigDB from "@/Config/ThemeConfig";
import { scrollToLeft, scrollToRight } from "@/Redux/Reducers/Layout/LayoutSlice";
import { RoleUtils, useUserRole } from "@/Data/Layout/Menu";

export const SideBar = () => {
  const { toggleSidebar, pinedMenu, margin } = useAppSelector((state) => state.layout);
  const { currentRole, isAuthenticated } = useUserRole();
  const wrapper = ConfigDB.data.settings.layout_class;
  const dispatch = useAppDispatch();

  const dashboardPath = isAuthenticated
    ? RoleUtils.getDefaultDashboard(currentRole)
    : "/dashboard/enduser";

  const isHorizontal = wrapper === "horizontal-wrapper";
  const canScrollLeft = margin > 0;
  const canScrollRight = margin > -3500;

  return (
    <div className={`sidebar-wrapper ${toggleSidebar ? "close_icon" : ""}`} id="sidebar-wrapper">
      <div>
        <LogoWrapper />
        <nav className="sidebar-main">
          {isHorizontal && (
            <div
              className={`left-arrow ${!canScrollLeft ? "disabled" : ""}`}
              onClick={() => canScrollLeft && dispatch(scrollToLeft())}
              id="left-arrow"
            >
              <ArrowLeft />
            </div>
          )}

          <div
            id="sidebar-menu"
            style={{
              position: "inherit",
              marginLeft: isHorizontal ? `${margin}px` : "0px"
            }}
          >
            <ul className="sidebar-links custom-scrollbar" id="simple-bar">
              <SimpleBar style={{ width: "100%", height: "350px" }}>
                <li className="back-btn">
                  <Link href={dashboardPath}>
                    <Image
                      className="img-fluid"
                      src={`${ImagePath}/logo/logo-icon.png`}
                      width={32}
                      height={32}
                      alt="Back to Dashboard"
                    />
                  </Link>
                  <div className="mobile-back text-end">
                    <span>Back</span>
                    <i className="fa fa-angle-right ps-2" />
                  </div>
                </li>

                <SidebarMenuList />
              </SimpleBar>
            </ul>
          </div>

          {isHorizontal && (
            <div
              className={`right-arrow ${!canScrollRight ? "disabled" : ""}`}
              onClick={() => canScrollRight && dispatch(scrollToRight())}
              id="right-arrow"
            >
              <ArrowRight />
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};
