// Data/Layout/Menu.tsx - Production Ready Version
import { MenuItem } from "@/Types/Layout.type";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { getStoredUserTeam, mapTeamToRole, isAuthenticated } from "../../app/(MainBody)/services/userService";

// User role type definition
export type UserRole = 'ADMINISTRATOR' | 'INCIDENT_MANAGER' | 'INCIDENT_HANDLER' | 'USER' | 'SLA_MANAGER' | 'DEVELOPER';

export interface NextAuthUser {
  id?: string;
  email?: string;
  name?: string;
  team?: string;
}

// Enhanced useUserRole hook with proper error handling
export const useUserRole = () => {
  const { data: session, status } = useSession();
  const [currentRole, setCurrentRole] = useState<UserRole>('USER');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const determineUserRole = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (status === 'loading') {
          return; // Still loading session
        }

        if (status === 'unauthenticated') {
          setCurrentRole('USER');
          setIsLoading(false);
          return;
        }

        if (status === 'authenticated') {
          // Check if we have valid stored session data
          if (!isAuthenticated()) {
            setError('Session data invalid. Please log in again.');
            setCurrentRole('USER');
            setIsLoading(false);
            return;
          }

          // Get role from stored data first (more reliable)
          const storedTeam = getStoredUserTeam();
          let userTeam = storedTeam;

          // Fallback to session data if stored data not available
          if (!userTeam && session?.user) {
            const user = session.user as NextAuthUser;
            userTeam = user.team;
          }

          if (!userTeam) {
            console.warn('No team/role information found, defaulting to USER');
            setCurrentRole('USER');
          } else {
            const mappedRole = mapTeamToRole(userTeam);
            setCurrentRole(mappedRole as UserRole);
          }
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error determining user role:', error);
        setError(error.message || 'Failed to determine user role');
        setCurrentRole('USER');
        setIsLoading(false);
      }
    };

    determineUserRole();
  }, [session, status]);

  return {
    currentRole,
    isLoading,
    isAuthenticated: status === 'authenticated' && isAuthenticated(),
    session,
    error,
    getUserInfo: () => {
      if (status === 'authenticated' && session?.user) {
        return session.user as NextAuthUser;
      }
      return null;
    },
    getTeamName: () => {
      const storedTeam = getStoredUserTeam();
      if (storedTeam) return storedTeam;

      if (status === 'authenticated' && session?.user) {
        return (session.user as NextAuthUser)?.team || 'Unknown Team';
      }

      return 'Unknown Team';
    }
  };
};

// Role utilities with comprehensive permission system
export const RoleUtils = {
  // Get dashboard path based on role
  getDefaultDashboard: (role: UserRole): string => {
    const dashboardMap: Record<UserRole, string> = {
      'ADMINISTRATOR': '/dashboard/admin',
      'INCIDENT_MANAGER': '/dashboard/incident_manager',
      'INCIDENT_HANDLER': '/dashboard/incident_handler',
      'SLA_MANAGER': '/dashboard/sla_manager',
      'DEVELOPER': '/dashboard/developer',
      'USER': '/dashboard/enduser'
    };

    return dashboardMap[role] || '/dashboard/enduser';
  },

  // Permission checks
  canAccessAdmin: (role: UserRole): boolean => role === 'ADMINISTRATOR',

  canManageUsers: (role: UserRole): boolean => role === 'ADMINISTRATOR',

  canManageIncidents: (role: UserRole): boolean =>
    ['ADMINISTRATOR', 'INCIDENT_MANAGER'].includes(role),

  canHandleIncidents: (role: UserRole): boolean =>
    ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'INCIDENT_HANDLER'].includes(role),

  canViewAllIncidents: (role: UserRole): boolean =>
    ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'SLA_MANAGER'].includes(role),

  canCreateIncidents: (role: UserRole): boolean => true, // All users can create incidents

  canManageSLA: (role: UserRole): boolean =>
    ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'SLA_MANAGER'].includes(role),

  canViewReports: (role: UserRole): boolean =>
    ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'SLA_MANAGER'].includes(role),

  // Get role display name
  getRoleDisplayName: (role: UserRole): string => {
    const displayNames: Record<UserRole, string> = {
      'ADMINISTRATOR': 'Administrator',
      'INCIDENT_MANAGER': 'Incident Manager',
      'INCIDENT_HANDLER': 'Incident Handler',
      'SLA_MANAGER': 'SLA Manager',
      'DEVELOPER': 'Developer',
      'USER': 'End User'
    };

    return displayNames[role] || 'User';
  }
};

// Menu definitions - Production ready with proper validation
const AdminMenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        title: "Admin Dashboard",
        icon: "dashboard",
        path: "/dashboard/admin"
      }
    ]
  },
  {
    title: "User Management",
    Items: [
      {
        title: "Users",
        icon: "user",
        children: [
          { title: "All Users", path: "/dashboard/admin/users" },
          { title: "Create User", path: "/dashboard/admin/users/create" }
        ]
      },
      {
        title: "Roles & Permissions",
        icon: "shield",
        path: "/dashboard/admin/permissions"
      }
    ]
  },
  {
    title: "Incident Management",
    Items: [
      {
        title: "Incidents",
        icon: "alert-triangle",
        children: [
          { title: "All Incidents", path: "/dashboard?tab=all-incidents" },
          { title: "Create Incident", path: "/dashboard?tab=create-incident" },
          { title: "Reports", path: "/dashboard/admin/reports" }
        ]
      }
    ]
  },
  {
    title: "System",
    Items: [
      {
        title: "Settings",
        icon: "settings",
        path: "/dashboard/admin/settings"
      },
      {
        title: "System Health",
        icon: "activity",
        path: "/dashboard/admin/health"
      }
    ]
  }
];

const IncidentManagerMenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        title: "Manager Dashboard",
        icon: "dashboard",
        path: "/dashboard/incident_manager"
      }
    ]
  },
  {
    title: "Incident Management",
    Items: [
      {
        title: "All Incidents",
        icon: "alert-triangle",
        path: "/dashboard?tab=all-incidents"
      },
      {
        title: "Create Incident",
        icon: "plus-circle",
        path: "/dashboard?tab=create-incident"
      },
      {
        title: "Assign Incidents",
        icon: "user-check",
        path: "/dashboard/management/assign"
      }
    ]
  },
  {
    title: "SLA Management",
    Items: [
      {
        title: "Define SLA",
        icon: "clock",
        path: "/dashboard/management/sla/define"
      },
      {
        title: "SLA Reports",
        icon: "bar-chart",
        path: "/dashboard/management/sla/reports"
      }
    ]
  },
  {
    title: "Reports",
    Items: [
      {
        title: "Incident Reports",
        icon: "file-text",
        path: "/dashboard/management/reports"
      }
    ]
  }
];

const IncidentHandlerMenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        title: "Handler Dashboard",
        icon: "dashboard",
        path: "/dashboard/incident_handler"
      }
    ]
  },
  {
    title: "My Tasks",
    Items: [
      {
        title: "Assigned Incidents",
        icon: "list",
        path: "/dashboard?tab=all-incidents"
      },
      {
        title: "Create Incident",
        icon: "plus-circle",
        path: "/dashboard?tab=create-incident"
      }
    ]
  },
  {
    title: "Knowledge Base",
    Items: [
      {
        title: "Procedures",
        icon: "book",
        path: "/dashboard/handler/procedures"
      },
      {
        title: "FAQ",
        icon: "help-circle",
        path: "/dashboard/handler/faq"
      }
    ]
  }
];

const SLAManagerMenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        title: "SLA Dashboard",
        icon: "dashboard",
        path: "/dashboard/sla_manager"
      }
    ]
  },
  {
    title: "SLA Management",
    Items: [
      {
        title: "All Incidents",
        icon: "alert-triangle",
        path: "/dashboard?tab=all-incidents"
      },
      {
        title: "SLA Monitoring",
        icon: "clock",
        path: "/dashboard/sla/monitoring"
      },
      {
        title: "SLA Reports",
        icon: "bar-chart",
        path: "/dashboard/sla/reports"
      }
    ]
  }
];

const DeveloperMenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        title: "Developer Dashboard",
        icon: "dashboard",
        path: "/dashboard/developer"
      }
    ]
  },
  {
    title: "Development",
    Items: [
      {
        title: "All Incidents",
        icon: "alert-triangle",
        path: "/dashboard?tab=all-incidents"
      },
      {
        title: "Create Incident",
        icon: "plus-circle",
        path: "/dashboard?tab=create-incident"
      },
      {
        title: "System Logs",
        icon: "terminal",
        path: "/dashboard/developer/logs"
      }
    ]
  }
];

const EndUserMenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [
      {
        title: "My Dashboard",
        icon: "dashboard",
        path: "/dashboard/enduser"
      }
    ]
  },
  {
    title: "My Incidents",
    Items: [
      {
        title: "Create Incident",
        icon: "plus-circle",
        path: "/dashboard?tab=create-incident"
      },
      {
        title: "My Incidents",
        icon: "list",
        path: "/dashboard?tab=all-incidents"
      }
    ]
  },
  {
    title: "Support",
    Items: [
      {
        title: "Help Center",
        icon: "help-circle",
        path: "/dashboard/enduser/help"
      },
      {
        title: "Contact Support",
        icon: "mail",
        path: "/dashboard/enduser/contact"
      }
    ]
  }
];

// Guest menu for unauthenticated users
const GuestMenuList: MenuItem[] = [
  {
    title: "Authentication",
    Items: [
      {
        title: "Login",
        icon: "log-in",
        path: "/auth/login",
      },
      {
        title: "Register",
        icon: "user-plus",
        path: "/auth/register",
      }
    ]
  }
];

// Function to get menu based on user role with validation
export const getMenuByRole = (userRole: UserRole): MenuItem[] => {
  const menuMap: Record<UserRole, MenuItem[]> = {
    'ADMINISTRATOR': AdminMenuList,
    'INCIDENT_MANAGER': IncidentManagerMenuList,
    'INCIDENT_HANDLER': IncidentHandlerMenuList,
    'SLA_MANAGER': SLAManagerMenuList,
    'DEVELOPER': DeveloperMenuList,
    'USER': EndUserMenuList
  };

  const menu = menuMap[userRole];

  if (!menu) {
    console.warn(`No menu found for role: ${userRole}, defaulting to EndUser menu`);
    return EndUserMenuList;
  }

  return menu;
};

// Function to get menu for unauthenticated users
export const getGuestMenu = (): MenuItem[] => {
  return GuestMenuList;
};

// Function to get menu with NextAuth session data
export const getMenuBySession = (session: any): MenuItem[] => {
  if (!session?.user) {
    return getGuestMenu();
  }

  const user = session.user as NextAuthUser;
  const storedTeam = getStoredUserTeam();
  const userTeam = storedTeam || user.team || 'USER';
  const role = mapTeamToRole(userTeam) as UserRole;

  return getMenuByRole(role);
};

// Menu validation function
export const validateMenuItem = (item: MenuItem): boolean => {
  if (!item.title) return false;

  if (item.Items) {
    return item.Items.every(subItem => validateMenuItem(subItem));
  }

  if (item.children) {
    return item.children.every(child => validateMenuItem(child));
  }

  return true;
};

// Function to filter menu items based on permissions
export const filterMenuByPermissions = (menu: MenuItem[], userRole: UserRole): MenuItem[] => {
  return menu.filter(menuSection => {
    if (!validateMenuItem(menuSection)) {
      console.warn(`Invalid menu item found: ${menuSection.title}`);
      return false;
    }

    // Filter menu items based on role permissions
    const filteredItems = menuSection.Items?.filter(item => {
      // Basic permission checks
      if (item.path?.includes('/admin/') && !RoleUtils.canAccessAdmin(userRole)) {
        return false;
      }

      if (item.path?.includes('/management/') && !RoleUtils.canManageIncidents(userRole)) {
        return false;
      }

      if (item.path?.includes('/sla/') && !RoleUtils.canManageSLA(userRole)) {
        return false;
      }

      return true;
    });

    return filteredItems && filteredItems.length > 0;
  }).map(menuSection => ({
    ...menuSection,
    Items: menuSection.Items?.filter(item => {
      // Apply the same filters to the mapped items
      if (item.path?.includes('/admin/') && !RoleUtils.canAccessAdmin(userRole)) {
        return false;
      }

      if (item.path?.includes('/management/') && !RoleUtils.canManageIncidents(userRole)) {
        return false;
      }

      if (item.path?.includes('/sla/') && !RoleUtils.canManageSLA(userRole)) {
        return false;
      }

      return true;
    })
  }));
};

// Export individual menus for backward compatibility and testing
export {
  AdminMenuList,
  IncidentManagerMenuList,
  IncidentHandlerMenuList,
  SLAManagerMenuList,
  DeveloperMenuList,
  EndUserMenuList,
  GuestMenuList
};

// Default export for backward compatibility
export const MenuList = EndUserMenuList;
