// Components/Layout/SideBarMenuList.tsx - Production Ready Version
import { useAppSelector } from "@/Redux/Hooks";
import { Fragment, useState, useEffect } from "react";
import {
  getMenuByRole,
  getGuestMenu,
  useUserRole,
  filterMenuByPermissions,
  type MenuItem,
  type UserRole
} from "@/Data/Layout/Menu";
import Menulist from "./Menulist";
import { useTranslation } from "react-i18next";
import { Alert } from "reactstrap";

const SidebarMenuList = () => {
  const [activeMenu, setActiveMenu] = useState<string[]>([]);
  const [currentMenu, setCurrentMenu] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);
  const { pinedMenu } = useAppSelector((state) => state.layout);

  // Get user role and authentication status
  const {
    currentRole,
    isLoading,
    isAuthenticated,
    error: roleError
  } = useUserRole();

  const { t } = useTranslation("common");

  // Helper function to check if menu should be hidden
  const shouldHideMenu = (mainMenu: MenuItem): boolean => {
    if (!mainMenu?.Items) return true;

    return mainMenu.Items.every((item) =>
      pinedMenu.includes(item.title || "")
    );
  };

  // Effect to load menu based on authentication and role
  useEffect(() => {
    const loadMenu = () => {
      try {
        setMenuError(null);

        if (isLoading) {
          // Don't update menu while loading
          return;
        }

        if (roleError) {
          setMenuError(roleError);
          setCurrentMenu(getGuestMenu());
          return;
        }

        if (!isAuthenticated) {
          // Show guest menu for unauthenticated users
          setCurrentMenu(getGuestMenu());
          return;
        }

        // Get role-based menu for authenticated users
        const roleBasedMenu = getMenuByRole(currentRole);

        if (!roleBasedMenu || roleBasedMenu.length === 0) {
          throw new Error(`No menu available for role: ${currentRole}`);
        }

        // Filter menu based on user permissions
        const filteredMenu = filterMenuByPermissions(roleBasedMenu, currentRole);

        if (filteredMenu.length === 0) {
          throw new Error('No accessible menu items found for your role');
        }

        setCurrentMenu(filteredMenu);

      } catch (error: any) {
        console.error('Menu loading error:', error);
        setMenuError(error.message || 'Failed to load menu');

        // Fallback to guest menu on error
        setCurrentMenu(getGuestMenu());
      }
    };

    loadMenu();
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
  if (menuError) {
    return (
      <>
        <li className="sidebar-main-title">
          <div>
            <Alert color="warning" className="p-2 mb-2">
              <small>Menu Error: {menuError}</small>
            </Alert>
          </div>
        </li>
        {/* Still show whatever menu we have */}
        {currentMenu.map((mainMenu: MenuItem, index) => (
          <Fragment key={`error-menu-${index}`}>
            <li className={`sidebar-main-title ${shouldHideMenu(mainMenu) ? "d-none" : ""}`}>
              <div>
                <h6 className={mainMenu.lanClass || ""}>
                  {t(mainMenu.title)}
                </h6>
              </div>
            </li>
            {mainMenu.Items && (
              <Menulist
                menu={mainMenu.Items}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                level={0}
              />
            )}
          </Fragment>
        ))}
      </>
    );
  }

  // No menu available
  if (!currentMenu || currentMenu.length === 0) {
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

  // Authentication status indicator for unauthenticated users
  if (!isAuthenticated) {
    return (
      <>
        <li className="sidebar-main-title">
          <div>
            <h6 className="text-muted">Please sign in</h6>
          </div>
        </li>
        {currentMenu.map((mainMenu: MenuItem, index) => (
          <Fragment key={`guest-menu-${index}`}>
            <li className={`sidebar-main-title ${shouldHideMenu(mainMenu) ? "d-none" : ""}`}>
              <div>
                <h6 className={mainMenu.lanClass || ""}>
                  {t(mainMenu.title)}
                </h6>
              </div>
            </li>
            {mainMenu.Items && (
              <Menulist
                menu={mainMenu.Items}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                level={0}
              />
            )}
          </Fragment>
        ))}
      </>
    );
  }

  // Normal authenticated menu rendering
  return (
    <>
      {currentMenu.map((mainMenu: MenuItem, index) => {
        // Skip empty menu sections
        if (!mainMenu.Items || mainMenu.Items.length === 0) {
          return null;
        }

        return (
          <Fragment key={`menu-section-${index}-${mainMenu.title}`}>
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

      {/* Role indicator for debugging in development */}
      {process.env.NODE_ENV === 'development' && (
        <li className="sidebar-main-title mt-3">
          <div>
            <small className="text-muted">
              Role: {currentRole}
            </small>
          </div>
        </li>
      )}
    </>
  );
};

export default SidebarMenuList;
