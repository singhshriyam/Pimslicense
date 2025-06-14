import { useAppSelector } from "@/Redux/Hooks";
import { Fragment, useState, useEffect } from "react";
import {
  getMenuByRole,
  getGuestMenu,
  useUserRole,
  filterMenuByPermissions
} from "@/Data/Layout/Menu";
import { MenuItem } from "@/Types/Layout.type";
import Menulist from "./Menulist";
import { useTranslation } from "react-i18next";
import { Alert } from "reactstrap";

const SidebarMenuList = () => {
  const [activeMenu, setActiveMenu] = useState<string[]>([]);
  const [currentMenu, setCurrentMenu] = useState<MenuItem[]>([]);
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const { t } = useTranslation("common");

  const {
    currentRole,
    isLoading,
    isAuthenticated,
    error: roleError
  } = useUserRole();

  const shouldHideMenu = (mainMenu: MenuItem): boolean => {
    return !mainMenu?.Items || mainMenu.Items.every((item: MenuItem) =>
      pinedMenu.includes(item.title || "")
    );
  };

  useEffect(() => {
    if (isLoading) return;

    try {
      let menu: MenuItem[];

      if (!isAuthenticated || roleError) {
        menu = getGuestMenu();
      } else {
        const roleBasedMenu = getMenuByRole(currentRole);
        menu = filterMenuByPermissions(roleBasedMenu, currentRole);
      }

      setCurrentMenu(menu);
    } catch (error) {
      console.error('Menu loading error:', error);
      setCurrentMenu(getGuestMenu());
    }
  }, [currentRole, isLoading, isAuthenticated, roleError]);

  // Loading state
  if (isLoading) {
    return (
      <li className="sidebar-main-title">
        <div className="d-flex align-items-center">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h6 className="mb-0">Loading menu...</h6>
        </div>
      </li>
    );
  }

  // Error state
  if (roleError) {
    return (
      <li className="sidebar-main-title">
        <div>
          <Alert color="warning" className="p-2 mb-2">
            <small>Menu Error: {roleError}</small>
          </Alert>
        </div>
      </li>
    );
  }

  // No menu available
  if (!currentMenu?.length) {
    return (
      <li className="sidebar-main-title">
        <div>
          <Alert color="info" className="p-2">
            <small>No menu items available</small>
          </Alert>
        </div>
      </li>
    );
  }

  return (
    <>
      {currentMenu.map((mainMenu: MenuItem, index) => {
        if (!mainMenu.Items?.length) return null;

        return (
          <Fragment key={`menu-${index}-${mainMenu.title}`}>
            <li className={`sidebar-main-title ${shouldHideMenu(mainMenu) ? "d-none" : ""}`}>
              <div>
                <h6 className={mainMenu.lanClass || ""}>
                  {t(mainMenu.title)}
                </h6>
              </div>
            </li>
            <Menulist
              menu={mainMenu.Items}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              level={0}
            />
          </Fragment>
        );
      })}
    </>
  );
};

export default SidebarMenuList;
