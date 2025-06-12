export interface User {
  id: string;
  name: string;
  email: string;
  team: string;
  role?: string;
  status: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user_id?: string;
    userId?: string;
    user?: any;
  };
  message: string;
}

// API Configuration
const API_BASE_URL = 'https://apexwpc.apextechno.co.uk/api';

// Token management
export const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const getStoredUserTeam = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('userTeam') || localStorage.getItem('userRole');
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const getStoredUserName = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('userName');
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const getStoredUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('userId');
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const getStoredUserEmail = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('userEmail');
    } catch (error) {
      return null;
    }
  }
  return null;
};

export const setStoredToken = (token: string, team: string, name: string, email?: string, userId?: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userTeam', team);
      localStorage.setItem('userName', name);

      if (email) {
        localStorage.setItem('userEmail', email);
      }

      if (userId) {
        localStorage.setItem('userId', userId);
      }

      localStorage.setItem('loginTimestamp', new Date().toISOString());
    } catch (error) {
      // Silent error handling
    }
  }
};

// Auth headers
const getAuthHeaders = (token?: string) => {
  const authToken = token || getStoredToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

// Login function
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Login failed: ${response.status}`;

      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch (parseError) {
        errorMessage += ` - ${responseText}`;
      }

      throw new Error(errorMessage);
    }

    const loginData = JSON.parse(responseText);

    if (loginData.success && loginData.data?.token) {
      let userId: string | undefined;
      let userTeam = 'USER';
      let userName = email.split('@')[0];

      // Try to decode JWT to get user info
      try {
        const tokenParts = loginData.data.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.sub || payload.user_id || payload.id;
          userTeam = payload.team || payload.role || 'USER';
          userName = payload.name || payload.username || userName;
        }
      } catch (error) {
        // Silent error handling
      }

      // Use data from API response if available
      if (loginData.data.user) {
        userId = loginData.data.user.id || userId;
        userTeam = loginData.data.user.team || loginData.data.user.role || userTeam;
        userName = loginData.data.user.name || loginData.data.user.username || userName;
      }

      // Use explicit user_id if provided
      if (loginData.data.user_id || loginData.data.userId) {
        userId = loginData.data.user_id || loginData.data.userId;
      }

      // Store session data
      setStoredToken(
        loginData.data.token,
        userTeam,
        userName,
        email,
        userId
      );

      return {
        success: loginData.success,
        data: {
          token: loginData.data.token,
          userId: userId,
          user: {
            id: userId,
            name: userName,
            email: email,
            team: userTeam
          }
        },
        message: loginData.message
      };
    } else {
      const errorMessage = loginData.message || 'Login failed - invalid response format';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    throw error;
  }
};

// Fetch users
export const fetchAllUsers = async (token?: string): Promise<User[]> => {
  const authToken = token || getStoredToken();

  if (!authToken) {
    throw new Error('No authentication token available. Please log in again.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders(authToken),
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        logoutUser();
        throw new Error('Authentication token expired. Please log in again.');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const responseData = await response.json();

    // Handle different response formats
    let usersArray = [];
    if (responseData.success && responseData.data) {
      usersArray = responseData.data;
    } else if (Array.isArray(responseData)) {
      usersArray = responseData;
    } else if (responseData.users && Array.isArray(responseData.users)) {
      usersArray = responseData.users;
    } else {
      throw new Error('Unexpected users API response format');
    }

    // Transform users data
    const transformedUsers: User[] = usersArray.map((user: any, index: number) => ({
      id: user.id || user._id || user.userId || index.toString(),
      name: user.name || user.username || user.full_name || user.displayName || 'Unknown User',
      email: user.email || user.emailAddress || user.mail || '',
      team: user.team || user.role || user.department || user.group || 'Unknown',
      role: user.role || user.team || user.userRole || 'User',
      status: user.status || (user.active !== undefined ? (user.active ? 'Active' : 'Inactive') : 'Active')
    }));

    return transformedUsers;
  } catch (error: any) {
    throw error;
  }
};

// Utility functions
export const getUserStats = (users: User[]) => {
  const stats = {
    total: users.length,
    administrators: 0,
    managers: 0,
    handlers: 0,
    endUsers: 0,
    slaManagers: 0,
    active: 0,
    admins: 0
  };

  users.forEach(user => {
    const teamLower = (user.team || user.role || '').toLowerCase().trim();

    if (teamLower.includes('admin')) {
      stats.administrators++;
      stats.admins++;
    } else if (teamLower.includes('manager') && !teamLower.includes('sla')) {
      stats.managers++;
    } else if (teamLower.includes('handler')) {
      stats.handlers++;
    } else if (teamLower.includes('sla')) {
      stats.slaManagers++;
    } else {
      stats.endUsers++;
    }

    if (user.status?.toLowerCase() === 'active') {
      stats.active++;
    }
  });

  return stats;
};

// Team to dashboard mapping - SAME AS LOGIN AND MAIN DASHBOARD
export const getTeamDashboard = (team: string): string => {
  if (!team) return '/dashboard/enduser';

  const teamLower = team.toLowerCase().trim();

  // Exact matches first
  if (teamLower === 'incident manager' || teamLower === 'incident_manager') {
    return '/dashboard/incident_manager';
  }

  if (teamLower === 'incident handler' || teamLower === 'incident_handler') {
    return '/dashboard/incident_handler';
  }

  if (teamLower === 'administrator' || teamLower === 'admin') {
    return '/dashboard/admin';
  }

  if (teamLower === 'developer' || teamLower === 'dev') {
    return '/dashboard/developer';
  }

  // Partial matches
  if (teamLower.includes('manager')) {
    return '/dashboard/incident_manager';
  }

  if (teamLower.includes('handler')) {
    return '/dashboard/incident_handler';
  }

  if (teamLower.includes('admin')) {
    return '/dashboard/admin';
  }

  if (teamLower.includes('dev')) {
    return '/dashboard/developer';
  }

  return '/dashboard/enduser';
};

export const mapTeamToRole = (team: string): string => {
  if (!team) return 'USER';

  const teamLower = team.toLowerCase().trim();

  switch (teamLower) {
    case 'administrator':
    case 'admin':
      return 'ADMINISTRATOR';
    case 'incident manager':
    case 'incident_manager':
      return 'INCIDENT_MANAGER';
    case 'incident handler':
    case 'incident_handler':
    case 'incident handeller':
      return 'INCIDENT_HANDLER';
    case 'sla manager':
    case 'sla_manager':
      return 'SLA_MANAGER';
    case 'developer':
      return 'DEVELOPER';
    case 'user':
    case 'end user':
    default:
      return 'USER';
  }
};

// Authentication utilities
export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove = [
        'authToken',
        'userTeam',
        'userRole',
        'userName',
        'userId',
        'userEmail',
        'loginTimestamp'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      // Silent error handling
    }
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = getStoredToken();
    const userId = getStoredUserId();
    return !!(token && userId);
  } catch (error) {
    return false;
  }
};

export const validateToken = async (token?: string): Promise<boolean> => {
  try {
    const authToken = token || getStoredToken();
    if (!authToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'HEAD',
      headers: getAuthHeaders(authToken)
    });

    const isValid = response.ok;

    if (!isValid && response.status === 401) {
      logoutUser();
    }

    return isValid;
  } catch (error) {
    return false;
  }
};

// Session management utilities
export const getSessionInfo = () => {
  return {
    token: getStoredToken(),
    userId: getStoredUserId(),
    userName: getStoredUserName(),
    userEmail: getStoredUserEmail(),
    userTeam: getStoredUserTeam(),
    isAuthenticated: isAuthenticated(),
    loginTimestamp: typeof window !== 'undefined' ? localStorage.getItem('loginTimestamp') : null
  };
};

export const refreshSession = async (): Promise<boolean> => {
  try {
    const sessionInfo = getSessionInfo();

    if (!sessionInfo.isAuthenticated) {
      return false;
    }

    const isValid = await validateToken(sessionInfo.token || undefined);

    if (!isValid) {
      logoutUser();
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
