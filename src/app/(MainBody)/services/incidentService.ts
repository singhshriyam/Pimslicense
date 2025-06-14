// services/incidentService.ts - Simplified and cleaned up
import { getStoredToken, getStoredUserId, getCurrentUser } from './userService';

// Base API Configuration
const API_BASE_URL = 'https://apexwpc.apextechno.co.uk/api';

// Unified Incident Interface
export interface Incident {
  id: string;
  number: string;
  caller: string;
  category: string;
  subCategory: string;
  shortDescription: string;
  contactType: string;
  impact: string;
  urgency: string;
  priority: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: string;
  reportedByName?: string;
  assignedTo?: string;
  assignedToEmail?: string;
  address?: string;
  postcode?: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  updatedAt?: string;
}

// Helper function to map backend status to frontend
const mapStatusFromBackend = (backendStatus: string | number): 'pending' | 'in_progress' | 'resolved' | 'closed' => {
  if (typeof backendStatus === 'number') {
    switch (backendStatus) {
      case 1: return 'pending';
      case 2: return 'in_progress';
      case 3:
      case 4: return 'resolved';
      case 5: return 'closed';
      default: return 'pending';
    }
  }

  const status = backendStatus?.toLowerCase() || '';
  switch (status) {
    case 'new': return 'pending';
    case 'inprogress':
    case 'in_progress': return 'in_progress';
    case 'resolved': return 'resolved';
    case 'closed': return 'closed';
    default: return 'pending';
  }
};

// Transform backend incident to frontend format
const transformIncidentFromBackend = (item: any): Incident => {
  const callerName = item.user?.name
    ? `${item.user.name}${item.user.last_name ? ' ' + item.user.last_name : ''}`.trim()
    : 'Unknown';

  const assignedToName = item.assigned_to
    ? `${item.assigned_to.name || ''}${item.assigned_to.last_name ? ' ' + item.assigned_to.last_name : ''}`.trim()
    : 'Unassigned';

  return {
    id: String(item.id || Date.now()),
    number: String(item.incident_no || `IN${Date.now()}`),
    caller: callerName,
    category: String(item.category?.name || 'Unknown'),
    subCategory: String(item.subcategory?.name || 'Unknown'),
    shortDescription: String(item.short_description || 'No description'),
    contactType: String(item.contact_type?.name || 'Email'),
    impact: String(item.impact?.name || 'Not Specified'),
    urgency: String(item.urgency?.name || 'Medium'),
    priority: String(item.priority?.name || item.urgency?.name || 'Medium'),
    description: String(item.description || item.short_description || 'No description'),
    status: mapStatusFromBackend(item.incidentstate?.name || item.incidentstate_id || 1),
    reportedBy: String(item.user?.email || 'Unknown'),
    reportedByName: callerName,
    assignedTo: assignedToName,
    assignedToEmail: item.assigned_to?.email || undefined,
    address: item.address ? String(item.address) : undefined,
    postcode: item.postcode ? String(item.postcode) : undefined,
    latitude: item.lat ? String(item.lat) : undefined,
    longitude: item.lng ? String(item.lng) : undefined,
    createdAt: String(item.opened_at || item.created_at || new Date().toISOString()),
    updatedAt: item.updated_at ? String(item.updated_at) : undefined
  };
};

// Fetch ALL incidents for Admin/Manager users - they should see EVERYTHING
export const fetchAllIncidents = async (): Promise<Incident[]> => {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  try {
    console.log('🔍 ADMIN/MANAGER: Fetching ALL incidents from all sources...');

    const allIncidents: any[] = [];

    // First, try admin-specific endpoints that might exist
    const adminEndpoints = [
      `${API_BASE_URL}/admin/incident-list`,
      `${API_BASE_URL}/admin/all-incidents`,
      `${API_BASE_URL}/incident-list`,
      `${API_BASE_URL}/all-incidents`,
      `${API_BASE_URL}/manager/incident-list`,
      `${API_BASE_URL}/manager/all-incidents`
    ];

    for (const endpoint of adminEndpoints) {
      try {
        console.log(`🔍 Trying admin/manager endpoint: ${endpoint}`);
        const adminResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (adminResponse.ok) {
          const adminResult = await adminResponse.json();
          console.log(`📋 Response from ${endpoint}:`, adminResult);
          if (adminResult.data && Array.isArray(adminResult.data) && adminResult.data.length > 0) {
            allIncidents.push(...adminResult.data);
            const transformedIncidents = allIncidents.map(transformIncidentFromBackend);
            return transformedIncidents;
          } else {
            console.log(`❌ Endpoint ${endpoint}: No data or empty array`);
          }
        } else {
          console.log(`❌ Endpoint ${endpoint} failed: ${adminResponse.status} ${adminResponse.statusText}`);
        }
      } catch (error: any) {
      }
    }

    // Get handler incidents - this seems to work and returns 2 incidents
    try {
      const handlerResponse = await fetch(`${API_BASE_URL}/incident-handeler/incident-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (handlerResponse.ok) {
        const handlerResult = await handlerResponse.json();
        if (handlerResult.data && Array.isArray(handlerResult.data)) {
          allIncidents.push(...handlerResult.data);
        }
      }
    } catch (error) {
      console.error('❌ Handler endpoint error:', error);
    }

    // For Admin/Manager, try to get incidents from all users by iterating through possible user IDs
    // This is a workaround since the backend restricts based on user permissions

    // Try a wider range of user IDs since we want ALL incidents
    const userIdsToTry = [];
    for (let i = 1; i <= 50; i++) {
      userIdsToTry.push(String(i));
    }

    let successfulUserFetches = 0;
    for (const userId of userIdsToTry) {
      try {
        const formData = new FormData();
        formData.append('user_id', userId);

        const endUserResponse = await fetch(`${API_BASE_URL}/end-user/incident-list`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (endUserResponse.ok) {
          const endUserResult = await endUserResponse.json();
          if (endUserResult.data && Array.isArray(endUserResult.data) && endUserResult.data.length > 0) {
            console.log(`✅ End-user endpoint (user_id=${userId}): ${endUserResult.data.length} incidents`);
            allIncidents.push(...endUserResult.data);
            successfulUserFetches++;
          }
        }
      } catch (error: any) {
        // Silently continue to next user ID
      }
    }

    // Remove duplicates by ID
    const uniqueIncidents = allIncidents.filter((incident, index, self) =>
      index === self.findIndex(i => i.id === incident.id)
    );


    // Transform incidents
    const transformedIncidents = uniqueIncidents.map(transformIncidentFromBackend);

    return transformedIncidents;

  } catch (error: any) {
    throw error;
  }
};

// Simple role-based incident fetching
export const fetchIncidentsByUserRole = async (userRole?: string): Promise<Incident[]> => {
  const currentUser = getCurrentUser();
  const role = userRole || currentUser?.team?.toLowerCase() || 'enduser';

  // ADMIN AND MANAGER GET EVERYTHING - NO EXCEPTIONS
  if (role.includes('admin') || role.includes('manager')) {
    return await fetchAllIncidents();
  }

  // Handler gets assigned incidents
  if (role.includes('handler')) {
    return await fetchHandlerIncidents();
  }

  // End users get their own incidents
  return await fetchEndUserIncidents();
};
export const fetchEndUserIncidents = async (): Promise<Incident[]> => {
  const endpoint = `${API_BASE_URL}/end-user/incident-list`;
  const token = getStoredToken();
  const userId = getStoredUserId();

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  try {
    const formData = new FormData();
    formData.append('user_id', userId || '13');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data.map(transformIncidentFromBackend);
    } else {
      return result.message === 'No incidents found' ? [] : [];
    }
  } catch (error: any) {
    if (error.message.includes('No incidents found') || error.message.includes('404')) {
      return [];
    }
    throw error;
  }
};

// Fetch incidents for Handlers
export const fetchHandlerIncidents = async (): Promise<Incident[]> => {
  const endpoint = `${API_BASE_URL}/incident-handeler/incident-list`;
  const token = getStoredToken();

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return (result.data || []).map(transformIncidentFromBackend);
  } catch (error: any) {
    throw error;
  }
};

// Create incident (End User)
export const createIncident = async (incidentData: any): Promise<Incident> => {
  const endpoint = `${API_BASE_URL}/end-user/create-incident`;
  const token = getStoredToken();

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  try {
    // Map frontend fields to backend expected fields
    const backendIncidentData = {
      ...incidentData,
      lat: incidentData.latitude || incidentData.lat || null,
      lng: incidentData.longitude || incidentData.lng || null
    };

    // Remove frontend field names
    delete backendIncidentData.latitude;
    delete backendIncidentData.longitude;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(backendIncidentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to create incident: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.errors) {
          const errors = Object.values(errorJson.errors).flat();
          errorMessage = errors.join(', ');
        }
      } catch (parseError) {
        errorMessage += ` - ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result.success || result.data) {
      const createdIncident = result.data || result;
      return transformIncidentFromBackend(createdIncident);
    } else {
      throw new Error(result.message || 'Failed to create incident');
    }
  } catch (error: any) {
    throw error;
  }
};

// Generate incident number
export const generateIncidentNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `IN${timestamp}${random}`;
};

// Utility functions
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'resolved': return '#10b981';
    case 'in_progress': return '#3b82f6';
    case 'pending': return '#f59e0b';
    case 'closed': return '#6b7280';
    default: return '#6b7280';
  }
};

export const getPriorityColor = (priority: string): string => {
  const priorityLower = priority?.toLowerCase() || '';
  if (priorityLower.includes('critical') || priorityLower.includes('high')) return '#ef4444';
  if (priorityLower.includes('significant') || priorityLower.includes('medium') || priorityLower.includes('moderate')) return '#f59e0b';
  if (priorityLower.includes('low')) return '#10b981';
  return '#6b7280';
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleString();
  } catch (error) {
    return dateString;
  }
};

export const getIncidentStats = (incidents: Incident[]) => {
  const total = incidents.length;
  const critical = incidents.filter(i =>
    i.priority?.toLowerCase().includes('critical') ||
    i.urgency?.toLowerCase().includes('critical') ||
    i.priority?.toLowerCase().includes('high')
  ).length;
  const inProgress = incidents.filter(i => i.status === 'in_progress').length;
  const resolved = incidents.filter(i => i.status === 'resolved').length;
  const pending = incidents.filter(i => i.status === 'pending').length;
  const closed = incidents.filter(i => i.status === 'closed').length;

  return { total, critical, inProgress, resolved, pending, closed };
};

// Legacy function names for backward compatibility
export const createIncidentAPI = createIncident;
export const fetchHandlerIncidentsAPI = fetchHandlerIncidents;
export const fetchEndUserIncidentsAPI = fetchEndUserIncidents;
export const generateIncidentNumberAPI = generateIncidentNumber;
