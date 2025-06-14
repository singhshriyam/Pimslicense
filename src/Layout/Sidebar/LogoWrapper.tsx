import { ImagePath } from "@/Constant";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import { setToggleSidebar } from "@/Redux/Reducers/Layout/LayoutSlice";
import { RoleUtils, useUserRole } from "@/Data/Layout/Menu";
import Image from "next/image";
import Link from "next/link";

export const LogoWrapper = () => {
  const { toggleSidebar } = useAppSelector((state) => state.layout);
  const { currentRole, isAuthenticated } = useUserRole();
  const dispatch = useAppDispatch();

  // Get dashboard path based on user role
  const dashboardPath = isAuthenticated
    ? RoleUtils.getDefaultDashboard(currentRole)
    : "/dashboard/enduser";

  return (
    <>
      <div className="logo-wrapper">
        <Link href={dashboardPath}>
          <Image
            className="img-fluid"
            src={`${ImagePath}/logo/apex-logo.png`}
            width={50}
            height={20}
            alt="Apex Logo"
          />
        </Link>
      </div>
      <div className="logo-icon-wrapper">
        <Link href={dashboardPath}>
          <Image
            className="img-fluid"
            src={`${ImagePath}/logo/logo-icon.png`}
            width={32}
            height={32}
            alt="Apex"
          />
        </Link>
      </div>
    </>
  );
};
