// src/components/IncidentCreationForm.tsx - Complete Production-Ready Version
"use client";
import React, { useState } from 'react';
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';

// Import from the unified service
import {
  createIncident,
  type Incident
} from '../../app/(MainBody)/services/incidentService';

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
    contact_type_id: '3', // SelfService
    impact_id: '1', // Default to Significant
    urgency_id: '2', // Default to Medium
    description: '',
    address: '',
    postcode: '',
    latitude: '',
    longitude: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [spellCheckResults, setSpellCheckResults] = useState<any[]>([]);
  const [isSpellChecking, setIsSpellChecking] = useState(false);

  // AI Description Generation states
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Category and subcategory options with IDs matching your backend
  const categoryOptions = [
    { id: '1', name: 'Inside home' },
    { id: '2', name: 'Street Pavement' },
    { id: '3', name: 'SP site' },
    { id: '4', name: 'Outside drive way /garden' },
    { id: '5', name: 'River strem or lake' }
  ];

  const subcategoryOptions: Record<string, Array<{id: string, name: string}>> = {
    '1': [ // Inside home
      { id: '1', name: 'Leak from my pipe' },
      { id: '2', name: 'Toilet/sink /shower issues' },
      { id: '3', name: 'Sewage spillout' },
      { id: '4', name: 'Cover or lid is damaged' },
      { id: '5', name: 'Sewage smell in my home' },
      { id: '6', name: 'Blocked alarm' }
    ],
    '2': [ // Street Pavement
      { id: '7', name: 'Manhole blocked /smelly' },
      { id: '8', name: 'Cover or lid is damaged' },
      { id: '9', name: 'Smelly sewage over flowing on the street' },
      { id: '10', name: 'Roadside drain or gully that is blocked' }
    ],
    '3': [ // SP site
      { id: '11', name: 'Mark the site in the map or list of SP sites' }
    ],
    '4': [ // Outside drive way /garden
      { id: '12', name: 'Leak on my property outside' },
      { id: '13', name: 'Blocked /smelly manhole on my property' },
      { id: '14', name: 'Sewage overflow on my property' },
      { id: '15', name: 'Blocked drain on my property' },
      { id: '16', name: 'Sewage odour outside my home' }
    ],
    '5': [ // River stream or lake
      // Add subcategories if available
    ]
  };

  // Contact type options
  const contactTypeOptions = [
    { id: '3', name: 'SelfService' },
    { id: '1', name: 'Phone' },
    { id: '2', name: 'Email' },
    { id: '4', name: 'Walk-in' }
  ];

  // Impact options
  const impactOptions = [
    { id: '1', name: 'Significant' },
    { id: '2', name: 'Moderate' },
    { id: '3', name: 'Low' }
  ];

  // Urgency options
  const urgencyOptions = [
    { id: '1', name: 'High' },
    { id: '2', name: 'Medium' },
    { id: '3', name: 'Low' },
    { id: '4', name: 'High' } // Note: Your DB shows both id 1 and 4 as "High"
  ];

  // Simple debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Simplified spell check function
  const checkSpelling = async (text: string) => {
    if (!text || text.length < 10) {
      setSpellCheckResults([]);
      return;
    }

    setIsSpellChecking(true);
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: 'en-US'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSpellCheckResults(data.matches || []);
      } else {
        setSpellCheckResults([]);
      }
    } catch (error) {
      console.log('Spell check error:', error);
      setSpellCheckResults([]);
    } finally {
      setIsSpellChecking(false);
    }
  };

  // Debounced spell check
  const debouncedSpellCheck = React.useCallback(
    debounce((text: string) => checkSpelling(text), 1500),
    []
  );

  // Apply spell check suggestion
  const applySuggestion = (errorIndex: number, suggestion: string) => {
    const error = spellCheckResults[errorIndex];
    if (!error) return;

    const currentText = formData.description;
    const beforeError = currentText.substring(0, error.offset);
    const afterError = currentText.substring(error.offset + error.length);
    const newText = beforeError + suggestion + afterError;

    setFormData(prev => ({ ...prev, description: newText }));

    // Re-check spelling after applying suggestion
    setTimeout(() => checkSpelling(newText), 500);
  };

  // AI-powered description generation
  const generateAIDescriptions = async () => {
    if (!formData.category_id || !formData.subcategory_id) {
      setAiError('Please select both category and subcategory first.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);
    setAiSuggestions([]);

    try {
      const categoryName = getCategoryName(formData.category_id);
      const subcategoryName = getSubCategoryName(formData.subcategory_id);

      // Simple prompt for AI
      const prompt = `You are writing incident reports for customers reporting ${subcategoryName.toLowerCase()} issues in ${categoryName.toLowerCase()} areas.

Write 3 different customer complaints. Each should be 30-60 words, direct and simple.

Examples of good reports:
- "Manhole cover on my street is broken and smells terrible. Water pooling around it."
- "Toilet keeps backing up and overflowing. Need urgent help."
- "Strong sewage smell from drain in my garden. Getting worse each day."

Write 3 similar reports for ${subcategoryName.toLowerCase()} problems. Separate each with |||

Just write the 3 reports, nothing else:`;

      // Call Groq AI API endpoint
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`Groq AI service error: ${response.status}`);
      }

      const data = await response.json();

      // Parse Groq AI response
      let descriptions: string[] = [];

      if (data.content) {
        descriptions = data.content.split('|||')
          .map((desc: string) => desc.trim())
          .filter((desc: string) => desc.length > 20);
      }

      if (descriptions.length === 0) {
        throw new Error('No valid descriptions generated');
      }

      setAiSuggestions(descriptions);

    } catch (error) {
      console.error('AI generation failed:', error);
      setAiError('Groq AI service is currently unavailable. Please write your description manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser.');
      return;
    }

    setLoadingLocation(true);
    setLocationStatus('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toString();
        const longitude = position.coords.longitude.toString();

        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));

        setLocationStatus(`Location captured: ${latitude.substring(0, 8)}, ${longitude.substring(0, 8)}`);
        setLoadingLocation(false);

        // Optional: Reverse geocode to get address
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Unable to get location: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        setLocationStatus(errorMessage);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (latitude: string, longitude: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const address = data.display_name;
          const postcode = data.address?.postcode || '';

          setFormData(prev => ({
            ...prev,
            address: address,
            postcode: postcode
          }));
        }
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }
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

        const latitude = result.latitude ? result.latitude.toString() : '';
        const longitude = result.longitude ? result.longitude.toString() : '';

        setFormData(prev => ({
          ...prev,
          address: fullAddress,
          latitude,
          longitude
        }));

        if (latitude && longitude) {
          setLocationStatus(`Location from postcode: ${latitude.substring(0, 8)}, ${longitude.substring(0, 8)}`);
        }
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

      if (name === 'category_id') {
        newData.subcategory_id = '';
        setAiSuggestions([]);
        setAiError(null);
      }

      if (name === 'subcategory_id') {
        setAiSuggestions([]);
        setAiError(null);
      }

      if (name === 'postcode' && value.length >= 5) {
        setTimeout(() => lookupPostcode(value), 500);
      }

      // Trigger spell check for description field
      if (name === 'description') {
        debouncedSpellCheck(value);
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

    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }

    if (!formData.subcategory_id) {
      errors.subcategory_id = 'Sub Category is required';
    }

    if (!formData.short_description.trim()) {
      errors.short_description = 'Short description is required';
    } else if (formData.short_description.length < 10) {
      errors.short_description = 'Short description must be at least 10 characters';
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
      const currentUser = getCurrentUser();

      if (!currentUser?.id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const parsedUserId = parseInt(currentUser.id, 10);
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid user ID. Please log in again.');
      }

      if (!formData.category_id || !formData.subcategory_id) {
        throw new Error('Category and Sub Category are required');
      }

      const incidentData = {
        user_id: parsedUserId,
        incidentstate_id: 1, // New
        urgency_id: parseInt(formData.urgency_id, 10),
        category_id: parseInt(formData.category_id, 10),
        subcategory_id: parseInt(formData.subcategory_id, 10),
        contact_type_id: parseInt(formData.contact_type_id, 10),
        impact_id: parseInt(formData.impact_id, 10),
        short_description: formData.short_description,
        description: formData.description,
        address: formData.address,
        postcode: formData.postcode,
        lat: formData.latitude || null,
        lng: formData.longitude || null
      };

      const createdIncident = await createIncident(incidentData);

      if (onIncidentCreated) {
        onIncidentCreated(createdIncident);
      }

      // Reset form
      setFormData({
        caller: userName || '',
        category_id: '',
        subcategory_id: '',
        short_description: '',
        contact_type_id: '3',
        impact_id: '1',
        urgency_id: '2',
        description: '',
        address: '',
        postcode: '',
        latitude: '',
        longitude: ''
      });

      setValidationErrors({});
      setLocationStatus('');
      setAiSuggestions([]);
      setAiError(null);
      setSpellCheckResults([]);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 5000);

    } catch (error: any) {
      console.error('Create incident error:', error);
      setError(error.message || 'Failed to create incident. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);

    setFormData({
      caller: userName || '',
      category_id: '',
      subcategory_id: '',
      short_description: '',
      contact_type_id: '3',
      impact_id: '1',
      urgency_id: '2',
      description: '',
      address: '',
      postcode: '',
      latitude: '',
      longitude: ''
    });

    setValidationErrors({});
    setLocationStatus('');
    setAiSuggestions([]);
    setAiError(null);
    setSpellCheckResults([]);
    setShowCancelMessage(true);
    setShowSuccess(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setShowCancelMessage(false);
    }, 4000);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };

  const getSubCategoryOptions = () => {
    if (!formData.category_id || !subcategoryOptions[formData.category_id]) {
      return [];
    }
    return subcategoryOptions[formData.category_id];
  };

  const getCategoryName = (id: string) => {
    const category = categoryOptions.find(cat => cat.id === id);
    return category?.name || '';
  };

  const getSubCategoryName = (id: string) => {
    const subCat = getSubCategoryOptions().find(sub => sub.id === id);
    return subCat?.name || '';
  };

  const getImpactName = (id: string) => {
    const impact = impactOptions.find(imp => imp.id === id);
    return impact?.name || '';
  };

  const getUrgencyName = (id: string) => {
    const urgency = urgencyOptions.find(urg => urg.id === id);
    return urgency?.name || '';
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
                  >
                    {contactTypeOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
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
                    {categoryOptions.map(category => (
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
                    disabled={!formData.category_id}
                    invalid={!!validationErrors.subcategory_id}
                  >
                    <option value="">Select Sub Category</option>
                    {getSubCategoryOptions().map(subCat => (
                      <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                    ))}
                  </Input>
                  {validationErrors.subcategory_id && (
                    <div className="invalid-feedback">{validationErrors.subcategory_id}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            {/* Show Impact and Urgency for all users, but make them read-only for regular users */}
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
                    disabled={userRole === 'User' || userRole === 'EndUser'}
                  >
                    {impactOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
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
                    disabled={userRole === 'User' || userRole === 'EndUser'}
                  >
                    {urgencyOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
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
              <Col md={6}>
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
                  <small className="text-muted d-block mt-1">
                    Address will be auto-filled from postcode
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
                  <Label for="short_description">Short Description *</Label>
                  <Input
                    type="text"
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the incident (min 10 characters)"
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
                  <Label for="description">
                    Detailed Description *
                    {isSpellChecking && (
                      <small className="text-info ms-2">
                        <i className="fa fa-spinner fa-spin"></i> Checking spelling...
                      </small>
                    )}
                    {spellCheckResults.length > 0 && !isSpellChecking && (
                      <small className="text-warning ms-2">
                        <i className="fa fa-exclamation-triangle"></i> {spellCheckResults.length} spelling/grammar issue(s) found
                      </small>
                    )}
                  </Label>

                  {/* AI-Generated Suggestions */}
                  {formData.category_id && formData.subcategory_id && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <Button
                          type="button"
                          color="info"
                          size="sm"
                          onClick={generateAIDescriptions}
                          disabled={isGeneratingAI}
                          className="d-flex align-items-center"
                        >
                          {isGeneratingAI ? (
                            <>
                              <i className="fa fa-spinner fa-spin me-1"></i>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-magic me-1"></i>
                              Generate AI Suggestions
                            </>
                          )}
                        </Button>
                      </div>

                      {aiError && (
                        <div className="alert alert-warning alert-sm p-2 mb-2">
                          <small>{aiError}</small>
                        </div>
                      )}

                      {aiSuggestions.length > 0 && (
                        <div className="border rounded p-2 bg-light">
                          <small className="text-muted d-block mb-2">
                            Click on any suggestion to use it as your description:
                          </small>
                          {aiSuggestions.map((suggestion, index) => (
                            <div key={index} className="mb-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary text-start w-100"
                                style={{
                                  fontSize: '0.85rem',
                                  padding: '0.5rem',
                                  height: 'auto',
                                  whiteSpace: 'normal',
                                  textAlign: 'left',
                                  lineHeight: '1.4'
                                }}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, description: suggestion }));
                                  setTimeout(() => checkSpelling(suggestion), 500);
                                }}
                                title="Click to use this AI-generated suggestion"
                              >
                                <strong>Option {index + 1}:</strong><br />
                                {suggestion}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Input
                      type="textarea"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Provide detailed information about the incident, including location, severity, and any immediate actions taken (min 20 characters). Use the AI suggestions above for help!"
                      rows={4}
                      required
                      invalid={!!validationErrors.description}
                      spellCheck={true}
                    />

                    {/* Simple spell check suggestions below textarea */}
                    {spellCheckResults.length > 0 && (
                      <div className="mt-2 p-2 border rounded bg-light">
                        <small className="text-muted d-block mb-2">
                          <i className="fa fa-spell-check"></i> Found {spellCheckResults.length} spelling/grammar suggestion(s):
                        </small>
                        {spellCheckResults.slice(0, 5).map((error, index) => (
                          <div key={index} className="mb-2 p-2 border rounded bg-white">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong className="text-danger">"{formData.description.substring(error.offset, error.offset + error.length)}"</strong>
                                <small className="text-muted d-block">{error.message}</small>
                              </div>
                              <div className="ms-2">
                                {error.replacements && error.replacements.length > 0 && (
                                  <div className="d-flex flex-wrap gap-1">
                                    {error.replacements.slice(0, 3).map((replacement: any, repIndex: number) => (
                                      <Button
                                        key={repIndex}
                                        size="sm"
                                        color="outline-success"
                                        onClick={() => applySuggestion(index, replacement.value)}
                                      >
                                        {replacement.value}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    opacity: 0.5,
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Are you sure you want to submit this incident?</p>
                <div className="bg-light p-3 rounded">
                  <div className="row text-black">
                    <div className="col-6">
                      <strong>Category:</strong> {getCategoryName(formData.category_id)}<br/>
                      <strong>Sub Category:</strong> {getSubCategoryName(formData.subcategory_id)}<br/>
                    </div>
                    <div className="col-6">
                      <strong>Impact:</strong> {getImpactName(formData.impact_id)}<br/>
                      <strong>Urgency:</strong> {getUrgencyName(formData.urgency_id)}<br/>
                      <strong>Location:</strong> {formData.address}
                    </div>
                  </div>
                  <div className="mt-2 text-black">
                    <strong>Description:</strong> {formData.short_description}
                  </div>
                </div>
                <div className="mt-3 p-2 bg-info bg-opacity-10 rounded">
                  <small className="text-info">
                    <i className="fa fa-info-circle me-1"></i>
                    <strong>Tip:</strong> Click the × button above if you need to edit any details before submitting.
                  </small>
                </div>
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
                  Submit
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
