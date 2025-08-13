// /src/services/apiService.ts

// Get API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://licence.apextechno.co.uk/api';

// Types for our API calls
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  customer_name: string;
  company_address: string;
  company_post_code: string;
  tax_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ApiResponse {
  success?: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    customer_name?: string;
    role?: string;
    phone?: string;
  };
  errors?: any;
  data?: any;
}

// Helper function to make API calls
async function makeAPICall(endpoint: string, data: any, method: string = 'POST'): Promise<ApiResponse> {
  const headers = new Headers();
  headers.append("Accept", "application/json");
  headers.append("Content-Type", "application/json");

  // Add authorization token if available
  const token = getAuthToken();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const requestOptions: RequestInit = {
    method: method,
    headers: headers,
    body: method !== 'GET' ? JSON.stringify(data) : undefined,
  };

  try {
    console.log(`🚀 Making API call to: ${API_BASE_URL}${endpoint}`);
    console.log('📤 Sending data:', data);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    let result: any;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // If response is not JSON, get text and try to parse
      const text = await response.text();
      console.log('📥 Raw response:', text);
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }
    }

    console.log('📥 API Response:', result);

    if (!response.ok) {
      // Handle different HTTP status codes
      let errorMessage = result.message || `HTTP Error: ${response.status}`;

      switch (response.status) {
        case 400:
          errorMessage = result.message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        case 403:
          errorMessage = 'Access forbidden. Please contact support.';
          break;
        case 404:
          errorMessage = 'Service not found. Please try again later.';
          break;
        case 422:
          errorMessage = result.message || 'Validation error. Please check your input.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = result.message || `Unexpected error (${response.status})`;
      }

      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error('❌ API Error:', error);

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
}

// Login API call
export async function loginUser(loginData: LoginData): Promise<ApiResponse> {
  return await makeAPICall('/login', loginData);
}

// Register API call
export async function registerUser(registerData: RegisterData): Promise<ApiResponse> {
  return await makeAPICall('/register', registerData);
}

// Logout API call
export async function logoutUser(): Promise<ApiResponse> {
  return await makeAPICall('/logout', {});
}

// Get user profile
export async function getUserProfile(): Promise<ApiResponse> {
  return await makeAPICall('/user', {}, 'GET');
}

// Token management functions
export function saveAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    console.log('🔐 Auth token saved');
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userCompany');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPhone');
    console.log('🗑️ Auth token and user data removed');
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}

// User data management
export function saveUserData(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('userFirstName', user.first_name || '');
    localStorage.setItem('userLastName', user.last_name || '');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userCompany', user.customer_name || '');
    localStorage.setItem('userRole', user.role || '');
    localStorage.setItem('userPhone', user.phone || '');
    console.log('👤 User data saved');
  }
}

export function getUserData() {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
}

// License-related API calls (for future use)
export async function getLicenses(): Promise<ApiResponse> {
  return await makeAPICall('/licenses', {}, 'GET');
}

export async function createLicenseOrder(orderData: any): Promise<ApiResponse> {
  return await makeAPICall('/orders', orderData);
}

// Utility function for handling API errors in components
export function handleApiError(error: any): string {
  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}
