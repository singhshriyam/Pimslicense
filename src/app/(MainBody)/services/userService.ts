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

// Token management with better error handling
export const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Error accessing localStorage for token:', error);
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
      console.error('Error accessing localStorage for team:', error);
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
      console.error('Error accessing localStorage for name:', error);
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
      console.error('Error accessing localStorage for userId:', error);
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
      console.error('Error accessing localStorage for email:', error);
      return null;
    }
  }
  return null;
};

export const setStoredToken = (token: string, team: string, name: string, email?: string, userId?: string): void => {
  if (typeof window !== 'undefined') {
    try {
      console.log('💾 STORING SESSION DATA:', {
        token: !!token,
        team,
        name,
        email,
        userId,
        timestamp: new Date().toISOString()
      });

      localStorage.setItem('authToken', token);
      localStorage.setItem('userTeam', team);
      localStorage.setItem('userRole', team); // Store as both for compatibility
      localStorage.setItem('userName', name);

      if (email) {
        localStorage.setItem('userEmail', email);
      }

      if (userId) {
        localStorage.setItem('userId', userId);
      }

      // Store login timestamp
      localStorage.setItem('loginTimestamp', new Date().toISOString());

      // Verify storage worked
      console.log('✅ VERIFICATION - Stored values:');
      console.log('  Token stored:', !!localStorage.getItem('authToken'));
      console.log('  UserId stored:', localStorage.getItem('userId'));
      console.log('  Email stored:', localStorage.getItem('userEmail'));
      console.log('  Team stored:', localStorage.getItem('userTeam'));
      console.log('  Name stored:', localStorage.getItem('userName'));
    } catch (error) {
      console.error('Error storing session data:', error);
    }
  }
};

// Auth headers with improved error handling
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

// Enhanced login function with better error handling
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('🔑 Attempting login for:', email);

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
    console.log('📝 Login response status:', response.status);
    console.log('📝 Login response:', responseText.substring(0, 500));

    if (!response.ok) {
      let errorMessage = `Login failed: ${response.status}`;

      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch (parseError) {
        errorMessage += ` - ${responseText}`;
      }

      console.error('❌ Login failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const loginData = JSON.parse(responseText);
    console.log('✅ Login successful:', loginData);

    // Handle the response format: { success: true, data: { token: "..." }, message: "..." }
    if (loginData.success && loginData.data?.token) {
      let userId: string | undefined;
      let userTeam = 'USER'; // Default team
      let userName = email.split('@')[0]; // Default name

      // Try to decode JWT to get user ID and other info
      try {
        const tokenParts = loginData.data.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userId = payload.sub || payload.user_id || payload.id;
          userTeam = payload.team || payload.role || 'USER';
          userName = payload.name || payload.username || userName;

          console.log('🎫 JWT payload:', payload);
        }
      } catch (error) {
        console.warn('⚠️ Could not decode JWT, using defaults:', error);
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

      // Store all the session data
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
      console.error('❌ Login failed:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

// Fetch users with better error handling
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
        // Clear stored data on auth failure
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
    console.error('❌ Fetch users error:', error);
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
    active: 0
  };

  users.forEach(user => {
    const teamLower = (user.team || user.role || '').toLowerCase().trim();

    if (teamLower.includes('admin')) {
      stats.administrators++;
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

// Enhanced authentication utilities
export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    try {
      console.log('🚪 Logging out user...');

      // Clear all stored data
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

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = getStoredToken();
    const userId = getStoredUserId();

    // Check if we have both token and user ID
    const hasValidSession = !!(token && userId);

    console.log('🔍 Authentication check:', {
      hasToken: !!token,
      hasUserId: !!userId,
      isAuthenticated: hasValidSession
    });

    return hasValidSession;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const validateToken = async (token?: string): Promise<boolean> => {
  try {
    const authToken = token || getStoredToken();
    if (!authToken) {
      console.log('🚫 No token to validate');
      return false;
    }

    // Simple validation - try to make a request
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'HEAD',
      headers: getAuthHeaders(authToken)
    });

    const isValid = response.ok;
    console.log('🎫 Token validation result:', isValid);

    if (!isValid && response.status === 401) {
      // Token is invalid, clear it
      logoutUser();
    }

    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
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
      console.log('🚫 No valid session to refresh');
      return false;
    }

    // Validate current token
    const isValid = await validateToken(sessionInfo.token || undefined);

    if (!isValid) {
      console.log('🚫 Session is no longer valid');
      logoutUser();
      return false;
    }

    console.log('✅ Session is still valid');
    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
};

// Debug function
export const debugSession = () => {
  const sessionInfo = getSessionInfo();
  console.log('🔍 Session Debug Info:', sessionInfo);
  return sessionInfo;
};
