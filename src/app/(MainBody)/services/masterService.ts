const API_BASE = 'https://apexwpc.apextechno.co.uk/api';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const authToken = localStorage.getItem('authToken');
  console.log('🔑 Auth token:', authToken ? 'Present' : 'Missing');

  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : '',
    'X-Requested-With': 'XMLHttpRequest'
  };
};

// Generic API call function with better error handling
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    },
    credentials: 'include'
  });

  console.log(`📨 Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText);
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  console.log('📦 Response data:', data);

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (data.success && data.data !== undefined) {
    return { data: data.data };
  } else if (data.success === false) {
    throw new Error(data.message || 'API request failed');
  } else {
    // Handle cases where API doesn't follow the standard format
    return { data: data };
  }
};

// Roles
export async function fetchRoles() {
  console.log('🔄 Fetching roles...');
  return await apiCall('/master/roles');
}

// Categories
export async function fetchCategories() {
  console.log('🔄 Fetching categories...');
  return await apiCall('/master/categories');
}

// Subcategories - FIXED to use correct endpoint with proper authentication
export async function fetchSubcategories(categoryId?: string) {
  let endpoint;
  if (categoryId) {
    // Use the correct endpoint with category filter
    endpoint = `/master/sub-categories?category_id=${categoryId}`;
    console.log('🔄 Fetching subcategories for category:', categoryId);
  } else {
    // Use general subcategories endpoint
    endpoint = '/master/sub-categories';
    console.log('🔄 Fetching all subcategories...');
  }

  try {
    const result = await apiCall(endpoint);
    console.log('✅ Subcategories loaded:', result.data);
    return result;
  } catch (error) {
    console.error('❌ Error fetching subcategories:', error);
    throw error;
  }
}

// Contact Types
export async function fetchContactTypes() {
  console.log('🔄 Fetching contact types...');
  return await apiCall('/master/contact-types');
}

// Impacts
export async function fetchImpacts() {
  console.log('🔄 Fetching impacts...');
  return await apiCall('/master/impacts');
}

// Urgencies
export async function fetchUrgencies() {
  console.log('🔄 Fetching urgencies...');
  return await apiCall('/master/urgencies');
}

// Incident States
export async function fetchIncidentStates() {
  console.log('🔄 Fetching incident states...');
  return await apiCall('/master/incident-states');
}

// Assets
export async function fetchAssets() {
  console.log('🔄 Fetching assets...');
  return await apiCall('/master/assets');
}

// Sites
export async function fetchSites() {
  console.log('🔄 Fetching sites...');
  return await apiCall('/master/sites');
}

// Additional helper functions for action-related master data (when APIs become available)

// Action Types - PLACEHOLDER (uncomment when API is ready)
// export async function fetchActionTypes() {
//   console.log('🔄 Fetching action types...');
//   return await apiCall('/master/action-types');
// }

// Action Statuses - PLACEHOLDER (uncomment when API is ready)
// export async function fetchActionStatuses() {
//   console.log('🔄 Fetching action statuses...');
//   return await apiCall('/master/action-statuses');
// }

// Action Priorities - PLACEHOLDER (uncomment when API is ready)
// export async function fetchActionPriorities() {
//   console.log('🔄 Fetching action priorities...');
//   return await apiCall('/master/action-priorities');
// }

// Test authentication
export async function testAuth() {
  console.log('🔄 Testing authentication...');
  try {
    const response = await fetch(`${API_BASE}/test-auth`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    console.log('🔑 Auth test response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}
