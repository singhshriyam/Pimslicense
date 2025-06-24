"use client";
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';

import {
  createIncident,
  type Incident
} from '../../app/(MainBody)/services/incidentService';

import {
  fetchCategories,
  fetchSubcategories,
  fetchContactTypes,
  fetchImpacts,
  fetchUrgencies,
  fetchAssets,
  fetchSites,
} from '../../app/(MainBody)/services/masterService';

import {
  getCurrentUser
} from '../../app/(MainBody)/services/userService';

interface IncidentFormData {
  caller: string;
  category_id: string;
  subcategory_id: string;
  short_description: string;
  contact_type_id: string;
  impact_id: string;
  urgency_id: string;
  description: string;
  address: string;
  postcode: string;
  latitude: string;
  longitude: string;
  asset_id: string;
  site_id: string;
}

interface IncidentCreationFormProps {
  userRole: string;
  userEmail: string;
  userName: string;
  onCancel?: () => void;
  onIncidentCreated?: (incident: Incident) => void;
  onSuccess?: () => void;
  showBackButton?: boolean;
  compactMode?: boolean;
}

const IncidentCreationForm: React.FC<IncidentCreationFormProps> = ({
  userRole,
  userEmail,
  userName,
  onCancel,
  onIncidentCreated,
  onSuccess,
  showBackButton = true,
  compactMode = false
}) => {
  const [formData, setFormData] = useState<IncidentFormData>({
    caller: userName || '',
    category_id: '',
    subcategory_id: '',
    short_description: '',
    contact_type_id: '',
    impact_id: '',
    urgency_id: '',
    description: '',
    address: '',
    postcode: '',
    latitude: '',
    longitude: '',
    asset_id: '',
    site_id: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [masterData, setMasterData] = useState({
    categories: [] as Array<{id: number, name: string}>,
    subcategories: [] as Array<{id: number, name: string, category_id: number}>,
    contactTypes: [] as Array<{id: number, name: string}>,
    impacts: [] as Array<{id: number, name: string}>,
    urgencies: [] as Array<{id: number, name: string}>,
    assets: [] as Array<{id: number, name: string}>,
    sites: [] as Array<{id: number, name: string}>,
    loading: false,
    error: null as string | null
  });

  useEffect(() => {
    const loadMasterData = async () => {
      setMasterData(prev => ({ ...prev, loading: true, error: null }));

      try {
        console.log('🔄 Loading master data for incident creation...');

        const [categoriesRes, contactTypesRes, impactsRes, urgenciesRes, assetsRes, sitesRes] = await Promise.all([
          fetchCategories(),
          fetchContactTypes(),
          fetchImpacts(),
          fetchUrgencies(),
          fetchAssets(),
          fetchSites()
        ]);

        console.log('✅ Master data loaded:', {
          categories: categoriesRes.data?.length || 0,
          contactTypes: contactTypesRes.data?.length || 0,
          impacts: impactsRes.data?.length || 0,
          urgencies: urgenciesRes.data?.length || 0,
          assets: assetsRes.data?.length || 0,
          sites: sitesRes.data?.length || 0
        });

        setMasterData(prev => ({
          ...prev,
          categories: categoriesRes.data || [],
          contactTypes: contactTypesRes.data || [],
          impacts: impactsRes.data || [],
          urgencies: urgenciesRes.data || [],
          assets: assetsRes.data || [],
          sites: sitesRes.data || [],
          loading: false,
          error: null
        }));

        // Set default values for required fields
        setFormData(prev => ({
          ...prev,
          contact_type_id: contactTypesRes.data?.[0]?.id?.toString() || '',
          impact_id: impactsRes.data?.[0]?.id?.toString() || '',
          urgency_id: urgenciesRes.data?.[0]?.id?.toString() || ''
        }));

      } catch (error: any) {
        console.error('❌ Error loading master data:', error);
        setMasterData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load form data'
        }));
      }
    };

    loadMasterData();
  }, []);

  const loadSubcategories = async (categoryId: string) => {
    console.log('🔄 loadSubcategories called with categoryId:', categoryId);

    if (!categoryId) {
      console.log('❌ No categoryId provided, clearing subcategories');
      setMasterData(prev => ({ ...prev, subcategories: [] }));
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
      return;
    }

    setSubcategoriesLoading(true);
    try {
      console.log('📡 Calling fetchSubcategories API...');
      const subcategoriesRes = await fetchSubcategories(categoryId);
      console.log('✅ Subcategories response:', subcategoriesRes);

      setMasterData(prev => ({
        ...prev,
        subcategories: subcategoriesRes.data || []
      }));

      console.log('✅ Subcategories loaded successfully:', subcategoriesRes.data);
    } catch (error: any) {
      console.error('❌ Error loading subcategories:', error);
      setMasterData(prev => ({ ...prev, subcategories: [] }));
      setError(`Failed to load subcategories: ${error.message}`);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    console.log('📝 Input changed:', { name, value });

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // FIXED: Handle category change properly
      if (name === 'category_id') {
        console.log('🔄 Category changed, clearing subcategory and loading new ones');
        newData.subcategory_id = ''; // Clear subcategory when category changes
        loadSubcategories(value); // Load new subcategories
      }

      return newData;
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.caller.trim()) errors.caller = 'Caller name is required';
    if (!formData.category_id) errors.category_id = 'Category is required';
    if (!formData.subcategory_id) errors.subcategory_id = 'Sub Category is required';
    if (!formData.contact_type_id) errors.contact_type_id = 'Contact Type is required';
    if (!formData.impact_id) errors.impact_id = 'Impact is required';
    if (!formData.urgency_id) errors.urgency_id = 'Urgency is required';
    if (!formData.short_description.trim()) errors.short_description = 'Short description is required';
    if (!formData.description.trim()) errors.description = 'Detailed description is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) throw new Error('User not authenticated');

      const incidentData = {
        user_id: parseInt(currentUser.id, 10),
        incidentstate_id: 1,
        urgency_id: parseInt(formData.urgency_id, 10),
        category_id: parseInt(formData.category_id, 10),
        subcategory_id: parseInt(formData.subcategory_id, 10),
        contact_type_id: parseInt(formData.contact_type_id, 10),
        impact_id: parseInt(formData.impact_id, 10),
        short_description: formData.short_description,
        description: formData.description,
        address: formData.address || '',
        postcode: formData.postcode || '',
        lat: formData.latitude || null,
        lng: formData.longitude || null,
        asset_id: formData.asset_id ? parseInt(formData.asset_id, 10) : null,
        site_id: formData.site_id ? parseInt(formData.site_id, 10) : null
      };

      console.log('📤 Creating incident with data:', incidentData);

      const createdIncident = await createIncident(incidentData);

      console.log('✅ Incident created successfully:', createdIncident);

      if (onIncidentCreated) {
        onIncidentCreated(createdIncident);
      }

      setShowSuccess(true);

      // Reset form
      setFormData({
        caller: userName || '',
        category_id: '',
        subcategory_id: '',
        short_description: '',
        contact_type_id: masterData.contactTypes[0]?.id?.toString() || '',
        impact_id: masterData.impacts[0]?.id?.toString() || '',
        urgency_id: masterData.urgencies[0]?.id?.toString() || '',
        description: '',
        address: '',
        postcode: '',
        latitude: '',
        longitude: '',
        asset_id: '',
        site_id: ''
      });

      // Clear subcategories since category was reset
      setMasterData(prev => ({ ...prev, subcategories: [] }));

      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) onSuccess();
      }, 3000);

    } catch (error: any) {
      console.error('❌ Error creating incident:', error);
      setError(error.message || 'Failed to create incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubCategoryOptions = () => {
    console.log('🔍 getSubCategoryOptions called');
    console.log('🔍 All subcategories:', masterData.subcategories);
    console.log('🔍 Selected category ID:', formData.category_id);

    if (!formData.category_id) {
      console.log('🔍 No category selected, returning empty array');
      return [];
    }

    const filtered = masterData.subcategories.filter(subcat => {
      const categoryMatch = subcat.category_id === parseInt(formData.category_id);
      console.log(`🔍 Subcategory "${subcat.name}" (category_id: ${subcat.category_id}) matches selected category ${formData.category_id}:`, categoryMatch);
      return categoryMatch;
    });

    console.log('🔍 Filtered subcategories:', filtered);
    return filtered;
  };

  const getCategoryName = (id: string) => {
    const category = masterData.categories.find(cat => cat.id === parseInt(id));
    return category?.name || '';
  };

  const getSubCategoryName = (id: string) => {
    const subCat = masterData.subcategories.find(sub => sub.id === parseInt(id));
    return subCat?.name || '';
  };

  const getImpactName = (id: string) => {
    const impact = masterData.impacts.find(imp => imp.id === parseInt(id));
    return impact?.name || '';
  };

  const getUrgencyName = (id: string) => {
    const urgency = masterData.urgencies.find(urg => urg.id === parseInt(id));
    return urgency?.name || '';
  };

  const getContactTypeName = (id: string) => {
    const contactType = masterData.contactTypes.find(ct => ct.id === parseInt(id));
    return contactType?.name || '';
  };

  if (masterData.loading) {
    return (
      <Container fluid>
        <Card>
          <CardBody>
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading form data...</p>
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (masterData.error) {
    return (
      <Container fluid>
        <Card>
          <CardBody>
            <Alert color="danger">
              <strong>Error:</strong> {masterData.error}
              <div className="mt-2">
                <Button color="danger" size="sm" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </Alert>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0">New Incident Creation</h4>
              <small className="text-muted">Reporting as: {userRole} ({userName})</small>
            </div>
            {showBackButton && onCancel && (
              <Button color="secondary" size="sm" onClick={onCancel}>
                ← Back to Dashboard
              </Button>
            )}
          </div>

          {error && (
            <Alert color="danger" className="mb-4">
              <strong>Error!</strong> {error}
            </Alert>
          )}

          {showSuccess && (
            <Alert color="success" className="mb-4">
              <strong>Success!</strong> Incident has been created successfully!
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="caller">Caller Name *</Label>
                  <Input
                    type="text"
                    id="caller"
                    name="caller"
                    value={formData.caller}
                    onChange={handleInputChange}
                    placeholder="Enter caller's name"
                    required
                    invalid={!!validationErrors.caller}
                  />
                  {validationErrors.caller && (
                    <div className="invalid-feedback">{validationErrors.caller}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="contact_type_id">Contact Type *</Label>
                  <Input
                    type="select"
                    id="contact_type_id"
                    name="contact_type_id"
                    value={formData.contact_type_id}
                    onChange={handleInputChange}
                    required
                    invalid={!!validationErrors.contact_type_id}
                  >
                    <option value="">Select Contact Type</option>
                    {masterData.contactTypes.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
                  {validationErrors.contact_type_id && (
                    <div className="invalid-feedback">{validationErrors.contact_type_id}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="category_id">Category *</Label>
                  <Input
                    type="select"
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    invalid={!!validationErrors.category_id}
                  >
                    <option value="">Select Category</option>
                    {masterData.categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </Input>
                  {validationErrors.category_id && (
                    <div className="invalid-feedback">{validationErrors.category_id}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="subcategory_id">Sub Category *</Label>
                  <Input
                    type="select"
                    id="subcategory_id"
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.category_id || subcategoriesLoading}
                    invalid={!!validationErrors.subcategory_id}
                  >
                    <option value="">
                      {subcategoriesLoading
                        ? "Loading subcategories..."
                        : !formData.category_id
                          ? "Select Category first"
                          : getSubCategoryOptions().length === 0
                            ? "No subcategories available"
                            : "Select Sub Category"}
                    </option>
                    {getSubCategoryOptions().map(subCat => (
                      <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                    ))}
                  </Input>
                  {subcategoriesLoading && (
                    <small className="text-info">
                      <i className="fa fa-spinner fa-spin me-1"></i>
                      Loading subcategories...
                    </small>
                  )}
                  {validationErrors.subcategory_id && (
                    <div className="invalid-feedback">{validationErrors.subcategory_id}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="impact_id">Impact *</Label>
                  <Input
                    type="select"
                    id="impact_id"
                    name="impact_id"
                    value={formData.impact_id}
                    onChange={handleInputChange}
                    required
                    invalid={!!validationErrors.impact_id}
                  >
                    <option value="">Select Impact</option>
                    {masterData.impacts.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
                  {validationErrors.impact_id && (
                    <div className="invalid-feedback">{validationErrors.impact_id}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="urgency_id">Urgency *</Label>
                  <Input
                    type="select"
                    id="urgency_id"
                    name="urgency_id"
                    value={formData.urgency_id}
                    onChange={handleInputChange}
                    required
                    invalid={!!validationErrors.urgency_id}
                  >
                    <option value="">Select Urgency</option>
                    {masterData.urgencies.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
                  {validationErrors.urgency_id && (
                    <div className="invalid-feedback">{validationErrors.urgency_id}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="asset_id">Asset</Label>
                  <Input
                    type="select"
                    id="asset_id"
                    name="asset_id"
                    value={formData.asset_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Asset (Optional)</option>
                    {masterData.assets.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="site_id">Site</Label>
                  <Input
                    type="select"
                    id="site_id"
                    name="site_id"
                    value={formData.site_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Site (Optional)</option>
                    {masterData.sites.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="postcode">Postcode</Label>
                  <Input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="e.g., SW1A 1AA"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="address">Address/Location</Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address or location"
                  />
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="short_description">Short Description *</Label>
                  <Input
                    type="text"
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the incident"
                    required
                    maxLength={100}
                    invalid={!!validationErrors.short_description}
                  />
                  <small className="text-muted">
                    {formData.short_description.length}/100 characters
                  </small>
                  {validationErrors.short_description && (
                    <div className="invalid-feedback">{validationErrors.short_description}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="description">Detailed Description *</Label>
                  <Input
                    type="textarea"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide detailed information about the incident"
                    rows={4}
                    required
                    invalid={!!validationErrors.description}
                  />
                  {validationErrors.description && (
                    <div className="invalid-feedback">{validationErrors.description}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              {onCancel && (
                <Button type="button" color="secondary" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                color="primary"
                disabled={isSubmitting}
                className="d-flex align-items-center"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Incident'
                )}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Incident Submission</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                >
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to submit this incident?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Category:</strong> {getCategoryName(formData.category_id)}<br/>
                  <strong>Sub Category:</strong> {getSubCategoryName(formData.subcategory_id)}<br/>
                  <strong>Contact Type:</strong> {getContactTypeName(formData.contact_type_id)}<br/>
                  <strong>Description:</strong> {formData.short_description}
                </div>
              </div>
              <div className="modal-footer">
                <Button color="secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleConfirmSubmit}>
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default IncidentCreationForm;
