// Data/Layout/Menu.tsx - Complete Fixed Version with Field Engineer
import { MenuItem } from "@/Types/Layout.type";
import { useState, useEffect } from 'react';
import { getStoredUserTeam, mapTeamToRole, isAuthenticated } from "../../app/(MainBody)/services/userService";

// User role type definition - UPDATED to include Field Engineer
export type UserRole = 'ADMINISTRATOR' | 'INCIDENT_MANAGER' | 'INCIDENT_HANDLER' | 'FIELD_ENGINEER' | 'WATER_POLLUTION_EXPERT' | 'USER' | 'SLA_MANAGER';

export interface User {
  id?: string;
  email?: string;
  name?: string;
  team?: string;
}

// Enhanced useUserRole hook with localStorage
export const useUserRole = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('USER');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const determineUserRole = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isAuthenticated()) {
          setCurrentRole('USER');
          setIsLoading(false);
          return;
        }

        const storedTeam = getStoredUserTeam();
        const mappedRole = storedTeam ? mapTeamToRole(storedTeam) : 'USER';
        setCurrentRole(mappedRole as UserRole);
        setIsLoading(false);
      } catch (error: any) {
        setError(error.message || 'Failed to determine user role');
        setCurrentRole('USER');
        setIsLoading(false);
      }
    };

    determineUserRole();
  }, []);

  return {
    currentRole,
    isLoading,
    isAuthenticated: isAuthenticated(),
    error,
    getUserInfo: () => {
      if (isAuthenticated()) {
        return {
          id: localStorage.getItem('userId'),
          email: localStorage.getItem('userEmail'),
          name: localStorage.getItem('userName'),
          team: localStorage.getItem('userTeam')
        };
      }
      return null;
    },
    getTeamName: () => getStoredUserTeam() || 'Unknown Team'
  };
};

// Role utilities with comprehensive permission system - UPDATED
export const RoleUtils = {
  getDefaultDashboard: (role: UserRole): string => {
    const dashboardMap: Record<UserRole, string> = {
      'ADMINISTRATOR': '/dashboard/admin',
      'INCIDENT_MANAGER': '/dashboard/incident_manager',
      'INCIDENT_HANDLER': '/dashboard/incident_handler',
      'FIELD_ENGINEER': '/dashboard/field_engineer',
      'WATER_POLLUTION_EXPERT': '/dashboard/water_pollution_expert',
      'SLA_MANAGER': '/dashboard/slamanager',
      'USER': '/dashboard/enduser'
    };
    return dashboardMap[role] || '/dashboard/enduser';
  },

  canAccessAdmin: (role: UserRole): boolean => role === 'ADMINISTRATOR',
  canManageUsers: (role: UserRole): boolean => role === 'ADMINISTRATOR',
  canManageIncidents: (role: UserRole): boolean => ['ADMINISTRATOR', 'INCIDENT_MANAGER'].includes(role),
  canHandleIncidents: (role: UserRole): boolean => ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'INCIDENT_HANDLER', 'FIELD_ENGINEER', 'WATER_POLLUTION_EXPERT'].includes(role),
  canViewAllIncidents: (role: UserRole): boolean => ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'SLA_MANAGER'].includes(role),
  canCreateIncidents: (role: UserRole): boolean => true,
  canManageSLA: (role: UserRole): boolean => ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'SLA_MANAGER'].includes(role),
  canViewReports: (role: UserRole): boolean => ['ADMINISTRATOR', 'INCIDENT_MANAGER', 'SLA_MANAGER'].includes(role),

  getRoleDisplayName: (role: UserRole): string => {
    const displayNames: Record<UserRole, string> = {
      'ADMINISTRATOR': 'Administrator',
      'INCIDENT_MANAGER': 'Incident Manager',
      'INCIDENT_HANDLER': 'Incident Handler',
      'FIELD_ENGINEER': 'Field Engineer',
      'WATER_POLLUTION_EXPERT': 'Water Pollution Expert',
      'SLA_MANAGER': 'SLA Manager',
      'USER': 'End User'
    };
    return displayNames[role] || 'User';
  }
};

// Helper functions to create menu items with proper typing
const createMenuItem = (title: string, path: string, icon?: string): MenuItem => ({
  title,
  path,
  icon,
  type: "link"
});

const createMenuSection = (title: string, items: MenuItem[]): MenuItem => ({
  title,
  Items: items,
  type: "section"
});

const AdminMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("Admin Dashboard", "/dashboard/admin")
  ]),
  createMenuSection("Management", [
    {
      title: "Groups",
      type: "submenu",
      children: [
        createMenuItem("All Groups", "/dashboard?tab=all-groups"),
        createMenuItem("Create Group", "/dashboard?tab=create-group")
      ]
    },
    {
      title: "Users",
      type: "submenu",
      children: [
        createMenuItem("All Users", "/dashboard?tab=users")
      ]
    },
    {
      title: "Roles & Permissions",
      type: "submenu",
      children: [
        createMenuItem("All Roles", "/dashboard?tab=all-roles"),
        createMenuItem("Create Roles", "/dashboard?tab=create-roles"),
        createMenuItem("All Permissions", "/dashboard?tab=all-permissions"),
        createMenuItem("Create Permission", "/dashboard?tab=create-permission")
      ]
    }
  ]),
  createMenuSection("Incidents", [
    {
      title: "Incidents",
      type: "submenu",
      children: [
        createMenuItem("All Incidents", "/dashboard/admin?view=all-incidents"),
        createMenuItem("Create Incident", "/dashboard?tab=create-incident"),
        createMenuItem("Assign Incidents", "/dashboard/admin?view=assign-incidents"),
        createMenuItem("Manager Registration", "/dashboard?tab=create-manager"),
        createMenuItem("Handler Registration", "/dashboard?tab=create-handler")
      ]
    }
  ]),
  createMenuSection("Configuration", [
    {
      title: "Master Settings",
      type: "submenu",
      children: [
        createMenuItem("Sub-Category", "/dashboard?tab=subcategory"),
        createMenuItem("Contact Type", "/dashboard?tab=contact-type"),
        createMenuItem("Incident State", "/dashboard?tab=state"),
        createMenuItem("Impact", "/dashboard?tab=impact"),
        createMenuItem("Urgency", "/dashboard?tab=urgency")
      ]
    },
    {
      title: "Asset Management",
      type: "submenu",
      children: [
        createMenuItem("Asset State", "/dashboard?tab=asset-state"),
        createMenuItem("Asset Sub State", "/dashboard?tab=asset-substate"),
        createMenuItem("Asset Function", "/dashboard?tab=asset-function"),
        createMenuItem("Asset Location", "/dashboard?tab=asset-location"),
        createMenuItem("Department", "/dashboard?tab=department"),
        createMenuItem("Company", "/dashboard?tab=company"),
        createMenuItem("Stock Room", "/dashboard?tab=stock-room"),
        createMenuItem("Aisle", "/dashboard?tab=aisle"),
        createMenuItem("Add Asset", "/dashboard?tab=add-asset")
      ]
    },
    {
      title: "Site Management",
      type: "submenu",
      children: [
        createMenuItem("Site Type", "/dashboard/admin?tab=site-type"),
        createMenuItem("Sites", "/dashboard/admin?tab=sites")
      ]
    },
    {
      title: "SLA Management",
      type: "submenu",
      children: [
        createMenuItem("SLA Definitions", "/dashboard/admin?tab=sla-definitions"),
        createMenuItem("SLA Conditions", "/dashboard/admin?tab=ssla-conditions")
      ]
    }
  ])
];

const IncidentManagerMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("Manager Dashboard", "/dashboard/incident_manager", "dashboard")
  ]),
  createMenuSection("Incident Management", [
    createMenuItem("All Incidents", "/dashboard/incident_manager?view=all-incidents", "alert-triangle"),
    createMenuItem("Create Incident", "/dashboard?tab=create-incident", "plus-circle"),
    createMenuItem("Assign Incidents", "/dashboard/incident_manager?view=assign-incidents", "user-check"),
    createMenuItem("Pending EA approvals", "/dashboard?tab=pending-approval", "alert-triangle")
  ]),
  createMenuSection("SLA Management", [
    createMenuItem("Define SLA", "/dashboard?tab=sla-define", "clock"),
    createMenuItem("SLA Reports", "/dashboard?tab=sla-report", "bar-chart")
  ])
];

const IncidentHandlerMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("Handler Dashboard", "/dashboard/incident_handler", "dashboard")
  ]),
  createMenuSection("My Tasks", [
    createMenuItem("My Incidents", "/dashboard/incident_handler?view=all-incidents", "list"),
    createMenuItem("Create Incident", "/dashboard?tab=create-incident", "plus-circle"),
    createMenuItem("Assign to Others", "/dashboard/incident_handler?view=assign-incidents", "user-check")
  ])
];

// NEW - Field Engineer Menu
const FieldEngineerMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("Field Dashboard", "/dashboard/field_engineer", "map-pin")
  ]),
  createMenuSection("Field Work", [
    createMenuItem("My Assignments", "/dashboard/field_engineer?view=all-incidents", "clipboard-list"),
    createMenuItem("Site Inspections", "/dashboard/field_engineer", "search")
  ])
];

// NEW - Water Pollution Expert Menu
const WaterPollutionExpertMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("Expert Dashboard", "/dashboard/water_pollution_expert", "droplets")
  ]),
  createMenuSection("Water Quality", [
    createMenuItem("My Cases", "/dashboard/water_pollution_expert?view=all-incidents", "beaker"),
    createMenuItem("Water Testing", "/dashboard/water_pollution_expert", "flask")
  ])
];

const SLAManagerMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("SLA Dashboard", "/dashboard/developer", "dashboard")
  ]),
  createMenuSection("SLA Management", [
    createMenuItem("All Incidents", "/dashboard?tab=all-incidents", "alert-triangle"),
    createMenuItem("SLA Monitoring", "/dashboard?tab=sla-monitoring", "clock"),
    createMenuItem("SLA Reports", "/dashboard?tab=sla-reports", "bar-chart")
  ])
];

const EndUserMenuList: MenuItem[] = [
  createMenuSection("Dashboard", [
    createMenuItem("My Dashboard", "/dashboard/enduser", "dashboard")
  ]),
  createMenuSection("Incidents", [
    createMenuItem("Create Incident", "/dashboard?tab=create-incident", "plus-circle"),
    createMenuItem("All Incidents", "/dashboard/enduser?view=all-incidents", "list")
  ]),
  createMenuSection("Support", [
    createMenuItem("Help Center", "/dashboard?view=help", "help-circle"),
    createMenuItem("Contact Support", "/dashboard?view=support", "mail")
  ])
];

const GuestMenuList: MenuItem[] = [
  createMenuSection("Authentication", [
    createMenuItem("Login", "/auth/login", "log-in"),
    createMenuItem("Register", "/auth/register", "user-plus")
  ])
];

// Main functions - UPDATED to include new roles
export const getMenuByRole = (userRole: UserRole): MenuItem[] => {
  const menuMap: Record<UserRole, MenuItem[]> = {
    'ADMINISTRATOR': AdminMenuList,
    'INCIDENT_MANAGER': IncidentManagerMenuList,
    'INCIDENT_HANDLER': IncidentHandlerMenuList,
    'FIELD_ENGINEER': FieldEngineerMenuList,
    'WATER_POLLUTION_EXPERT': WaterPollutionExpertMenuList,
    'SLA_MANAGER': SLAManagerMenuList,
    'USER': EndUserMenuList
  };
  return menuMap[userRole] || EndUserMenuList;
};

export const getGuestMenu = (): MenuItem[] => GuestMenuList;

export const getMenuByUser = (): MenuItem[] => {
  if (!isAuthenticated()) {
    return getGuestMenu();
  }

  const storedTeam = getStoredUserTeam();
  const userTeam = storedTeam || 'USER';
  const role = mapTeamToRole(userTeam) as UserRole;

  return getMenuByRole(role);
};

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

export const filterMenuByPermissions = (menu: MenuItem[], userRole: UserRole): MenuItem[] => {
  return menu.filter(menuSection => {
    if (!validateMenuItem(menuSection)) {
      return false;
    }

    const filteredItems = menuSection.Items?.filter(item => {
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

// Export individual menus for backward compatibility - UPDATED
export {
  AdminMenuList,
  IncidentManagerMenuList,
  IncidentHandlerMenuList,
  FieldEngineerMenuList,
  WaterPollutionExpertMenuList,
  SLAManagerMenuList,
  EndUserMenuList,
  GuestMenuList
};

// Default export for backward compatibility
export const MenuList = EndUserMenuList;
