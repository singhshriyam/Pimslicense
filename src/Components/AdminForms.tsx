import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Button, FormGroup, Label, Input, Alert, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'https://apexwpc.apextechno.co.uk/api';

// API Helper Functions
const apiCall = async (endpoint: string, method = 'GET', data = null) => {
  const token = localStorage.getItem('authToken');
  const config: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Form Field Interface
interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

// Form Configuration Interface
interface FormConfig {
  title: string;
  endpoint: string;
  fields: FormField[];
}

// Enhanced form configurations with all the tabs from your menu
const formConfigs: Record<string, FormConfig> = {
  categories: {
    title: 'Categories',
    endpoint: '/master/categories',
    fields: []
  },
  'contact-type': {
    title: 'Contact Types',
    endpoint: '/master/contact-types',
    fields: []
  },
  sites: {
    title: 'Sites',
    endpoint: '/master/sites',
    fields: []
  },
  assets: {
    title: 'Assets',
    endpoint: '/master/assets',
    fields: []
  },
  impacts: {
    title: 'Impacts',
    endpoint: '/master/impacts',
    fields: []
  },
  urgencies: {
    title: 'Urgencies',
    endpoint: '/master/urgencies',
    fields: []
  },
  'incident-states': {
    title: 'Incident States',
    endpoint: '/master/incident-states',
    fields: []
  },
  'sub-categories': {
    title: 'Sub Categories',
    endpoint: '/master/sub-categories',
    fields: []
  },
  'site-types': {
    title: 'Site Types',
    endpoint: '/master/site-types',
    fields: []
  },
  users: {
    title: 'Users',
    endpoint: '/admin/users',
    fields: []
  },
  groups: {
    title: 'Groups',
    endpoint: '/admin/groups',
    fields: []
  },
  roles: {
    title: 'Roles',
    endpoint: '/admin/roles',
    fields: []
  },
  permissions: {
    title: 'Permissions',
    endpoint: '/admin/permissions',
    fields: []
  },
  // Asset Management
  'asset-states': {
    title: 'Asset States',
    endpoint: '/master/asset-states',
    fields: []
  },
  'asset-substates': {
    title: 'Asset Sub States',
    endpoint: '/master/asset-substates',
    fields: []
  },
  'asset-functions': {
    title: 'Asset Functions',
    endpoint: '/master/asset-functions',
    fields: []
  },
  'asset-locations': {
    title: 'Asset Locations',
    endpoint: '/master/asset-locations',
    fields: []
  },
  departments: {
    title: 'Departments',
    endpoint: '/master/departments',
    fields: []
  },
  companies: {
    title: 'Companies',
    endpoint: '/master/companies',
    fields: []
  },
  'stock-rooms': {
    title: 'Stock Rooms',
    endpoint: '/master/stock-rooms',
    fields: []
  },
  aisles: {
    title: 'Aisles',
    endpoint: '/master/aisles',
    fields: []
  },
  // SLA Management
  'sla-definitions': {
    title: 'SLA Definitions',
    endpoint: '/sla/definitions',
    fields: []
  },
  'sla-conditions': {
    title: 'SLA Conditions',
    endpoint: '/sla/conditions',
    fields: []
  }
};

interface AdminFormsProps {
  initialTab?: string;
}

const AdminForms: React.FC<AdminFormsProps> = ({ initialTab = 'categories' }) => {
  // Use the passed initialTab directly, no sidebar navigation needed
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
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [availableOptions, setAvailableOptions] = useState<Record<string, string[]>>({});
  const itemsPerPage = 10;

  // Load data when component mounts or activeTab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Generate form fields dynamically from API data
  const generateFormFields = (sampleData: any): FormField[] => {
    if (!sampleData || Object.keys(sampleData).length === 0) return [];

    const fields: FormField[] = [];
    const excludeFields = ['id', 'created_at', 'updated_at', 'deleted_at'];

    Object.keys(sampleData).forEach(key => {
      if (excludeFields.includes(key)) return;

      const value = sampleData[key];
      let field: FormField = {
        name: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'text'
      };

      // Determine field type based on key name and value
      if (key.includes('email')) {
        field.type = 'email';
      } else if (key.includes('phone')) {
        field.type = 'tel';
      } else if (key.includes('password')) {
        field.type = 'password';
      } else if (key.includes('_id') || key === 'id') {
        field.type = 'number';
      } else if (key.includes('description') || key.includes('notes') || key.includes('address')) {
        field.type = 'textarea';
      } else if (key.includes('status') || key.includes('type') || key.includes('level')) {
        field.type = 'select';
      } else if (key.includes('is_') || key.includes('active') || typeof value === 'boolean') {
        field.type = 'checkbox';
      } else if (typeof value === 'number') {
        field.type = 'number';
      }

      // Mark required fields
      if (['name', 'email', 'title'].includes(key) || key.includes('_id')) {
        field.required = true;
      }

      fields.push(field);
    });

    return fields;
  };

  // Extract unique options for select fields from existing data
  const extractSelectOptions = (data: any[], fieldName: string): string[] => {
    const uniqueValues = [...new Set(
      data
        .map(item => item[fieldName])
        .filter(value => value !== null && value !== undefined && value !== '')
    )];
    return uniqueValues.map(String);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const config = formConfigs[activeTab];
      if (config) {
        console.log(`Loading data for ${activeTab} from ${config.endpoint}`);
        const response = await apiCall(config.endpoint);
        const apiData = response.data || [];
        setData(apiData);

        // Generate form fields from the first data item
        if (apiData.length > 0) {
          const fields = generateFormFields(apiData[0]);
          setFormFields(fields);

          // Extract options for select fields
          const options: Record<string, string[]> = {};
          fields.forEach(field => {
            if (field.type === 'select') {
              const fieldOptions = extractSelectOptions(apiData, field.name);
              if (fieldOptions.length > 0) {
                options[field.name] = fieldOptions;
              }
            }
          });
          setAvailableOptions(options);
        } else {
          // If no data, create minimal form fields for creation
          const basicFields: FormField[] = [
            { name: 'name', label: 'Name', type: 'text', required: true }
          ];
          setFormFields(basicFields);
          setAvailableOptions({});
        }
      }
    } catch (err: any) {
      setError('Failed to load data: ' + err.message);
      setFormFields([]);
      setAvailableOptions({});
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const config = formConfigs[activeTab];
      const method = editMode ? 'PUT' : 'POST';
      const endpoint = editMode ? `${config.endpoint}/${currentItem.id}` : config.endpoint;

      // Validate required fields
      const missingFields = formFields
        .filter(field => field.required && !formData[field.name])
        .map(field => field.label);

      if (missingFields.length > 0) {
        throw new Error(`Please fill in required fields: ${missingFields.join(', ')}`);
      }

      // Clean form data
      const cleanedData: any = {};
      formFields.forEach(field => {
        const value = formData[field.name];
        if (value !== '' && value !== null && value !== undefined) {
          if (field.type === 'number') {
            cleanedData[field.name] = Number(value);
          } else if (field.type === 'checkbox') {
            cleanedData[field.name] = Boolean(value);
          } else {
            cleanedData[field.name] = value;
          }
        }
      });

      await apiCall(endpoint, method, cleanedData);

      setSuccess(`${config.title} ${editMode ? 'updated' : 'created'} successfully!`);
      setShowModal(false);
      setFormData({});
      setCurrentItem({});
      setEditMode(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

      await loadData();
    } catch (err: any) {
      setError('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setCurrentItem(item);
    setFormData(item);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const config = formConfigs[activeTab];
      await apiCall(`${config.endpoint}/${id}`, 'DELETE');
      setSuccess('Item deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setError('Failed to delete: ' + err.message);
    } finally {
      setLoading(false);
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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
            rows={3}
          />
        );
      case 'select':
        const options = availableOptions[field.name] || [];
        return (
          <Input
            type="select"
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
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
      default:
        return (
          <Input
            type={field.type}
            name={field.name}
            value={value}
            onChange={handleInputChange}
            required={field.required}
          />
        );
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

    // Get columns from the first data item
    const columns = data.length > 0 ? Object.keys(data[0]).filter(key =>
      !['created_at', 'updated_at', 'deleted_at'].includes(key)
    ) : [];

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={item.id || index}>
                  {columns.map(column => (
                    <td key={column}>
                      {column === 'status' ? (
                        <Badge color={item[column] === 'Active' ? 'success' : 'secondary'}>
                          {item[column]}
                        </Badge>
                      ) : column === 'is_active' ? (
                        <Badge color={item[column] ? 'success' : 'secondary'}>
                          {item[column] ? 'Yes' : 'No'}
                        </Badge>
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

  const currentConfig = formConfigs[activeTab];

  if (!currentConfig) {
    return (
      <Container fluid className="p-4">
        <Alert color="warning">
          Configuration not found for: {activeTab}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* Single Card with Content Only - No Sidebar */}
      <Card>
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{currentConfig.title} Management</h5>
            <Button color="primary" onClick={openCreateModal} disabled={loading}>
              <Plus size={16} className="me-1" />
              Add {currentConfig.title.slice(0, -1)}
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

      {/* Modal for Create/Edit */}
      <Modal isOpen={showModal} toggle={closeModal} size="lg">
        <ModalHeader toggle={closeModal}>
          {editMode ? 'Edit' : 'Create'} {currentConfig.title.slice(0, -1)}
        </ModalHeader>
        <div onSubmit={handleSubmit}>
          <ModalBody>
            {error && (
              <Alert color="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Row>
              {formFields.map(field => (
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
              {formFields.length === 0 && !loading && (
                <div className="text-center py-4">
                  <p className="text-muted">No form fields available. Please check the API data structure.</p>
                </div>
              )}
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={closeModal} disabled={loading}>
              <X size={16} className="me-1" />
              Cancel
            </Button>
            <Button color="primary" onClick={handleSubmit} disabled={loading}>
              <Save size={16} className="me-1" />
              {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </Container>
  );
};

export default AdminForms;
