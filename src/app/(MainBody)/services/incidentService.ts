import { getStoredToken, getStoredUserName, getStoredUserId } from './userService';

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
  createdAt: string;
  updatedAt?: string;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apexwpc.apextechno.co.uk/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// API Error handling
class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

const handleAPIResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  return response.json();
};

// Role-based filtering function
export const filterIncidentsByRole = (incidents: Incident[], userEmail: string, userTeam: string): Incident[] => {
  const team = userTeam.toLowerCase().replace(/\s+/g, '_');

  switch (team) {
    case 'user':
      return incidents.filter(incident => incident.reportedBy === userEmail);

    case 'incident_handler':
    case 'incident_handeller':
      return incidents.filter(incident => incident.assignedToEmail === userEmail);

    case 'administrator':
    case 'incident_manager':
    case 'sla_manager':
      return incidents;

    default:
      return incidents.filter(incident => incident.reportedBy === userEmail);
  }
};

// Enhanced API functions with better error handling
export const createIncidentAPI = async (incidentData: Partial<Incident>): Promise<Incident> => {
  const endpoint = `${API_BASE_URL}/end-user/create-incident`;
  const token = getStoredToken();
  const userId = getStoredUserId() || localStorage.getItem('userId') || '13';

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const getUrgencyId = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  };

  const getImpactId = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'significant': return 2;
      case 'medium': return 3;
      case 'moderate': return 3;
      case 'low': return 4;
      default: return 3;
    }
  };

  const getCategoryId = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'environmental': return 1;
      case 'safety': return 2;
      case 'infrastructure': return 3;
      case 'river or lake': return 1;
      case 'street pavement': return 2;
      case 'inside home': return 3;
      default: return 1;
    }
  };

  const requestBody = {
    user_id: parseInt(userId),
    incidentstate_id: 1,
    urgency_id: getUrgencyId(incidentData.urgency || 'Medium'),
    impact_id: getImpactId(incidentData.impact || 'Moderate'),
    category_id: getCategoryId(incidentData.category || 'Environmental'),
    category: incidentData.category || '',
    sub_category: incidentData.subCategory || '',
    subcategory: incidentData.subCategory || '',
    short_description: incidentData.shortDescription || '',
    description: incidentData.description || '',
    address: incidentData.address || 'Not specified',
    postcode: incidentData.postcode || '',
    caller_name: incidentData.caller || getStoredUserName() || 'User',
    contact_type: incidentData.contactType || 'Email',
    reported_by: getStoredUserName() || 'User'
  };

  console.log('🔍 Creating incident with data:', requestBody);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('📝 Create incident response:', responseText);

    if (!response.ok) {
      let errorMessage = `Failed to create incident: ${response.status}`;

      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.data) {
          const validationErrors = Object.entries(errorJson.data)
            .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage = `Validation Error: ${validationErrors}`;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (parseError) {
        errorMessage += ` - ${responseText}`;
      }

      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);

    if (result.success) {
      const createdIncident: Incident = {
        id: result.data?.id || generateIncidentNumber(),
        number: result.data?.incident_number || generateIncidentNumber(),
        caller: requestBody.caller_name,
        category: incidentData.category || '',
        subCategory: incidentData.subCategory || '',
        shortDescription: requestBody.short_description,
        description: requestBody.description,
        contactType: requestBody.contact_type,
        impact: incidentData.impact || 'Moderate',
        urgency: incidentData.urgency || 'Medium',
        priority: incidentData.priority || '3 - Medium',
        status: 'pending',
        reportedBy: getStoredUserName() || 'User',
        reportedByName: getStoredUserName() || 'User',
        address: requestBody.address,
        postcode: requestBody.postcode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Incident created successfully:', createdIncident);
      return createdIncident;
    } else {
      throw new Error(result.message || 'Failed to create incident');
    }
  } catch (error: any) {
    console.error('❌ Create incident error:', error);
    throw error;
  }
};

export const fetchIncidentsAPI = async (userEmail?: string, userTeam?: string): Promise<Incident[]> => {
  const endpoint = `${API_BASE_URL}/end-user/incident-list`;
  const token = getStoredToken();
  const userId = getStoredUserId() || localStorage.getItem('userId') || '13';

  console.log('🔍 Fetching incidents:', { endpoint, userId, hasToken: !!token, userEmail, userTeam });

  if (!token) {
    console.warn('⚠️ No token found, but continuing with request');
  }

  try {
    const formData = new FormData();
    formData.append('user_id', userId);

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('📤 Making request with headers:', headers);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    const responseText = await response.text();
    console.log('📝 Fetch incidents response status:', response.status);
    console.log('📝 Fetch incidents response:', responseText.substring(0, 500) + '...');

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;

      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorMessage;
      } catch (parseError) {
        errorMessage += ` - ${responseText}`;
      }

      console.error('❌ Fetch error:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);
    console.log('📊 Parsed result:', result);

    if (result.success && result.data) {
      const transformedIncidents = result.data.map((item: any) => {
        let status: 'pending' | 'in_progress' | 'resolved' | 'closed' = 'pending';

        if (item.incidentstate_id) {
          switch (item.incidentstate_id) {
            case 1: status = 'pending'; break;
            case 2: status = 'in_progress'; break;
            case 3: status = 'resolved'; break;
            case 4: status = 'closed'; break;
            default: status = 'pending';
          }
        }

        const transformedIncident: Incident = {
          id: String(item.id || generateIncidentNumber()),
          number: String(item.incident_no || item.incident_number || generateIncidentNumber()),
          caller: String(item.user?.name || item.caller_name || 'Unknown'),
          category: String(item.category?.name || item.category || 'Unknown'),
          subCategory: String(item.subcategory?.name || item.sub_category || item.subcategory || 'Unknown'),
          shortDescription: String(item.short_description || 'No description'),
          contactType: String(item.contact_type || 'Email'),
          impact: String(item.impact?.name || item.impact || 'Medium'),
          urgency: String(item.urgency?.name || item.urgency || 'Medium'),
          priority: String(item.priority?.name || item.priority || '3 - Medium'),
          description: String(item.narration || item.description || item.short_description || 'No description'),
          status: status,
          reportedBy: String(item.user?.email || item.reported_by || userEmail || 'Unknown'),
          reportedByName: String(item.user?.name || item.reported_by_name || 'Unknown'),
          assignedTo: item.assigned_to ? String(item.assigned_to) : undefined,
          assignedToEmail: item.assigned_to_email ? String(item.assigned_to_email) : undefined,
          address: item.address ? String(item.address) : undefined,
          postcode: item.postcode ? String(item.postcode) : undefined,
          createdAt: String(item.opened_at || item.created_at || new Date().toISOString()),
          updatedAt: item.updated_at ? String(item.updated_at) : undefined
        };

        return transformedIncident;
      });

      console.log('✅ Transformed incidents:', transformedIncidents.length, 'incidents');
      if (transformedIncidents.length > 0) {
        console.log('📝 Sample incident:', transformedIncidents[0]);
      }

      return transformedIncidents;
    } else {
      console.error('❌ Unexpected response format:', result);

      // If no incidents or unexpected format, return empty array instead of throwing
      if (!result.success && result.message === 'No incidents found') {
        console.log('ℹ️ No incidents found for user');
        return [];
      }

      throw new Error(result.message || 'Unexpected response format');
    }
  } catch (error: any) {
    console.error('❌ Fetch incidents error:', error);

    // For certain errors, return empty array instead of throwing
    if (error.message.includes('No incidents found') || error.message.includes('404')) {
      console.log('ℹ️ Returning empty array due to no incidents found');
      return [];
    }

    throw error;
  }
};

export const updateIncidentAPI = async (incidentId: string, updates: Partial<Incident>): Promise<Incident> => {
  const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...updates,
      updatedAt: new Date().toISOString()
    })
  });

  return await handleAPIResponse(response);
};

export const deleteIncidentAPI = async (incidentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  await handleAPIResponse(response);
};

export const getIncidentByIdAPI = async (incidentId: string): Promise<Incident | null> => {
  const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return await handleAPIResponse(response);
};

// Utility functions
export const generateIncidentNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `IN${timestamp}${random}`;
};

export const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'resolved': return 'success';
    case 'in_progress': return 'primary';
    case 'pending': return 'warning';
    case 'closed': return 'secondary';
    default: return 'secondary';
  }
};

export const getPriorityBadge = (priority: string): string => {
  switch (priority) {
    case '1 - Critical': return 'danger';
    case '2 - High': return 'warning';
    case '3 - Medium': return 'info';
    case '4 - Low': return 'success';
    default: return 'secondary';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case '1 - Critical': return '#ef4444';
    case '2 - High': return '#f59e0b';
    case '3 - Medium': return '#3b82f6';
    case '4 - Low': return '#10b981';
    case 'Critical': return '#ef4444';
    case 'High': return '#f59e0b';
    case 'Medium': return '#3b82f6';
    case 'Low': return '#10b981';
    default: return '#6b7280';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'resolved': return '#10b981';
    case 'in_progress': return '#3b82f6';
    case 'pending': return '#f59e0b';
    case 'closed': return '#6b7280';
    default: return '#6b7280';
  }
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return dateString;
  }
};

// Statistics functions
export const getIncidentStats = (incidents: Incident[]) => {
  const total = incidents.length;
  const critical = incidents.filter(i => i.priority?.toLowerCase().includes('critical') || i.priority === '1 - Critical').length;
  const inProgress = incidents.filter(i => i.status === 'in_progress').length;
  const resolved = incidents.filter(i => i.status === 'resolved').length;
  const pending = incidents.filter(i => i.status === 'pending').length;
  const closed = incidents.filter(i => i.status === 'closed').length;

  return { total, critical, inProgress, resolved, pending, closed };
};

export const getCategoryStats = (incidents: Incident[]) => {
  const categories = incidents.reduce((acc, incident) => {
    acc[incident.category] = (acc[incident.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categories).map(([name, count]) => ({ name, count }));
};

export const getMonthlyTrends = (incidents: Incident[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyData = months.map((month, index) => {
    const monthIncidents = incidents.filter(incident => {
      try {
        const incidentMonth = new Date(incident.createdAt).getMonth();
        return incidentMonth === index;
      } catch (error) {
        return false;
      }
    });

    return {
      month,
      reported: monthIncidents.length,
      resolved: monthIncidents.filter(i => i.status === 'resolved').length,
      inProgress: monthIncidents.filter(i => i.status === 'in_progress').length
    };
  });

  return monthlyData;
};

// Health check function
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Test function to verify API connectivity
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getStoredToken();

    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    // Test with a simple endpoint
    const userId = getStoredUserId();
    const formData = new FormData();
    // formData.append('user_id');

    const response = await fetch(`${API_BASE_URL}/end-user/incident-list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      return { success: true, message: 'API connection successful' };
    } else {
      return { success: false, message: `API returned status: ${response.status}` };
    }
  } catch (error: any) {
    return { success: false, message: `Connection failed: ${error.message}` };
  }
};
