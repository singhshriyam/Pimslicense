// src/components/IncidentCreationForm.tsx - Fixed version
"use client";
import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';

// Import from the correct path with proper exports
import {
  Incident,
  createIncidentAPI,
  generateIncidentNumber
} from '../../app/(MainBody)/services/incidentService';

interface IncidentFormData {
  number: string;
  caller: string;
  category: string;
  subCategory: string;
  shortDescription: string;
  contactType: string;
  impact: string;
  urgency: string;
  description: string;
  address: string;
  postcode: string;
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
    number: generateIncidentNumber(),
    caller: userName || '',
    category: '',
    subCategory: '',
    shortDescription: '',
    contactType: 'Email',
    impact: 'Moderate',
    urgency: 'Medium',
    description: '',
    address: '',
    postcode: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Category and subcategory options
  const categoryOptions = {
    'River or lake': [
      'Water contamination',
      'Air pollution',
      'Soil contamination',
      'Noise pollution',
      'Chemical spill',
      'Oil spill',
      'Sewage overflow'
    ],
    'Street Pavement': [
      'Gas leak',
      'Chemical exposure',
      'Equipment malfunction',
      'Fire hazard',
      'Waste disposal',
      'Health hazard',
      'Emergency response'
    ],
    'Inside home': [
      'Leak from my pipe',
      'Water quality issue',
      'Plumbing problem',
      'Drainage issue',
      'Water pressure problem',
      'Hot water issue',
      'Pipe burst'
    ],
    'Infrastructure': [
      'Network issue',
      'Power outage',
      'Equipment failure',
      'System maintenance',
      'Communication problem',
      'Technical support',
      'Hardware malfunction'
    ]
  };

  // Auto-detect address from UK postcode
  const lookupPostcode = async (postcode: string) => {
    if (!postcode || postcode.length < 5) return;

    setLoadingAddress(true);
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;
        const fullAddress = [
          result.admin_district,
          result.admin_county,
          result.country
        ].filter(Boolean).join(', ');

        setFormData(prev => ({
          ...prev,
          address: fullAddress
        }));
      }
    } catch (error) {
      // Silently fail postcode lookup
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      if (name === 'category') {
        newData.subCategory = '';
      }

      if (name === 'postcode' && value.length >= 5) {
        setTimeout(() => lookupPostcode(value), 500);
      }

      return newData;
    });

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

    if (!formData.caller.trim()) {
      errors.caller = 'Caller name is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.subCategory) {
      errors.subCategory = 'Sub Category is required';
    }

    if (!formData.shortDescription.trim()) {
      errors.shortDescription = 'Short description is required';
    } else if (formData.shortDescription.length < 10) {
      errors.shortDescription = 'Short description must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Detailed description is required';
    } else if (formData.description.length < 20) {
      errors.description = 'Detailed description must be at least 20 characters';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address/Location is required';
    } else if (formData.address.length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    if (!formData.postcode.trim()) {
      errors.postcode = 'Postcode is required';
    } else if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(formData.postcode.trim())) {
      errors.postcode = 'Please enter a valid postcode';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError(null);
    setShowCancelMessage(false);

    try {
      const incidentData: Partial<Incident> = {
        ...formData,
        reportedBy: userEmail,
        reportedByName: userRole,
        status: 'pending'
      };

      const createdIncident = await createIncidentAPI(incidentData);

      if (onIncidentCreated) {
        onIncidentCreated(createdIncident);
      }

      setFormData({
        number: generateIncidentNumber(),
        caller: userName || '',
        category: '',
        subCategory: '',
        shortDescription: '',
        contactType: 'Email',
        impact: 'Moderate',
        urgency: 'Medium',
        description: '',
        address: '',
        postcode: ''
      });

      setValidationErrors({});
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 5000);

    } catch (error: any) {
      setError(error.message || 'Failed to create incident. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);

    setFormData({
      number: generateIncidentNumber(),
      caller: userName || '',
      category: '',
      subCategory: '',
      shortDescription: '',
      contactType: 'Email',
      impact: 'Moderate',
      urgency: 'Medium',
      description: '',
      address: '',
      postcode: ''
    });

    setValidationErrors({});
    setShowCancelMessage(true);
    setShowSuccess(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setShowCancelMessage(false);
    }, 4000);
  };

  const getSubCategoryOptions = () => {
    if (!formData.category || !categoryOptions[formData.category as keyof typeof categoryOptions]) {
      return [];
    }
    return categoryOptions[formData.category as keyof typeof categoryOptions];
  };

  return (
    <Container fluid className={compactMode ? "p-2" : "p-4"}>
      <Card>
        <CardBody>
          {!compactMode && (
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
          )}

          {compactMode && (
            <div className="mb-3">
              <h5 className="mb-1">Report New Incident</h5>
              <small className="text-muted">Reporting as: {userRole}</small>
            </div>
          )}

          {error && (
            <Alert color="danger" className="mb-4">
              <strong>Error!</strong> Failed to create incident: {error}
            </Alert>
          )}

          {showSuccess && (
            <Alert color="success" className="mb-4">
              <strong>Success!</strong> Incident has been created successfully!
              {!compactMode && <div className="mt-2">You can now view it in your incidents list.</div>}
            </Alert>
          )}

          {showCancelMessage && (
            <Alert color="warning" className="mb-4">
              <strong>Cancelled!</strong> Incident creation was cancelled. The form has been reset.
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="number">Incident Number *</Label>
                  <Input
                    type="text"
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    disabled
                    className="bg-light text-dark fw-bold"
                    style={{ color: '#000 !important' }}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="contactType">Contact Type *</Label>
                  <Input
                    type="select"
                    id="contactType"
                    name="contactType"
                    value={formData.contactType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Web">Web Portal</option>
                    <option value="Walk-in">Walk-in</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

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
                  <Label for="category">Category *</Label>
                  <Input
                    type="select"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    invalid={!!validationErrors.category}
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categoryOptions).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Input>
                  {validationErrors.category && (
                    <div className="invalid-feedback">{validationErrors.category}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="subCategory">Sub Category *</Label>
                  <Input
                    type="select"
                    id="subCategory"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.category}
                    invalid={!!validationErrors.subCategory}
                  >
                    <option value="">Select Sub Category</option>
                    {getSubCategoryOptions().map(subCat => (
                      <option key={subCat} value={subCat}>{subCat}</option>
                    ))}
                  </Input>
                  {validationErrors.subCategory && (
                    <div className="invalid-feedback">{validationErrors.subCategory}</div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="impact">Impact *</Label>
                  <Input
                    type="select"
                    id="impact"
                    name="impact"
                    value={formData.impact}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Significant">Significant</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="urgency">Urgency *</Label>
                  <Input
                    type="select"
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="postcode">Postcode *</Label>
                  <Input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="e.g., SW1A 1AA"
                    required
                    invalid={!!validationErrors.postcode}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {loadingAddress && (
                    <small className="text-info">
                      <i className="fa fa-spinner fa-spin me-1"></i>
                      Looking up address...
                    </small>
                  )}
                  {validationErrors.postcode && (
                    <div className="invalid-feedback">{validationErrors.postcode}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="address">Address/Location *</Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address will be auto-filled from postcode"
                    required
                    invalid={!!validationErrors.address}
                  />
                  <small className="text-muted">
                    {formData.postcode ?
                      'Address will be auto-filled from postcode' :
                      'Enter postcode above for auto-detection'
                    }
                  </small>
                  {validationErrors.address && (
                    <div className="invalid-feedback">{validationErrors.address}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="shortDescription">Short Description *</Label>
                  <Input
                    type="text"
                    id="shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the incident (min 10 characters)"
                    required
                    maxLength={100}
                    invalid={!!validationErrors.shortDescription}
                  />
                  <small className="text-muted">
                    {formData.shortDescription.length}/100 characters
                  </small>
                  {validationErrors.shortDescription && (
                    <div className="invalid-feedback">{validationErrors.shortDescription}</div>
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
                    placeholder="Provide detailed information about the incident, including location, severity, and any immediate actions taken (min 20 characters)"
                    rows={4}
                    required
                    invalid={!!validationErrors.description}
                  />
                  <small className="text-muted">
                    {formData.description.length} characters (minimum 20 required)
                  </small>
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
                <h5 className="modal-title">
                  <i className="fa fa-exclamation-triangle text-warning me-2"></i>
                  Confirm Incident Submission
                </h5>
              </div>
              <div className="modal-body">
                <p className="mb-3">Are you sure you want to submit this incident?</p>
                <div className="bg-light p-3 rounded">
                  <div className="row text-black">
                    <div className="col-6">
                      <strong>Category:</strong> {formData.category}<br/>
                      <strong>Sub Category:</strong> {formData.subCategory}<br/>
                    </div>
                    <div className="col-6">
                      <strong>Impact:</strong> {formData.impact}<br/>
                      <strong>Urgency:</strong> {formData.urgency}<br/>
                      <strong>Location:</strong> {formData.address}
                    </div>
                  </div>
                  <div className="mt-2 text-black">
                    <strong>Description:</strong> {formData.shortDescription}
                  </div>
                </div>
                <small className="text-black mt-2 d-block">
                  Once submitted, this incident will be assigned a tracking number and sent to the appropriate team for processing.
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancelSubmit}
                >
                  <i className="fa fa-times me-1"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmSubmit}
                >
                  <i className="fa fa-check me-1"></i>
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default IncidentCreationForm;
