import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input, Alert, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Plus, Edit, Trash2, Save, X, Users, Shield, Settings, Building, Package } from 'lucide-react';

// Import the real API functions for Master Settings
import {
  fetchCategories,
  fetchSubcategories,
  fetchContactTypes,
  fetchImpacts,
  fetchUrgencies,
  fetchIncidentStates,
  fetchAssets,
  fetchSites,
  fetchRoles
} from '../../src/app/(MainBody)/services/masterService';

// Import user service for authentication
import { getStoredToken } from '../../src/app/(MainBody)/services/userService';

// API helper function for user management and other endpoints
const apiCall = async (endpoint: string, method = 'GET', data = null) => {
  const token = getStoredToken();
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include'
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`https://apexwpc.apextechno.co.uk/api${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// User management API functions
const fetchUsers = async () => {
  try {
    const response = await apiCall('/users');
    return { data: response.data || response || [] };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

const createUser = async (userData: any) => {
  return await apiCall('/users', 'POST', userData);
};

const updateUser = async (id: string, userData: any) => {
  return await apiCall(`/users/${id}`, 'PUT', userData);
};

const deleteUser = async (id: string) => {
  return await apiCall(`/users/${id}`, 'DELETE');
};

// Form Field Interface
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'color' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

// Form Configuration Interface
interface FormConfig {
  title: string;
  fields: FormField[];
  description?: string;
  icon?: string;
  hasAPI?: boolean;
  isCreateForm?: boolean;
  isListView?: boolean;
}

// Mock data for forms that don't have API yet
const mockData: Record<string, any[]> = {
  'asset-state': [
    { id: 1, name: 'Operational', description: 'Asset is fully operational', color_code: '#28a745', is_active: true },
    { id: 2, name: 'Maintenance', description: 'Under maintenance', color_code: '#ffc107', is_active: true },
    { id: 3, name: 'Out of Service', description: 'Not operational', color_code: '#dc3545', is_active: true }
  ],
  'asset-substate': [
    { id: 1, name: 'Scheduled Maintenance', asset_state_id: 2, description: 'Planned maintenance', is_active: true },
    { id: 2, name: 'Emergency Repair', asset_state_id: 3, description: 'Emergency repair needed', is_active: true }
  ],
  'asset-function': [
    { id: 1, name: 'Water Pumping', description: 'Primary water pumping function', is_active: true },
    { id: 2, name: 'Chemical Treatment', description: 'Chemical treatment processes', is_active: true },
    { id: 3, name: 'Monitoring', description: 'System monitoring and control', is_active: true }
  ],
  'asset-location': [
    { id: 1, name: 'Pump Room A', description: 'Main pump room', site_id: 1, is_active: true },
    { id: 2, name: 'Chemical Storage', description: 'Chemical storage area', site_id: 1, is_active: true },
    { id: 3, name: 'Control Room', description: 'Main control room', site_id: 1, is_active: true }
  ],
  department: [
    { id: 1, name: 'Operations', code: 'OPS', description: 'Operations department', manager_name: 'Bob Manager', manager_email: 'bob@company.com', budget: 500000, is_active: true },
    { id: 2, name: 'Maintenance', code: 'MAINT', description: 'Maintenance department', manager_name: 'Alice Supervisor', manager_email: 'alice@company.com', budget: 300000, is_active: true },
    { id: 3, name: 'Quality Control', code: 'QC', description: 'Quality control department', manager_name: 'Charlie QC', manager_email: 'charlie@company.com', budget: 200000, is_active: true }
  ],
  company: [
    { id: 1, name: 'AquaTech Solutions', code: 'ATS', address: '100 Business Park', phone: '555-1000', email: 'info@aquatech.com', website: 'www.aquatech.com', is_active: true },
    { id: 2, name: 'Water Systems Inc', code: 'WSI', address: '200 Industrial Blvd', phone: '555-2000', email: 'contact@watersystems.com', website: 'www.watersystems.com', is_active: true }
  ],
  'stock-room': [
    { id: 1, name: 'Main Warehouse', code: 'MW01', description: 'Primary storage facility', site_id: 1, capacity: 10000, manager_name: 'Store Manager', is_active: true },
    { id: 2, name: 'Chemical Storage', code: 'CS02', description: 'Chemical storage room', site_id: 1, capacity: 5000, manager_name: 'Safety Officer', is_active: true }
  ],
  aisle: [
    { id: 1, name: 'Aisle A', code: 'A01', stock_room_id: 1, description: 'Equipment storage', is_active: true },
    { id: 2, name: 'Aisle B', code: 'B01', stock_room_id: 1, description: 'Parts storage', is_active: true },
    { id: 3, name: 'Aisle C1', code: 'C01', stock_room_id: 2, description: 'Chemical storage section 1', is_active: true }
  ],
  'site-type': [
    { id: 1, name: 'Treatment Plant', description: 'Water treatment facilities', is_active: true },
    { id: 2, name: 'Pumping Station', description: 'Water pumping stations', is_active: true },
    { id: 3, name: 'Storage Tank', description: 'Water storage facilities', is_active: true }
  ],
  'all-groups': [
    { id: 1, name: 'Administrators', description: 'System administrators group', is_active: true },
    { id: 2, name: 'Incident Managers', description: 'Incident management team', is_active: true },
    { id: 3, name: 'Field Engineers', description: 'Field engineering team', is_active: true },
    { id: 4, name: 'Quality Control', description: 'Quality control specialists', is_active: true }
  ],
  'all-permissions': [
    { id: 1, name: 'create_incidents', module: 'incidents', action: 'create', description: 'Create new incidents', is_active: true },
    { id: 2, name: 'manage_users', module: 'users', action: 'update', description: 'Manage user accounts', is_active: true },
    { id: 3, name: 'view_reports', module: 'reports', action: 'read', description: 'View system reports', is_active: true },
    { id: 4, name: 'delete_assets', module: 'assets', action: 'delete', description: 'Delete asset records', is_active: true }
  ],
  'sla-definitions': [
    { id: 1, name: 'Critical Incident SLA', description: 'SLA for critical incidents', response_time_hours: 1, resolution_time_hours: 4, priority: 'Critical', is_active: true },
    { id: 2, name: 'Standard SLA', description: 'Standard incident SLA', response_time_hours: 24, resolution_time_hours: 72, priority: 'Medium', is_active: true },
    { id: 3, name: 'Low Priority SLA', description: 'SLA for low priority incidents', response_time_hours: 48, resolution_time_hours: 168, priority: 'Low', is_active: true }
  ],
  'sla-conditions': [
    { id: 1, name: 'Critical Priority Check', sla_definition: 'Critical Incident SLA', field_name: 'priority', operator: 'equals', field_value: 'Critical', is_active: true },
    { id: 2, name: 'Water Quality Category', sla_definition: 'Critical Incident SLA', field_name: 'category', operator: 'contains', field_value: 'Water Quality', is_active: true },
    { id: 3, name: 'High Impact Check', sla_definition: 'Standard SLA', field_name: 'impact', operator: 'equals', field_value: 'High', is_active: true },
    { id: 4, name: 'Equipment Failure', sla_definition: 'Standard SLA', field_name: 'category', operator: 'contains', field_value: 'Equipment', is_active: true },
    { id: 5, name: 'Low Priority Filter', sla_definition: 'Low Priority SLA', field_name: 'priority', operator: 'equals', field_value: 'Low', is_active: true }
  ]
};

// Form configurations with API integration flags - Using exact tab names from URLs
const formConfigs: Record<string, FormConfig> = {
  // Master Settings - These have working APIs
  category: {
    title: 'Categories',
    description: 'Manage incident categories',
    icon: 'settings',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  subcategory: {
    title: 'Sub Categories',
    description: 'Manage incident sub-categories',
    icon: 'settings',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Sub-Category Name', type: 'text', required: true },
      { name: 'category_id', label: 'Parent Category', type: 'select', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'contact-type': {
    title: 'Contact Types',
    description: 'Manage contact types for incidents',
    icon: 'settings',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Contact Type', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  state: {
    title: 'Incident States',
    description: 'Manage incident workflow states',
    icon: 'settings',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'State Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'order', label: 'Order', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  impact: {
    title: 'Impacts',
    description: 'Manage incident impact levels',
    icon: 'settings',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Impact Level', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'priority_weight', label: 'Priority Weight', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  urgency: {
    title: 'Urgencies',
    description: 'Manage incident urgency levels',
    icon: 'settings',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Urgency Level', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'response_time_hours', label: 'Response Time (Hours)', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'add-asset': {
    title: 'Assets',
    description: 'Manage organizational assets',
    icon: 'package',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Asset Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  sites: {
    title: 'Sites',
    description: 'Manage organizational sites',
    icon: 'building',
    hasAPI: true,
    isListView: true,
    fields: [
      { name: 'name', label: 'Site Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'all-groups': {
    title: 'Groups',
    description: 'View all user groups',
    icon: 'users',
    hasAPI: false,
    isListView: true,
    fields: []
  },
  'create-group': {
    title: 'Groups',
    description: 'Create new user group',
    icon: 'users',
    hasAPI: false,
    isCreateForm: true,
    fields: [
      { name: 'name', label: 'Group Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'all-roles': {
    title: 'Roles',
    description: 'View all user roles',
    icon: 'shield',
    hasAPI: true,
    isListView: true,
    fields: []
  },
  'create-roles': {
    title: 'Roles',
    description: 'Create new user role',
    icon: 'shield',
    hasAPI: true,
    isCreateForm: true,
    fields: [
      { name: 'name', label: 'Role Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'all-permissions': {
    title: 'Permissions',
    description: 'View all permissions',
    icon: 'shield',
    hasAPI: false,
    isListView: true,
    fields: []
  },
  'create-permission': {
    title: 'Permissions',
    description: 'Create new permission',
    icon: 'shield',
    hasAPI: false,
    isCreateForm: true,
    fields: [
      { name: 'name', label: 'Permission Name', type: 'text', required: true },
      { name: 'module', label: 'Module', type: 'text', required: true },
      { name: 'action', label: 'Action', type: 'select', required: true, options: ['create', 'read', 'update', 'delete'] },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  users: {
    title: 'Users',
    description: 'View all system users',
    icon: 'users',
    hasAPI: true,
    isListView: true,
    fields: []
  },
  'site-type': {
    title: 'Site Types',
    description: 'Manage different types of sites',
    icon: 'building',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Site Type', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'asset-state': {
    title: 'Asset States',
    description: 'Manage asset lifecycle states',
    icon: 'package',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'State Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'color_code', label: 'Color Code', type: 'color' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'asset-substate': {
    title: 'Asset Sub States',
    description: 'Manage detailed asset states',
    icon: 'package',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Sub State Name', type: 'text', required: true },
      { name: 'asset_state_id', label: 'Parent State', type: 'select', required: true, options: ['Operational', 'Maintenance', 'Out of Service'] },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'asset-function': {
    title: 'Asset Functions',
    description: 'Manage asset functional categories',
    icon: 'package',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Function Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'asset-location': {
    title: 'Asset Locations',
    description: 'Manage asset physical locations',
    icon: 'package',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Location Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'site_id', label: 'Site', type: 'select' },
      { name: 'parent_location_id', label: 'Parent Location', type: 'select' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  department: {
    title: 'Departments',
    description: 'Manage organizational departments',
    icon: 'building',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Department Name', type: 'text', required: true },
      { name: 'code', label: 'Department Code', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'manager_name', label: 'Manager Name', type: 'text' },
      { name: 'manager_email', label: 'Manager Email', type: 'email' },
      { name: 'budget', label: 'Budget', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  company: {
    title: 'Companies',
    description: 'Manage company information',
    icon: 'building',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Company Name', type: 'text', required: true },
      { name: 'code', label: 'Company Code', type: 'text' },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'stock-room': {
    title: 'Stock Rooms',
    description: 'Manage inventory storage locations',
    icon: 'package',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Stock Room Name', type: 'text', required: true },
      { name: 'code', label: 'Room Code', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'site_id', label: 'Site', type: 'select' },
      { name: 'capacity', label: 'Capacity', type: 'number' },
      { name: 'manager_name', label: 'Manager Name', type: 'text' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  aisle: {
    title: 'Aisles',
    description: 'Manage stock room aisles',
    icon: 'package',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Aisle Name', type: 'text', required: true },
      { name: 'code', label: 'Aisle Code', type: 'text' },
      { name: 'stock_room_id', label: 'Stock Room', type: 'select', required: true, options: ['Main Warehouse', 'Chemical Storage'] },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'sla-definitions': {
    title: 'SLA Definitions',
    description: 'Manage service level agreements',
    icon: 'settings',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'SLA Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'response_time_hours', label: 'Response Time (Hours)', type: 'number', required: true },
      { name: 'resolution_time_hours', label: 'Resolution Time (Hours)', type: 'number', required: true },
      { name: 'priority', label: 'Priority Level', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'sla-conditions': {
    title: 'SLA Conditions',
    description: 'Manage SLA trigger conditions',
    icon: 'settings',
    hasAPI: false,
    isListView: true,
    fields: [
      { name: 'name', label: 'Condition Name', type: 'text', required: true },
      { name: 'sla_definition', label: 'SLA Definition', type: 'select', required: true, options: ['Critical Incident SLA', 'Standard SLA', 'Low Priority SLA'] },
      { name: 'field_name', label: 'Field Name', type: 'text', required: true },
      { name: 'operator', label: 'Operator', type: 'select', required: true, options: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'] },
      { name: 'field_value', label: 'Field Value', type: 'text', required: true },
      { name: 'is_active', label: 'Active', type: 'checkbox' }
    ]
  },
  'create-manager': {
    title: 'Incident Managers',
    description: 'Register incident managers',
    icon: 'users',
    hasAPI: true,
    isCreateForm: true,
    fields: [
      { name: 'first_name', label: 'First Name', type: 'text', required: true },
      { name: 'last_name', label: 'Last Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'mobile', label: 'Mobile Number', type: 'tel' },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'postcode', label: 'Postcode', type: 'text' },
      { name: 'team_id', label: 'Team', type: 'select', required: true, options: ['5'] }
    ]
  },
  'create-handler': {
    title: 'Incident Handlers',
    description: 'Register incident handlers',
    icon: 'users',
    hasAPI: true,
    isCreateForm: true,
    fields: [
      { name: 'first_name', label: 'First Name', type: 'text', required: true },
      { name: 'last_name', label: 'Last Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'mobile', label: 'Mobile Number', type: 'tel' },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'postcode', label: 'Postcode', type: 'text' },
      { name: 'team_id', label: 'Team', type: 'select', required: true, options: ['2'] }
    ]
  }
};

interface AdminFormsProps {
  initialTab?: string;
}

const AdminForms: React.FC<AdminFormsProps> = ({ initialTab = 'categories' }) => {
  const activeTab = initialTab;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>({});
  const [formData, setFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});
  const itemsPerPage = 10;

  // Load data based on whether the form has API or uses mock data
  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const config = formConfigs[activeTab];
      if (!config) {
        setError('Form configuration not found');
        return;
      }

      // Skip data loading for create forms
      if (config.isCreateForm) {
        setLoading(false);
        return;
      }

      if (config.hasAPI) {
        // Use real API
        let apiData = [];

        switch (activeTab) {
          case 'categories':
            const categoriesResponse = await fetchCategories();
            apiData = categoriesResponse.data || [];
            break;
          case 'subcategory':
            const subcategoriesResponse = await fetchSubcategories();
            apiData = subcategoriesResponse.data || [];
            break;
          case 'contact-type':
            const contactTypesResponse = await fetchContactTypes();
            apiData = contactTypesResponse.data || [];
            break;
          case 'state':
            const statesResponse = await fetchIncidentStates();
            apiData = statesResponse.data || [];
            break;
          case 'urgency':
            const urgenciesResponse = await fetchUrgencies();
            apiData = urgenciesResponse.data || [];
            break;
          case 'add-asset':
            const assetsResponse = await fetchAssets();
            apiData = assetsResponse.data || [];
            break;
          case 'sites':
            const sitesResponse = await fetchSites();
            apiData = sitesResponse.data || [];
            break;
          case 'all-roles':
            const rolesResponse = await fetchRoles();
            apiData = rolesResponse.data || [];
            break;
          case 'users':
            const usersResponse = await fetchUsers();
            apiData = usersResponse.data || [];
            break;
          default:
            apiData = [];
        }

        setData(apiData);
      } else {
        // Use mock data with simulated delay
        setTimeout(() => {
          setData(mockData[activeTab] || []);
          setLoading(false);
        }, 300);
        return;
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
      // Fallback to mock data if API fails
      setData(mockData[activeTab] || []);
    } finally {
      setLoading(false);
    }
  };

  // Load dropdown options for select fields
  const loadDropdownOptions = async () => {
    try {
      const config = formConfigs[activeTab];
      const selectFields = config.fields.filter(field => field.type === 'select' && !field.options);

      const options: Record<string, any[]> = {};

      for (const field of selectFields) {
        // Load related data for dropdowns
        if (field.name === 'category_id') {
          try {
            const categoriesResponse = await fetchCategories();
            options[field.name] = categoriesResponse.data || [];
          } catch (err) {
            console.warn('Failed to load categories for dropdown:', err);
            options[field.name] = [];
          }
        } else if (field.name === 'site_id') {
          try {
            const sitesResponse = await fetchSites();
            options[field.name] = sitesResponse.data || [];
          } catch (err) {
            console.warn('Failed to load sites for dropdown:', err);
            options[field.name] = [];
          }
        }
        // Add more dropdown options as needed
      }

      setDropdownOptions(options);
    } catch (err) {
      console.error('Error loading dropdown options:', err);
    }
  };

  // Load data when component mounts or activeTab changes
  useEffect(() => {
    loadData();
    loadDropdownOptions();
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const config = formConfigs[activeTab];

      try {
        if (editMode) {
          // Update existing item
          setData(prev => prev.map(item =>
            item.id === currentItem.id ? { ...formData, id: currentItem.id } : item
          ));
          setSuccess(`${config.title.slice(0, -1)} updated successfully!`);
        } else {
          // Add new item
          const newItem = { ...formData, id: Date.now() };
          setData(prev => [...prev, newItem]);
          setSuccess(`${config.title.slice(0, -1)} created successfully!`);
        }

        setShowModal(false);
        setFormData({});
        setCurrentItem({});
        setEditMode(false);

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError('Failed to save: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 500); // Simulate API call
  };

  const handleEdit = (item: any) => {
    setCurrentItem(item);
    setFormData(item);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    setTimeout(() => {
      setData(prev => prev.filter(item => item.id !== parseInt(id)));
      setSuccess('Item deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    }, 300);
  };

  const openCreateModal = () => {
    setFormData({});
    setCurrentItem({});
    setEditMode(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setCurrentItem({});
    setEditMode(false);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Input
            type="textarea"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      case 'select':
        // Use predefined options or dropdown options loaded from API
        const options = field.options || dropdownOptions[field.name] || [];
        return (
          <Input
            type="select"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {options.map((option, index) => (
              <option
                key={typeof option === 'object' ? option.id : option}
                value={typeof option === 'object' ? option.id : option}
              >
                {typeof option === 'object' ? option.name : option}
              </option>
            ))}
          </Input>
        );
      case 'checkbox':
        return (
          <Input
            type="checkbox"
            name={field.name}
            checked={Boolean(value)}
            onChange={handleInputChange}
          />
        );
      case 'color':
        return (
          <Input
            type="color"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      case 'tel':
        return (
          <Input
            type="tel"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      case 'password':
        return (
          <Input
            type="password"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      case 'text':
      default:
        return (
          <Input
            type="text"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'users': return <Users size={20} />;
      case 'shield': return <Shield size={20} />;
      case 'settings': return <Settings size={20} />;
      case 'building': return <Building size={20} />;
      case 'package': return <Package size={20} />;
      default: return <Settings size={20} />;
    }
  };

  const renderTable = () => {
    const config = formConfigs[activeTab];
    if (!config) return null;

    // Filter data based on search term
    const filteredData = data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-5">
          <p className="text-muted">
            {searchTerm ? 'No matching records found' : 'No data available'}
          </p>
        </div>
      );
    }

    // Get columns from the first data item, excluding sensitive fields
    const columns = data.length > 0
      ? Object.keys(data[0]).filter(key => !['password'].includes(key))
      : [];

    return (
      <>
        {/* Search Bar */}
        <Row className="mb-3">
          <Col md={6}>
            <Input
              type="text"
              placeholder={`Search ${config.title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            </small>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                {columns.map(column => (
                  <th key={column} className="text-capitalize">
                    {column.replace(/_/g, ' ')}
                  </th>
                ))}
                {config.isListView && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={item.id || index}>
                  {columns.map(column => (
                    <td key={column}>
                      {column === 'is_active' || column === 'active' ? (
                        <Badge color={item[column] ? 'success' : 'secondary'}>
                          {item[column] ? 'Active' : 'Inactive'}
                        </Badge>
                      ) : column.includes('email') ? (
                        <a href={`mailto:${item[column]}`}>{item[column]}</a>
                      ) : column.includes('phone') || column.includes('mobile') ? (
                        <a href={`tel:${item[column]}`}>{item[column]}</a>
                      ) : column === 'team_name' ? (
                        <Badge color="info">{item[column]}</Badge>
                      ) : (
                        <span title={String(item[column] || '-')}>
                          {String(item[column] || '-').length > 50
                            ? String(item[column]).substring(0, 50) + '...'
                            : String(item[column] || '-')
                          }
                        </span>
                      )}
                    </td>
                  ))}
                  {config.isListView && (
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          color="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          disabled={loading}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          color="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Row className="mt-3">
            <Col className="d-flex justify-content-center">
              <div className="d-flex gap-2">
                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <Button
                        key={page}
                        color={page === currentPage ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}

                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </Col>
          </Row>
        )}
      </>
    );
  };

  const renderCreateForm = () => {
    const config = formConfigs[activeTab];
    if (!config || !config.isCreateForm) return null;

    return (
      <Card>
        <CardHeader>
          <div className="d-flex align-items-center">
            {getIconComponent(config.icon || 'settings')}
            <div className="ms-3">
              <h5 className="mb-0">Create {config.title.slice(0, -1)}</h5>
              {config.description && (
                <small className="text-muted">{config.description}</small>
              )}
              {config.hasAPI && (
                <Badge color="success" size="sm" className="ms-2">Live API</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="success" className="mb-3">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Row>
              {config.fields.map(field => (
                <Col md={field.type === 'textarea' ? 12 : 6} key={field.name} className="mb-3">
                  <FormGroup>
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-danger"> *</span>}
                    </Label>
                    {renderFormField(field)}
                  </FormGroup>
                </Col>
              ))}
            </Row>
            <div className="d-flex gap-2">
              <Button color="primary" type="submit" disabled={loading}>
                <Save size={16} className="me-1" />
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    );
  };

  const renderSLAConditions = () => {
    if (activeTab !== 'sla-conditions') return null;

    return (
      <Container fluid className="p-0">
        <Card>
          <CardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <Settings size={20} />
                <div className="ms-3">
                  <h5 className="mb-0">SLA Conditions Management</h5>
                  <small className="text-muted">Manage SLA trigger conditions</small>
                  <Badge color="warning" size="sm" className="ms-2">Mock Data</Badge>
                </div>
              </div>
              <Button color="primary" onClick={openCreateModal}>
                <Plus size={16} className="me-1" />
                Add Condition
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {error && (
              <Alert color="danger" className="mb-3">
                {error}
              </Alert>
            )}

            {success && (
              <Alert color="success" className="mb-3">
                {success}
              </Alert>
            )}

            {loading && (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!loading && renderTable()}
          </CardBody>
        </Card>

        {/* Modal for Create/Edit SLA Conditions */}
        <Modal isOpen={showModal} toggle={closeModal} size="lg">
          <ModalHeader toggle={closeModal}>
            <div className="d-flex align-items-center">
              <Settings size={20} />
              <span className="ms-2">
                {editMode ? 'Edit' : 'Create'} SLA Condition
              </span>
            </div>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Row>
                {formConfigs['sla-conditions'].fields.map(field => (
                  <Col md={field.type === 'textarea' ? 12 : 6} key={field.name} className="mb-3">
                    <FormGroup>
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-danger"> *</span>}
                      </Label>
                      {renderFormField(field)}
                    </FormGroup>
                  </Col>
                ))}
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={closeModal} disabled={loading}>
                <X size={16} className="me-1" />
                Cancel
              </Button>
              <Button color="primary" type="submit" disabled={loading}>
                <Save size={16} className="me-1" />
                {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      </Container>
    );
  };

  const currentConfig = formConfigs[activeTab];

  if (!currentConfig) {
    // Debug logging
    console.error('Form configuration not found for activeTab:', activeTab);
    console.log('Available form configs:', Object.keys(formConfigs));

    return (
      <Container fluid className="p-4">
        <Alert color="warning">
          <h5>Configuration not found for: {activeTab}</h5>
          <p>Available configurations: {Object.keys(formConfigs).join(', ')}</p>
          <p>Please check the tab parameter in the URL or add the configuration for this tab.</p>
        </Alert>
      </Container>
    );
  }

  // Special handling for SLA conditions
  if (activeTab === 'sla-conditions') {
    return renderSLAConditions();
  }

  // Show create form for create tabs
  if (currentConfig.isCreateForm) {
    return (
      <Container fluid className="p-0">
        {renderCreateForm()}
      </Container>
    );
  }

  // Show list view for everything else
  return (
    <Container fluid className="p-0">
      <Card>
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {getIconComponent(currentConfig.icon || 'settings')}
              <div className="ms-3">
                <h5 className="mb-0">{currentConfig.title} Management</h5>
                <div className="d-flex align-items-center gap-2">
                  {currentConfig.description && (
                    <small className="text-muted">{currentConfig.description}</small>
                  )}
                  {currentConfig.hasAPI ? (
                    <Badge color="success" size="sm">Live API</Badge>
                  ) : (
                    <Badge color="warning" size="sm">Mock Data</Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Only show Add button for non-list views that have fields */}
            {currentConfig.fields.length > 0 && (
              <Button color="primary" onClick={openCreateModal} disabled={loading}>
                <Plus size={16} className="me-1" />
                Add {currentConfig.title.slice(0, -1)}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger" className="mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>Error:</strong> {error}
                  {currentConfig.hasAPI && (
                    <div className="mt-2">
                      <small className="text-muted">
                        API connection failed. Please check your authentication or network connection.
                      </small>
                    </div>
                  )}
                </div>
                <Button
                  color="outline-danger"
                  size="sm"
                  onClick={loadData}
                >
                  Retry
                </Button>
              </div>
            </Alert>
          )}

          {success && (
            <Alert color="success" className="mb-3">
              {success}
            </Alert>
          )}

          {loading && (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && renderTable()}
        </CardBody>
      </Card>

      {/* Modal for Create/Edit - Only show for items with fields */}
      {currentConfig.fields.length > 0 && (
        <Modal isOpen={showModal} toggle={closeModal} size="lg">
          <ModalHeader toggle={closeModal}>
            <div className="d-flex align-items-center">
              {getIconComponent(currentConfig.icon || 'settings')}
              <span className="ms-2">
                {editMode ? 'Edit' : 'Create'} {currentConfig.title.slice(0, -1)}
              </span>
              {currentConfig.hasAPI && (
                <Badge color="success" size="sm" className="ms-2">Live API</Badge>
              )}
            </div>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {currentConfig.description && (
                <Alert color="info" className="mb-3">
                  <small>{currentConfig.description}</small>
                  {currentConfig.hasAPI && (
                    <>
                      <br />
                      <small><strong>Note:</strong> This form is connected to live API endpoints.</small>
                    </>
                  )}
                </Alert>
              )}

              <Row>
                {currentConfig.fields.map(field => (
                  <Col md={field.type === 'textarea' ? 12 : 6} key={field.name} className="mb-3">
                    <FormGroup>
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-danger"> *</span>}
                      </Label>
                      {renderFormField(field)}
                    </FormGroup>
                  </Col>
                ))}
                {currentConfig.fields.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No form fields configured for this module.</p>
                  </div>
                )}
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={closeModal} disabled={loading}>
                <X size={16} className="me-1" />
                Cancel
              </Button>
              <Button color="primary" type="submit" disabled={loading}>
                <Save size={16} className="me-1" />
                {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </Container>
  );
};

export default AdminForms;
