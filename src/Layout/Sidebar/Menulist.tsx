import { useEffect } from "react";
import SVG from "@/CommonComponent/SVG";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import { MenuListType, SidebarItemTypes, MenuItem } from "@/Types/Layout.type";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { handlePined } from "@/Redux/Reducers/Layout/LayoutSlice";
import { useTranslation } from "react-i18next";

const Menulist: React.FC<MenuListType> = ({
  menu,
  setActiveMenu,
  activeMenu,
  level,
  className
}) => {
  const { pinedMenu } = useAppSelector((state) => state.layout);
  const { sidebarIconType } = useAppSelector((state) => state.themeCustomizer);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { t } = useTranslation("common");

  const isActiveUrl = (path?: string): boolean => {
    return pathname === path;
  };

  const shouldSetActive = (item: MenuItem): boolean => {
    if (item?.path === pathname) return true;

    if (item?.children) {
      return item.children.some((subItem: MenuItem) => shouldSetActive(subItem));
    }

    return false;
  };

  const isMenuActive = (item: MenuItem): boolean => {
    const hasActiveChild = item.children
      ? item.children.some((child: MenuItem) => isActiveUrl(child.path))
      : false;

    return isActiveUrl(item.path) || hasActiveChild || activeMenu[level] === item.title;
  };

  useEffect(() => {
    menu?.forEach((item: MenuItem) => {
      if (shouldSetActive(item)) {
        const temp = [...activeMenu];
        temp[level] = item.title;
        setActiveMenu(temp);
      }
    });
  }, [pathname, menu, level]);

  const handleMenuClick = (item: MenuItem) => {
    const temp = [...activeMenu];
    temp[level] = item.title !== temp[level] ? item.title : '';
    setActiveMenu(temp);
  };

  return (
    <>
      {menu?.map((item: MenuItem, index: number) => {
        const isActive = isMenuActive(item);
        const isPined = pinedMenu.includes(item.title || "");

        return (
          <li
            key={index}
            className={`
              ${level === 0 ? "sidebar-list" : ""}
              ${isPined ? "pined" : ""}
              ${isActive ? "active" : ""}
            `.trim()}
          >
            {level === 0 && (
              <i
                className="fa fa-thumb-tack"
                onClick={() => dispatch(handlePined(item.title || ""))}
              />
            )}

            <Link
              className={`
                ${!className && level !== 2 ? "sidebar-link sidebar-title" : ""}
                ${isActive ? "active" : ""}
              `.trim()}
              href={item?.path || "#"}
              onClick={() => handleMenuClick(item)}
            >
              {item.icon && (
                <SVG
                  className={`${sidebarIconType}-icon`}
                  iconId={`${sidebarIconType}-${item.icon}`}
                />
              )}

              <span className={item.lanClass || ""}>
                {t(item.title || "")}
              </span>

              {item.children && (
                <div className="according-menu">
                  <i className={`fa fa-angle-${activeMenu[level] === item.title ? 'down' : 'right'}`} />
                </div>
              )}
            </Link>

            {item.children && (
              <ul
                className={`${level !== 0 ? "nav-sub-childmenu submenu-content" : "sidebar-submenu"}`}
                style={{
                  display: isActive ? "block" : "none"
                }}
              >
                <Menulist
                  menu={item.children}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  level={level + 1}
                  className="sidebar-submenu" 
                />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
};

export default Menulist;
