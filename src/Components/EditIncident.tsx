'use client'
import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Form, FormGroup, Label, Input, Table, Alert } from 'reactstrap'
import {
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../app/(MainBody)/services/incidentService';

interface EditIncidentProps {
  incident: Incident;
  userType?: string;
  onClose: () => void;
  onSave: () => void;
}

const EditIncident: React.FC<EditIncidentProps> = ({ incident, userType, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Evidence tab states - start empty, load from API
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: number;
    name: string;
    url: string;
    uploadedAt: string;
    size: string;
  }>>([]);

  // Ammonia readings - start empty, load from API
  const [ammoniaReadings, setAmmoniaReadings] = useState<Array<{
    id: number;
    type: string;
    reading: string;
    date: string;
  }>>([]);

  // Actions - start empty, load from API
  const [actions, setActions] = useState<Array<{
    id: string;
    raised: string;
    complete: boolean;
    age: string;
    type: string;
    priority: string;
    detail: string;
    status: string;
    createdAt: string;
  }>>([]);

  // Similar incidents - start empty, load from API
  const [similarIncidents, setSimilarIncidents] = useState<Incident[]>([]);

  // Form states
  const [editForm, setEditForm] = useState({
    shortDescription: '',
    description: ''
  });

  const [advancedEditForm, setAdvancedEditForm] = useState({
    shortDescription: '',
    description: '',
    category: '',
    subCategory: '',
    contactType: '',
    impact: '',
    urgency: '',
    status: '',
    narration: ''
  });

  // New form states
  const [newAmmoniaReading, setNewAmmoniaReading] = useState({
    type: 'Upstream',
    date: '',
    reading: ''
  });

  const [newAction, setNewAction] = useState({
    actionType: '',
    actionStatus: '',
    priority: '',
    raisedOn: '',
    details: '',
    isComplete: false
  });

  // Mock similar incidents finder - for demonstration only
  const findSimilarIncidents = (): Incident[] => {
    return [
      {
        id: 'similar-1',
        number: 'INC-2024-001',
        shortDescription: 'Similar sewage issue resolved',
        category: incident.category,
        subCategory: incident.subCategory,
        status: 'resolved' as const,
        priority: 'Medium',
        createdAt: '2024-01-15T10:00:00Z',
        caller: 'John Smith',
        description: 'Similar issue was resolved by cleaning the drain and replacing damaged pipe.',
        contactType: 'Phone',
        impact: 'Moderate',
        urgency: 'Medium',
        reportedBy: 'john.smith@email.com'
      } as Incident,
      {
        id: 'similar-2',
        number: 'INC-2024-002',
        shortDescription: 'Sewage overflow - quick fix',
        category: incident.category,
        subCategory: incident.subCategory,
        status: 'closed' as const,
        priority: 'High',
        createdAt: '2024-01-10T14:30:00Z',
        caller: 'Jane Doe',
        description: 'Issue resolved by emergency response team within 2 hours.',
        contactType: 'Email',
        impact: 'Significant',
        urgency: 'High',
        reportedBy: 'jane.doe@email.com'
      } as Incident
    ];
  };

  // Check if user has advanced edit permissions
  const hasAdvancedEditPermissions = () => {
    const currentUserType = userType?.toLowerCase() || '';
    return currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin') ||
           currentUserType.includes('field_engineer') ||
           currentUserType.includes('water_pollution_expert');
  };

  // Category and subcategory options
  const categoryOptions = [
    { id: '1', name: 'Inside home' },
    { id: '2', name: 'Street Pavement' },
    { id: '3', name: 'SP site' },
    { id: '4', name: 'Outside drive way /garden' },
    { id: '5', name: 'River strem or lake' }
  ];

  const subcategoryOptions: Record<string, Array<{id: string, name: string}>> = {
    '1': [
      { id: '1', name: 'Leak from my pipe' },
      { id: '2', name: 'Toilet/sink /shower issues' },
      { id: '3', name: 'Sewage spillout' },
      { id: '4', name: 'Cover or lid is damaged' },
      { id: '5', name: 'Sewage smell in my home' },
      { id: '6', name: 'Blocked alarm' }
    ],
    '2': [
      { id: '7', name: 'Manhole blocked /smelly' },
      { id: '8', name: 'Cover or lid is damaged' },
      { id: '9', name: 'Smelly sewage over flowing on the street' },
      { id: '10', name: 'Roadside drain or gully that is blocked' }
    ],
    '3': [
      { id: '11', name: 'Mark the site in the map or list of SP sites' }
    ],
    '4': [
      { id: '12', name: 'Leak on my property outside' },
      { id: '13', name: 'Blocked /smelly manhole on my property' },
      { id: '14', name: 'Sewage overflow on my property' },
      { id: '15', name: 'Blocked drain on my property' },
      { id: '16', name: 'Sewage odour outside my home' }
    ],
    '5': []
  };

  const getCategoryIdByName = (name: string) => {
    const category = categoryOptions.find(cat => cat.name === name);
    return category?.id || '';
  };

  const getSubCategoryOptions = (categoryName: string) => {
    const categoryId = getCategoryIdByName(categoryName);
    if (!categoryId || !subcategoryOptions[categoryId]) {
      return [];
    }
    return subcategoryOptions[categoryId];
  };

  // Load initial data and evidence from API
  useEffect(() => {
    const loadIncidentData = async () => {
      try {
        setLoading(true);

        // Initialize form data
        if (hasAdvancedEditPermissions()) {
          setAdvancedEditForm({
            shortDescription: incident.shortDescription || '',
            description: incident.description || '',
            category: incident.category || '',
            subCategory: incident.subCategory || '',
            contactType: incident.contactType || '',
            impact: incident.impact || '',
            urgency: incident.urgency || '',
            status: incident.status || 'pending',
            narration: ''
          });
        } else {
          setEditForm({
            shortDescription: incident.shortDescription || '',
            description: incident.description || ''
          });
        }

        // Load evidence data from API if available
        // TODO: Replace with actual API call
        // const evidenceData = await fetchIncidentEvidence(incident.id);
        // setUploadedImages(evidenceData.images || []);
        // setAmmoniaReadings(evidenceData.readings || []);
        // setActions(evidenceData.actions || []);

        // Load similar incidents from API if handler
        if (hasAdvancedEditPermissions()) {
          // TODO: Replace with actual API call
          // const similar = await fetchSimilarIncidents(incident.id);
          // setSimilarIncidents(similar || []);

          // For now, load mock data for demonstration
          setSimilarIncidents(findSimilarIncidents());
        }

      } catch (error: any) {
        console.error('Error loading incident data:', error);
        setError('Failed to load incident data');
      } finally {
        setLoading(false);
      }
    };

    loadIncidentData();
  }, [incident]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        // TODO: Replace with actual API call
        // const uploadResult = await uploadEvidencePhoto(incident.id, file);

        // For now, create local preview
        const newImage = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toLocaleString(),
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        };
        setUploadedImages(prev => [...prev, newImage]);
      }
      setSuccess('Images uploaded successfully');
    } catch (error: any) {
      setError(`Failed to upload images: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (id: number) => {
    try {
      // TODO: Replace with actual API call
      // await deleteEvidencePhoto(id);

      setUploadedImages(prev => prev.filter(img => img.id !== id));
      setSuccess('Image deleted successfully');
    } catch (error: any) {
      setError(`Failed to delete image: ${error.message}`);
    }
  };

  const handleAmmoniaSubmit = async () => {
    if (!newAmmoniaReading.type || !newAmmoniaReading.date || !newAmmoniaReading.reading) {
      setError('Please fill in all ammonia reading fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await submitAmmoniaReading(incident.id, newAmmoniaReading);

      const newReading = {
        id: Date.now(),
        type: newAmmoniaReading.type,
        reading: `${newAmmoniaReading.reading} mg/L`,
        date: newAmmoniaReading.date
      };
      setAmmoniaReadings(prev => [...prev, newReading]);
      setNewAmmoniaReading({ type: 'Upstream', date: '', reading: '' });
      setSuccess('Ammonia reading submitted successfully');
    } catch (error: any) {
      setError(`Failed to submit ammonia reading: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async () => {
    if (!newAction.actionType || !newAction.details) {
      setError('Please fill in action type and details');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await submitAction(incident.id, newAction);

      const newActionEntry = {
        id: `ACT-${String(Date.now()).slice(-3)}`,
        raised: newAction.raisedOn || new Date().toISOString().split('T')[0],
        complete: newAction.isComplete,
        age: '0 days',
        type: newAction.actionType,
        priority: newAction.priority || 'Medium',
        detail: newAction.details,
        status: newAction.actionStatus || 'Open',
        createdAt: new Date().toLocaleString()
      };
      setActions(prev => [...prev, newActionEntry]);
      setNewAction({
        actionType: '',
        actionStatus: '',
        priority: '',
        raisedOn: '',
        details: '',
        isComplete: false
      });
      setSuccess('Action submitted successfully');
    } catch (error: any) {
      setError(`Failed to submit action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Prepare update data
      let updateData: any = {};

      if (hasAdvancedEditPermissions()) {
        updateData = {
          shortDescription: advancedEditForm.shortDescription,
          description: advancedEditForm.description,
          category: advancedEditForm.category,
          subCategory: advancedEditForm.subCategory,
          contactType: advancedEditForm.contactType,
          impact: advancedEditForm.impact,
          urgency: advancedEditForm.urgency,
          status: advancedEditForm.status,
          narration: advancedEditForm.narration
        };
      } else {
        updateData = {
          shortDescription: editForm.shortDescription,
          description: editForm.description
        };
      }

      // TODO: Replace with actual API call
      // const result = await updateIncident(incident.id, updateData);
      console.log('Updating incident:', incident.id, updateData);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Incident updated successfully');

      // Close modal after short delay to show success message
      setTimeout(() => {
        onSave();
      }, 1500);

    } catch (error: any) {
      console.error('Error updating incident:', error);
      setError(error.message || 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Modal isOpen={true} toggle={onClose} size="xl" style={{ maxWidth: '95vw', width: '95vw' }}>
      <ModalHeader toggle={onClose}>
        Edit Incident - {incident.number}
      </ModalHeader>
      <ModalBody style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Success/Error Messages */}
        {error && (
          <Alert color="danger" toggle={clearMessages}>
            <strong>Error:</strong> {error}
          </Alert>
        )}
        {success && (
          <Alert color="success" toggle={clearMessages}>
            <strong>Success:</strong> {success}
          </Alert>
        )}

        {/* Status Flow Visualization */}
        {hasAdvancedEditPermissions() && (
          <div className="mb-4">
            <h6 className="text-dark mb-3">Incident State Flow</h6>
            <div className="d-flex w-100" style={{ height: '50px' }}>
              <div
                className={`d-flex align-items-center justify-content-center text-white ${incident.status === 'pending' ? 'fw-bold' : ''}`}
                style={{
                  flex: 1,
                  height: '50px',
                  backgroundColor: incident.status === 'pending' ? '#007bff' : '#6c757d',
                  position: 'relative',
                  clipPath: 'polygon(0 0, calc(100% - 25px) 0, 100% 50%, calc(100% - 25px) 100%, 0 100%)',
                  zIndex: 4
                }}
              >
                Pending
              </div>
              <div
                className={`d-flex align-items-center justify-content-center text-white ${incident.status === 'in_progress' ? 'fw-bold' : ''}`}
                style={{
                  flex: 1,
                  height: '50px',
                  backgroundColor: incident.status === 'in_progress' ? '#007bff' : '#6c757d',
                  position: 'relative',
                  clipPath: 'polygon(25px 0, calc(100% - 25px) 0, 100% 50%, calc(100% - 25px) 100%, 25px 100%, 0 50%)',
                  marginLeft: '-25px',
                  zIndex: 3
                }}
              >
                In Progress
              </div>
              <div
                className={`d-flex align-items-center justify-content-center text-white ${incident.status === 'resolved' ? 'fw-bold' : ''}`}
                style={{
                  flex: 1,
                  height: '50px',
                  backgroundColor: incident.status === 'resolved' ? '#007bff' : '#6c757d',
                  position: 'relative',
                  clipPath: 'polygon(25px 0, calc(100% - 25px) 0, 100% 50%, calc(100% - 25px) 100%, 25px 100%, 0 50%)',
                  marginLeft: '-25px',
                  zIndex: 1
                }}
              >
                Resolved
              </div>
              <div
                className={`d-flex align-items-center justify-content-center text-white ${incident.status === 'closed' ? 'fw-bold' : ''}`}
                style={{
                  flex: 1,
                  height: '50px',
                  backgroundColor: incident.status === 'closed' ? '#007bff' : '#6c757d',
                  position: 'relative',
                  clipPath: 'polygon(25px 0, 100% 0, 100% 100%, 25px 100%, 0 50%)',
                  marginLeft: '-25px',
                  zIndex: 0
                }}
              >
                Closed
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {hasAdvancedEditPermissions() ? (
          <Nav tabs className="mb-4">
            <NavItem>
              <NavLink
                className={activeTab === 'details' ? 'active' : ''}
                onClick={() => setActiveTab('details')}
                style={{ cursor: 'pointer' }}
              >
                Incident Details
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'evidence' ? 'active' : ''}
                onClick={() => setActiveTab('evidence')}
                style={{ cursor: 'pointer' }}
              >
                Evidence
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'action' ? 'active' : ''}
                onClick={() => setActiveTab('action')}
                style={{ cursor: 'pointer' }}
              >
                Action
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'knowledge' ? 'active' : ''}
                onClick={() => setActiveTab('knowledge')}
                style={{ cursor: 'pointer' }}
              >
                Knowledge Base
              </NavLink>
            </NavItem>
          </Nav>
        ) : null}

        <TabContent activeTab={hasAdvancedEditPermissions() ? activeTab : 'details'}>
          {/* Incident Details Tab */}
          <TabPane tabId="details">
            {hasAdvancedEditPermissions() ? (
              <>
                <h5 className="text-dark mb-4">Edit Incident Details</h5>
                <Form>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="incidentNo" className="text-dark">Incident No</Label>
                        <Input
                          type="text"
                          id="incidentNo"
                          value={incident.number}
                          disabled
                          className="bg-light"
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="contactType" className="text-dark">Contact Type</Label>
                        <Input
                          type="select"
                          id="contactType"
                          value={advancedEditForm.contactType}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, contactType: e.target.value})}
                        >
                          <option value="">Select Contact Type</option>
                          <option value="SelfService">SelfService</option>
                          <option value="Phone">Phone</option>
                          <option value="Email">Email</option>
                          <option value="Walk-in">Walk-in</option>
                          <option value="Walking">Walking</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="category" className="text-dark">Category</Label>
                        <Input
                          type="select"
                          id="category"
                          value={advancedEditForm.category}
                          onChange={(e) => {
                            const newCategory = e.target.value;
                            setAdvancedEditForm({
                              ...advancedEditForm,
                              category: newCategory,
                              subCategory: ''
                            });
                          }}
                        >
                          <option value="">Select Category</option>
                          {categoryOptions.map(category => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="subCategory" className="text-dark">Sub Category</Label>
                        <Input
                          type="select"
                          id="subCategory"
                          value={advancedEditForm.subCategory}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, subCategory: e.target.value})}
                          disabled={!advancedEditForm.category}
                        >
                          <option value="">Select Sub Category</option>
                          {getSubCategoryOptions(advancedEditForm.category).map(subCat => (
                            <option key={subCat.id} value={subCat.name}>{subCat.name}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="shortDescription" className="text-dark">Short Description</Label>
                        <Input
                          type="textarea"
                          id="shortDescription"
                          rows="3"
                          value={advancedEditForm.shortDescription}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, shortDescription: e.target.value})}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="description" className="text-dark">Description</Label>
                        <Input
                          type="textarea"
                          id="description"
                          rows="3"
                          value={advancedEditForm.description}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, description: e.target.value})}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="impact" className="text-dark">Impact</Label>
                        <Input
                          type="select"
                          id="impact"
                          value={advancedEditForm.impact}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, impact: e.target.value})}
                        >
                          <option value="">Select Impact</option>
                          <option value="Significant">Significant</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Low">Low</option>
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="urgency" className="text-dark">Urgency</Label>
                        <Input
                          type="select"
                          id="urgency"
                          value={advancedEditForm.urgency}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, urgency: e.target.value})}
                        >
                          <option value="">Select Urgency</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="incidentState" className="text-dark">Incident State</Label>
                        <Input
                          type="select"
                          id="incidentState"
                          value={advancedEditForm.status}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, status: e.target.value})}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label for="narration" className="text-dark">Narration</Label>
                        <Input
                          type="textarea"
                          id="narration"
                          rows="4"
                          value={advancedEditForm.narration}
                          onChange={(e) => setAdvancedEditForm({...advancedEditForm, narration: e.target.value})}
                          placeholder="Add your notes here..."
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </Form>
              </>
            ) : (
              <>
                <h5 className="text-dark mb-4">Edit Incident</h5>
                <Form>
                  <FormGroup>
                    <Label className="form-label text-dark"><strong>Title/Short Description:</strong></Label>
                    <Input
                      type="text"
                      value={editForm.shortDescription}
                      onChange={(e) => setEditForm({...editForm, shortDescription: e.target.value})}
                      placeholder="Enter short description"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label className="form-label text-dark"><strong>Detailed Description:</strong></Label>
                    <Input
                      type="textarea"
                      rows={6}
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Enter detailed description"
                    />
                  </FormGroup>
                  <div className="p-3 bg-light rounded">
                    <small className="text-muted">
                      <strong>Note:</strong> You can only edit the title and description of this incident.
                      Other fields like status, priority, and assignment are managed by the support team.
                    </small>
                  </div>
                </Form>
              </>
            )}
          </TabPane>

          {/* Evidence Tab */}
          {hasAdvancedEditPermissions() && (
            <TabPane tabId="evidence">
              <h5 className="text-dark mb-4">Evidence Collection</h5>

              {/* Photo Upload Section */}
              <div className="mb-4">
                <h6 className="text-dark">Upload Photos</h6>
                <FormGroup>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                  <small className="text-muted">Select multiple images to upload evidence</small>
                </FormGroup>

                {uploadedImages.length > 0 && (
                  <div className="table-responsive mt-3">
                    <Table>
                      <thead>
                        <tr>
                          <th>Preview</th>
                          <th>Name</th>
                          <th>Size</th>
                          <th>Uploaded</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedImages.map((image) => (
                          <tr key={image.id}>
                            <td>
                              <img src={image.url} alt="Evidence" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                            </td>
                            <td>{image.name}</td>
                            <td>{image.size}</td>
                            <td><small>{image.uploadedAt}</small></td>
                            <td>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleImageDelete(image.id)}
                                disabled={loading}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <hr />

              {/* Ammonia Reading Section */}
              <div className="mb-4">
                <h6 className="text-dark">Ammonia Reading</h6>
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Type</Label>
                      <Input
                        type="select"
                        value={newAmmoniaReading.type}
                        onChange={(e) => setNewAmmoniaReading({...newAmmoniaReading, type: e.target.value})}
                      >
                        <option value="Upstream">Upstream</option>
                        <option value="Downstream">Downstream</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newAmmoniaReading.date}
                        onChange={(e) => setNewAmmoniaReading({...newAmmoniaReading, date: e.target.value})}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Reading (mg/L)</Label>
                      <div className="d-flex gap-2">
                        <Input
                          type="number"
                          placeholder="Enter reading"
                          value={newAmmoniaReading.reading}
                          onChange={(e) => setNewAmmoniaReading({...newAmmoniaReading, reading: e.target.value})}
                        />
                        <Button
                          color="primary"
                          onClick={handleAmmoniaSubmit}
                          disabled={loading}
                        >
                          Submit
                        </Button>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>

                {ammoniaReadings.length > 0 && (
                  <div className="table-responsive mt-3">
                    <Table>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Reading</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ammoniaReadings.map((reading) => (
                          <tr key={reading.id}>
                            <td>{reading.type}</td>
                            <td>{reading.reading}</td>
                            <td>{reading.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </TabPane>
          )}

          {/* Action Tab */}
          {hasAdvancedEditPermissions() && (
            <TabPane tabId="action">
              <h5 className="text-dark mb-4">Action Management</h5>

              <Form className="mb-4">
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Action Type</Label>
                      <Input
                        type="select"
                        value={newAction.actionType}
                        onChange={(e) => setNewAction({...newAction, actionType: e.target.value})}
                      >
                        <option value="">Select Action Type</option>
                        <option value="Investigation">Investigation</option>
                        <option value="Resolution">Resolution</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Escalation">Escalation</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Action Status</Label>
                      <Input
                        type="select"
                        value={newAction.actionStatus}
                        onChange={(e) => setNewAction({...newAction, actionStatus: e.target.value})}
                      >
                        <option value="">Select Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Priority</Label>
                      <Input
                        type="select"
                        value={newAction.priority}
                        onChange={(e) => setNewAction({...newAction, priority: e.target.value})}
                      >
                        <option value="">Select Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newAction.raisedOn}
                        onChange={(e) => setNewAction({...newAction, raisedOn: e.target.value})}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label>Action Details</Label>
                  <Input
                    type="textarea"
                    rows="4"
                    placeholder="Enter detailed action description..."
                    value={newAction.details}
                    onChange={(e) => setNewAction({...newAction, details: e.target.value})}
                  />
                </FormGroup>

                <FormGroup check>
                  <Input
                    type="checkbox"
                    id="isComplete"
                    checked={newAction.isComplete}
                    onChange={(e) => setNewAction({...newAction, isComplete: e.target.checked})}
                  />
                  <Label check for="isComplete">Mark as Complete</Label>
                </FormGroup>

                <div className="text-end">
                  <Button
                    color="primary"
                    onClick={handleActionSubmit}
                    disabled={loading}
                  >
                    Add Action
                  </Button>
                </div>
              </Form>

              {actions.length > 0 && (
                <>
                  <hr />
                  <h6 className="text-dark">Action History</h6>
                  <div className="table-responsive">
                    <Table>
                      <thead>
                        <tr>
                          <th>Action ID</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Details</th>
                          <th>Created</th>
                          <th>Complete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actions.map((action) => (
                          <tr key={action.id}>
                            <td><small>{action.id}</small></td>
                            <td>{action.type}</td>
                            <td>
                              <Badge color={action.status === 'Completed' ? 'success' : action.status === 'In Progress' ? 'warning' : 'secondary'}>
                                {action.status}
                              </Badge>
                            </td>
                            <td>
                              <Badge color={action.priority === 'High' ? 'danger' : action.priority === 'Medium' ? 'warning' : 'info'}>
                                {action.priority}
                              </Badge>
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {action.detail}
                              </div>
                            </td>
                            <td><small>{action.createdAt}</small></td>
                            <td>
                              <Badge color={action.complete ? 'success' : 'warning'}>
                                {action.complete ? 'Yes' : 'No'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </TabPane>
          )}

          {/* Knowledge Base Tab */}
          {hasAdvancedEditPermissions() && (
            <TabPane tabId="knowledge">
              <h5 className="text-dark mb-4">Knowledge Base</h5>
              <p className="text-muted mb-4">
                Similar resolved incidents that may help with this case. In production, this data will be loaded from the API.
              </p>

              {similarIncidents.length > 0 ? (
                <div className="table-responsive">
                  <Table>
                    <thead>
                      <tr>
                        <th>Incident Number</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Resolution Date</th>
                        <th>Solution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {similarIncidents.map((similarIncident) => (
                        <tr key={similarIncident.id}>
                          <td>
                            <span className="fw-medium text-primary">{similarIncident.number}</span>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{similarIncident.shortDescription}</div>
                              <small className="text-muted">{similarIncident.category}</small>
                            </div>
                          </td>
                          <td>{similarIncident.category}</td>
                          <td>
                            <Badge style={{ backgroundColor: getStatusColor(similarIncident.status), color: 'white' }}>
                              {similarIncident.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td>
                            <Badge style={{ backgroundColor: getPriorityColor(similarIncident.priority), color: 'white' }}>
                              {similarIncident.priority}
                            </Badge>
                          </td>
                          <td>
                            <small>{formatDate(similarIncident.createdAt).split(',')[0]}</small>
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {similarIncident.description}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <h6 className="text-muted">No Similar Incidents Found</h6>
                  <p className="text-muted">
                    Similar incidents will be loaded from the knowledge base API when available.
                    This helps handlers find solutions from previously resolved cases.
                  </p>
                </div>
              )}
            </TabPane>
          )}
        </TabContent>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          onClick={handleSaveEdit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            hasAdvancedEditPermissions() ? 'Update Incident' : 'Save Changes'
          )}
        </Button>
        <Button color="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditIncident;
