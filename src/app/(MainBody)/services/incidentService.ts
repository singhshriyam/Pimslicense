import { getStoredToken, getStoredUserId, getCurrentUser } from './userService';

const API_BASE_URL = 'https://apexwpc.apextechno.co.uk/api';

// Use backend data structure as-is
export interface Incident {
  id: number;
  user_id: number;
  user: any;
  site_id: number | null;
  site: any | null;
  asset_id: number | null;
  asset: any | null;
  category_id: number | null;
  category_name: string;
  category: any | null;
  subcategory_id: number | null;
  subcategory: any | null;
  contact_type_id: number;
  contact_type: any;
  impact_id: number | null;
  impact: any | null;
  priority_id: number | null;
  priority: any | null;
  urgency_id: number;
  urgency: any;
  assigned_to_id: number;
  assigned_to: any;
  incidentstate_id: number;
  incidentstate: any;
  incident_no: string;
  opened_at: string;
  closed_at: string | null;
  short_description: string;
  description: string;
  reported_by: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  narration: string | null;
  root_cause_analysis: string | null;
  conclusion: string | null;
  created_by_id: number;
  updated_by_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Get user ID directly from localStorage
const getUserId = (): string => {
  const userId = getStoredUserId();
  if (userId && userId !== '0') {
    console.log('Using user ID from localStorage:', userId);
    return userId;
  }

  // This should not happen in production if authentication is working
  console.error('No user ID found in localStorage - authentication may be incomplete');
  throw new Error('User ID not found - please log in again');
};

// API call helper
const makeApiCall = async (endpoint: string, method: string = 'GET', body?: any): Promise<any> => {
  const token = getStoredToken();

  if (!token) {
    throw new Error('Authentication token not found');
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error ${response.status}:`, errorText);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'API call failed');
  }

  return result.data;
};

// Incident fetching functions
export const fetchHandlerIncidents = async (): Promise<Incident[]> => {
  const userId = getUserId();
  return makeApiCall('/incident-handler/incident-list', 'POST', { assigned_to_id: parseInt(userId) });
};

export const fetchManagerIncidents = async (): Promise<Incident[]> => {
  const userId = getUserId();
  return makeApiCall('/incident-manager/incident-list', 'POST', { manager_id: parseInt(userId) });
};

export const fetchEndUserIncidents = async (): Promise<Incident[]> => {
  const userId = getUserId();
  const token = getStoredToken();

  if (!token) {
    throw new Error('Authentication token not found');
  }

  if (!userId || userId === '0') {
    throw new Error('User ID not found - please log in again');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/end-user/incident-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ user_id: parseInt(userId) })
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('fetchEndUserIncidents - Error response:', errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch end user incidents');
    }

    return result.data || [];
  } catch (error) {
    throw error;
  }
};

export const fetchFieldEngineerIncidents = async (): Promise<Incident[]> => {
  const userId = getUserId();
  const token = getStoredToken();


  const response = await fetch(`${API_BASE_URL}/all-incidents`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error('Field Engineer API failed');
  }

  if (!userId) {
    return [];
  }

  const currentUserId = parseInt(userId);
  return result.data.filter((incident: any) => incident.assigned_to_id === currentUserId);
};

// Update this function in your incidentService.ts file

// Replace the fetchExpertTeamIncidents function in your incidentService.ts with this:

export const fetchExpertTeamIncidents = async (): Promise<Incident[]> => {
  const userId = getUserId();
  const token = getStoredToken();

  console.log('fetchExpertTeamIncidents - Using userId:', userId);

  const response = await fetch(`${API_BASE_URL}/all-incidents`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error('Expert Team API failed');
  }

  if (!userId) {
    return [];
  }

  const currentUserId = parseInt(userId);

  const mappedAndFilteredIncidents: Incident[] = result.data
    .filter((apiIncident: any) => apiIncident.assigned_to_id === currentUserId)
    .map((apiIncident: any): Incident => ({
      id: apiIncident.id,
      user_id: apiIncident.user_id,
      user: {
        name: apiIncident.name_name || 'Unknown',
        last_name: null, // API doesn't provide this separately
      },
      site_id: apiIncident.site_id,
      site: apiIncident.site_name ? { name: apiIncident.site_name } : null,
      asset_id: apiIncident.asset_id,
      asset: apiIncident.asset_name ? { name: apiIncident.asset_name } : null,
      category_id: apiIncident.category_id,
      category_name: apiIncident.category_name,
      category: apiIncident.category_name ? { name: apiIncident.category_name } : null,
      subcategory_id: apiIncident.subcategory_id,
      subcategory: apiIncident.subcategory_name ? { name: apiIncident.subcategory_name } : null,
      contact_type_id: apiIncident.contact_type_id,
      contact_type: apiIncident.contact_type_name ? { name: apiIncident.contact_type_name } : null,
      impact_id: apiIncident.impact_id,
      impact: apiIncident.impact_name ? { name: apiIncident.impact_name } : null,
      priority_id: apiIncident.priority_id,
      priority: apiIncident.priority_name ? { name: apiIncident.priority_name } : null,
      urgency_id: apiIncident.urgency_id,
      urgency: apiIncident.urgency_name ? { name: apiIncident.urgency_name } : null,
      assigned_to_id: apiIncident.assigned_to_id,
      assigned_to: apiIncident.assigned_to_name ? {
        name: apiIncident.assigned_to_name,
        last_name: null
      } : null,
      incidentstate_id: apiIncident.incidentstate_id,
      incidentstate: apiIncident.incidentstate_name ? { name: apiIncident.incidentstate_name } : null,
      incident_no: apiIncident.incident_no,
      opened_at: apiIncident.opened_at,
      closed_at: apiIncident.closed_at,
      short_description: apiIncident.short_description,
      description: apiIncident.description,
      reported_by: apiIncident.name_name,
      address: apiIncident.address,
      lat: apiIncident.lat ? parseFloat(apiIncident.lat) : null,
      lng: apiIncident.lng ? parseFloat(apiIncident.lng) : null,
      narration: apiIncident.narration,
      root_cause_analysis: apiIncident.root_cause_analysis,
      conclusion: apiIncident.conclusion,
      created_by_id: apiIncident.created_by_id,
      updated_by_id: apiIncident.updated_by_id,
      created_at: apiIncident.created_at,
      updated_at: apiIncident.updated_at,
      deleted_at: apiIncident.deleted_at
    }));

  return mappedAndFilteredIncidents;
};

export const fetchAdminIncidents = async (): Promise<Incident[]> => {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}/all-incidents`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error('Admin API failed');
  }

  return result.data;
};

// Smart fetching based on user role
export const fetchIncidentsByUserRole = async (userRole?: string): Promise<Incident[]> => {
  const currentUser = getCurrentUser();
  const role = (userRole || currentUser?.team_name || '').toLowerCase();

  console.log('fetchIncidentsByUserRole - User role:', role);

  if (role.includes('admin')) return await fetchAdminIncidents();
  if (role.includes('manager')) return await fetchManagerIncidents();
  if (role.includes('handler')) return await fetchHandlerIncidents();
  if (role.includes('field') && role.includes('engineer')) return await fetchFieldEngineerIncidents();
  if (role.includes('expert') || role.includes('water') || role.includes('pollution')) return await fetchExpertTeamIncidents();

  return await fetchEndUserIncidents();
};

// For AssignIncidents component - moved to separate service file
export const fetchAllIncidentsForAssignment = async (): Promise<Incident[]> => {
  const currentUser = getCurrentUser();
  const userRole = currentUser?.team_name?.toLowerCase() || '';

  if (userRole.includes('manager') || userRole.includes('admin')) {
    return await fetchManagerIncidents();
  } else if (userRole.includes('handler')) {
    return await fetchHandlerIncidents();
  }

  return [];
};

// Utility functions - only essential ones
export const getStatusColor = (status: string): string => {
  // Ensure status is a string and handle null/undefined values
  const statusLower = (status || '').toString().toLowerCase();
  if (statusLower.includes('progress')) return '#3b82f6';
  if (statusLower.includes('resolved')) return '#10b981';
  if (statusLower.includes('closed')) return '#6b7280';
  return '#f59e0b'; // pending/new
};

export const getPriorityColor = (priority: string): string => {
  // Ensure priority is a string and handle null/undefined values
  const p = (priority || '').toString().toLowerCase();
  if (p.includes('high') || p.includes('critical')) return '#ef4444';
  if (p.includes('medium')) return '#f59e0b';
  return '#10b981';
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const getIncidentStats = (incidents: Incident[]) => {
  const total = incidents.length;

  // Use backend status directly
  const getStatusFromIncident = (incident: Incident) => {
    const state = incident.incidentstate?.name?.toLowerCase() || '';
    if (state === 'new') return 'pending';
    if (state === 'inprogress') return 'in_progress';
    if (state === 'resolved') return 'resolved';
    if (state === 'closed') return 'closed';
    return 'pending';
  };

  const inProgress = incidents.filter(i => getStatusFromIncident(i) === 'in_progress').length;
  const resolved = incidents.filter(i => getStatusFromIncident(i) === 'resolved').length;
  const pending = incidents.filter(i => getStatusFromIncident(i) === 'pending').length;
  const closed = incidents.filter(i => getStatusFromIncident(i) === 'closed').length;

  const critical = incidents.filter(i => {
    const priority = i.priority?.name || i.urgency?.name || '';
    return priority.toLowerCase().includes('high') || priority.toLowerCase().includes('critical');
  }).length;

  return { total, critical, inProgress, resolved, pending, closed };
};

export const createIncident = async (incidentData: any): Promise<Incident> => {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/end-user/create-incident`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(incidentData)
  });
  const result = await response.json();
  return result.data || result;
};
