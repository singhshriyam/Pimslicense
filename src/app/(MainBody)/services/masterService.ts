const API_BASE = 'https://apexwpc.apextechno.co.uk/api';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const authToken = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : '',
    'X-Requested-With': 'XMLHttpRequest'
  };
};

// Roles
export async function fetchRoles() {
  const res = await fetch(`${API_BASE}/master/roles`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch roles');
  return res.json();
}

// Categories
export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/master/categories`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch categories');
  }
}

// Subcategories (filtered by category if given)
export async function fetchSubcategories(categoryId?: string) {
  let url;
  if (categoryId) {
    // Use the working endpoint for subcategories by category ID
    url = `${API_BASE}/master/subcategories-by-category-id?category_id=${categoryId}`;
  } else {
    // Use general subcategories endpoint
    url = `${API_BASE}/master/subcategories`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch subcategories');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch subcategories');
  }
}

// Contact Types
export async function fetchContactTypes() {
  const res = await fetch(`${API_BASE}/master/contact-types`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch contact types');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch contact types');
  }
}

// Impacts
export async function fetchImpacts() {
  const res = await fetch(`${API_BASE}/master/impacts`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch impacts');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch impacts');
  }
}

// Urgencies
export async function fetchUrgencies() {
  const res = await fetch(`${API_BASE}/master/urgencies`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch urgencies');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch urgencies');
  }
}

// Incident States
export async function fetchIncidentStates() {
  const res = await fetch(`${API_BASE}/master/incident-states`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch incident states');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch incident states');
  }
}

// Assets
export async function fetchAssets() {
  const res = await fetch(`${API_BASE}/master/assets`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch assets');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch assets');
  }
}

// Sites
export async function fetchSites() {
  const res = await fetch(`${API_BASE}/master/sites`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to fetch sites');
  const response = await res.json();

  // Handle the API response format: { "success": true, "data": [...], "message": "..." }
  if (response.success && response.data) {
    return { data: response.data };
  } else {
    throw new Error(response.message || 'Failed to fetch sites');
  }
}
