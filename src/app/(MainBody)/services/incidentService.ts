// services/incidentService.ts
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
const API_BASE_URL = 'https://apexwpc.apextechno.co.uk/api';

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

// Simplified API Error handling
class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

// Simplified fetch incidents function
export const fetchIncidentsAPI = async (): Promise<Incident[]> => {
  const endpoint = `${API_BASE_URL}/end-user/incident-list`;
  const token = getStoredToken();
  const userId = getStoredUserId() || '13';

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  try {
    const formData = new FormData();
    formData.append('user_id', userId);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', responseText);
      throw new Error('Invalid response format from server');
    }

    if (result.success && result.data) {
      return result.data.map((item: any) => {
        // Map status from incident state ID
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

        return {
          id: String(item.id || generateIncidentNumber()),
          number: String(item.incident_no || item.incident_number || generateIncidentNumber()),
          caller: String(item.user?.name || item.caller_name || 'Unknown'),
          category: String(item.category?.name || item.category || 'Unknown'),
          subCategory: String(item.subcategory?.name || item.sub_category || 'Unknown'),
          shortDescription: String(item.short_description || 'No description'),
          contactType: String(item.contact_type || 'Email'),
          impact: String(item.impact?.name || item.impact || 'Medium'),
          urgency: String(item.urgency?.name || item.urgency || 'Medium'),
          priority: String(item.priority?.name || item.priority || '3 - Medium'),
          description: String(item.narration || item.description || item.short_description || 'No description'),
          status: status,
          reportedBy: String(item.user?.email || item.reported_by || 'Unknown'),
          reportedByName: String(item.user?.name || item.reported_by_name || 'Unknown'),
          assignedTo: item.assigned_to ? String(item.assigned_to) : 'Unassigned',
          assignedToEmail: item.assigned_to_email ? String(item.assigned_to_email) : undefined,
          address: item.address ? String(item.address) : undefined,
          postcode: item.postcode ? String(item.postcode) : undefined,
          createdAt: String(item.opened_at || item.created_at || new Date().toISOString()),
          updatedAt: item.updated_at ? String(item.updated_at) : undefined
        } as Incident;
      });
    } else {
      // Return empty array if no incidents found
      if (result.message === 'No incidents found') {
        return [];
      }
      throw new Error(result.message || 'Failed to fetch incidents');
    }
  } catch (error: any) {
    console.error('Fetch incidents error:', error);

    // Return empty array for certain errors instead of throwing
    if (error.message.includes('No incidents found') || error.message.includes('404')) {
      return [];
    }

    throw error;
  }
};

// Simplified create incident function
export const createIncidentAPI = async (incidentData: Partial<Incident>): Promise<Incident> => {
  const endpoint = `${API_BASE_URL}/end-user/create-incident`;
  const token = getStoredToken();
  const userId = getStoredUserId() || '13';

  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  // Helper functions for mapping
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
    short_description: incidentData.shortDescription || '',
    description: incidentData.description || '',
    address: incidentData.address || 'Not specified',
    postcode: incidentData.postcode || '',
    caller_name: incidentData.caller || getStoredUserName() || 'User',
    contact_type: incidentData.contactType || 'Email',
    reported_by: getStoredUserName() || 'User'
  };

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

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to create incident: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (parseError) {
        errorMessage += ` - ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result.success) {
      return {
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
      } as Incident;
    } else {
      throw new Error(result.message || 'Failed to create incident');
    }
  } catch (error: any) {
    console.error('Create incident error:', error);
    throw error;
  }
};

// Utility functions
export const generateIncidentNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `IN${timestamp}${random}`;
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
  const critical = incidents.filter(i => i.priority?.toLowerCase().includes('critical')).length;
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
