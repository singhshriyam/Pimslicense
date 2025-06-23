'use client'
import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Table, Spinner } from 'reactstrap'
import {
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../app/(MainBody)/services/incidentService';
import { getCurrentUser } from '../app/(MainBody)/services/userService';

interface ViewIncidentProps {
  incident: any;
  onClose: () => void;
  userType?: string;
}

const API_BASE = 'https://apexwpc.apextechno.co.uk/api';

const ViewIncident: React.FC<ViewIncidentProps> = ({ incident, onClose, userType }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Master data for display
  const [masterData, setMasterData] = useState({
    categories: [] as Array<{id: number, name: string}>,
    contactTypes: [] as Array<{id: number, name: string}>,
    urgencies: [] as Array<{id: number, name: string}>,
    incidentStates: [] as Array<{id: number, name: string}>,
    assets: [] as Array<{id: number, name: string}>,
    sites: [] as Array<{id: number, name: string}>
  });

  const [evidenceData, setEvidenceData] = useState<{
    images: Array<{id: number, name: string, url: string, uploadedAt: string, size: string}>,
    readings: Array<{id: number, type: string, reading: string, date: string, unit: string}>,
    actions: Array<{
      id: string,
      action_type_id: string,
      action_status_id: string,
      action_priority_id: string,
      detail: string,
      raised: string,
      complete: boolean,
      created_at: string
    }>
  }>({
    images: [],
    readings: [],
    actions: []
  });

  // SLA Status state
  const [slaStatus, setSlaStatus] = useState({
    name: '',
    type: '',
    target: '',
    stage: '',
    businessTimeLeft: '',
    businessTimeElapsed: '',
    startTime: '',
    percentage: 0
  });

  // Get current user on component mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Check if user has elevated permissions
  const hasElevatedPermissions = () => {
    const currentUserType = userType?.toLowerCase() || '';
    return currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin') ||
           currentUserType.includes('field_engineer') ||
           currentUserType.includes('expert_team');
  };

  const isHandler = hasElevatedPermissions();

  // Load master data for display names
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [
          categoriesRes,
          contactTypesRes,
          urgenciesRes,
          incidentStatesRes,
          assetsRes,
          sitesRes
        ] = await Promise.all([
          fetch(`${API_BASE}/master/categories`),
          fetch(`${API_BASE}/master/contact-types`),
          fetch(`${API_BASE}/master/urgencies`),
          fetch(`${API_BASE}/master/incident-states`),
          fetch(`${API_BASE}/master/assets`),
          fetch(`${API_BASE}/master/sites`)
        ]);

        const [
          categories,
          contactTypes,
          urgencies,
          incidentStates,
          assets,
          sites
        ] = await Promise.all([
          categoriesRes.json(),
          contactTypesRes.json(),
          urgenciesRes.json(),
          incidentStatesRes.json(),
          assetsRes.json(),
          sitesRes.json()
        ]);

        setMasterData({
          categories: categories.data || [],
          contactTypes: contactTypes.data || [],
          urgencies: urgencies.data || [],
          incidentStates: incidentStates.data || [],
          assets: assets.data || [],
          sites: sites.data || []
        });
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, []);

  // Load SLA status from backend
  const loadSLAStatus = async () => {
    try {
      const incidentId = incident.id || incident.incident_id;
      const response = await fetch(`${API_BASE}/incident-sla-details?incident_id=${incidentId}`);
      if (response.ok) {
        const slaData = await response.json();
        if (slaData.success && slaData.data) {
          setSlaStatus({
            name: slaData.data.sla_name || '',
            type: slaData.data.sla_type || '',
            target: slaData.data.target_time || '',
            stage: slaData.data.current_stage || '',
            businessTimeLeft: slaData.data.business_time_left || '',
            businessTimeElapsed: slaData.data.business_time_elapsed || '',
            startTime: slaData.data.start_time || '',
            percentage: slaData.data.percentage_elapsed || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading SLA status:', error);
    }
  };

  // Load evidence data for handlers
  const loadEvidenceData = async () => {
    if (!isHandler) return;

    setLoading(true);
    try {
      const incidentId = incident.id || incident.incident_id;

      // Load evidence photos
      try {
        const photosRes = await fetch(`${API_BASE}/incident-handeler/evidence-photos/${incidentId}`);
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          if (photosData.success && photosData.data) {
            setEvidenceData(prev => ({
              ...prev,
              images: photosData.data.map((photo: any) => ({
                id: photo.id,
                name: photo.name || 'Evidence Photo',
                url: photo.url,
                uploadedAt: new Date(photo.created_at).toLocaleString(),
                size: photo.size || 'Unknown'
              }))
            }));
          }
        }
      } catch (error) {
        console.error('Error loading photos:', error);
      }

      // Load ammonia readings
      try {
        const readingsRes = await fetch(`${API_BASE}/incident-handeler/ammonia-readings/${incidentId}`);
        if (readingsRes.ok) {
          const readingsData = await readingsRes.json();
          if (readingsData.success && readingsData.data) {
            setEvidenceData(prev => ({
              ...prev,
              readings: readingsData.data.map((reading: any) => ({
                id: reading.id,
                type: reading.type,
                reading: reading.reading,
                date: reading.sample_date,
                unit: 'mg/L'
              }))
            }));
          }
        }
      } catch (error) {
        console.error('Error loading readings:', error);
      }

      // Load actions
      try {
        const actionsRes = await fetch(`${API_BASE}/incident-handeler/actions/${incidentId}`);
        if (actionsRes.ok) {
          const actionsData = await actionsRes.json();
          if (actionsData.success && actionsData.data) {
            setEvidenceData(prev => ({
              ...prev,
              actions: actionsData.data
            }));
          }
        }
      } catch (error) {
        console.error('Error loading actions:', error);
      }

    } catch (error) {
      console.error('Error loading evidence data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load additional data on mount
  useEffect(() => {
    const loadAdditionalData = async () => {
      await loadSLAStatus();
      await loadEvidenceData();
    };

    loadAdditionalData();
  }, [incident.id, isHandler]);

  const getStatusStepColor = (step: string) => {
    const currentStatus = incident.status;
    const steps = ['pending', 'in_progress', 'resolved', 'closed'];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(step);

    if (stepIndex <= currentIndex) {
      return '#28a745'; // Green for completed steps
    }
    return '#e9ecef'; // Gray for future steps
  };

  const getSLAColor = () => {
    if (slaStatus.percentage >= 100) return 'danger';
    if (slaStatus.percentage >= 80) return 'warning';
    return 'success';
  };

  // Helper functions to safely get values from incident data
  const getIncidentNumber = () => {
    return incident.number || incident.incident_no || 'N/A';
  };

  const getShortDescription = () => {
    return incident.shortDescription || incident.short_description || 'No description';
  };

  const getDescription = () => {
    return incident.description || incident.short_description || incident.shortDescription || 'No description';
  };

  const getCategoryName = () => {
    if (incident.category?.name) return incident.category.name;
    if (incident.category && typeof incident.category === 'string') return incident.category;
    const categoryId = incident.categoryId || incident.category_id;
    if (categoryId && masterData.categories.length > 0) {
      const category = masterData.categories.find(cat => cat.id === parseInt(categoryId.toString()));
      return category?.name || 'Unknown';
    }
    return 'Not specified';
  };

  const getSubCategoryName = () => {
    if (incident.subcategory?.name) return incident.subcategory.name;
    if (incident.subCategory?.name) return incident.subCategory.name;
    if (incident.subCategory && typeof incident.subCategory === 'string') return incident.subCategory;
    return 'Not specified';
  };

  const getContactTypeName = () => {
    if (incident.contact_type?.name) return incident.contact_type.name;
    if (incident.contactType?.name) return incident.contactType.name;
    if (incident.contactType && typeof incident.contactType === 'string') return incident.contactType;
    const contactTypeId = incident.contactTypeId || incident.contact_type_id;
    if (contactTypeId && masterData.contactTypes.length > 0) {
      const contactType = masterData.contactTypes.find(type => type.id === parseInt(contactTypeId.toString()));
      return contactType?.name || 'Unknown';
    }
    return 'Not specified';
  };

  const getUrgencyName = () => {
    if (incident.urgency?.name) return incident.urgency.name;
    if (incident.urgency && typeof incident.urgency === 'string') return incident.urgency;
    const urgencyId = incident.urgencyId || incident.urgency_id;
    if (urgencyId && masterData.urgencies.length > 0) {
      const urgency = masterData.urgencies.find(urg => urg.id === parseInt(urgencyId.toString()));
      return urgency?.name || 'Unknown';
    }
    return 'Not specified';
  };

  const getAssetName = () => {
    if (incident.asset?.name) return incident.asset.name;
    const assetId = incident.assetId || incident.asset_id;
    if (assetId && masterData.assets.length > 0) {
      const asset = masterData.assets.find(asset => asset.id === parseInt(assetId.toString()));
      return asset?.name || 'Unknown';
    }
    return 'Not specified';
  };

  const getSiteName = () => {
    if (incident.site?.name) return incident.site.name;
    const siteId = incident.siteId || incident.site_id;
    if (siteId && masterData.sites.length > 0) {
      const site = masterData.sites.find(site => site.id === parseInt(siteId.toString()));
      return site?.name || 'Unknown';
    }
    return 'Not specified';
  };

  const getPriorityName = () => {
    if (incident.priority?.name) return incident.priority.name;
    if (incident.priority && typeof incident.priority === 'string') return incident.priority;
    return 'Not specified';
  };

  const getImpactName = () => {
    if (incident.impact?.name) return incident.impact.name;
    if (incident.impact && typeof incident.impact === 'string') return incident.impact;
    return 'Not specified';
  };

  const getIncidentStateName = () => {
    if (incident.incidentstate?.name) return incident.incidentstate.name;
    if (incident.incidentState?.name) return incident.incidentState.name;
    if (incident.status) {
      return incident.status.replace('_', ' ').toUpperCase();
    }
    return 'Not specified';
  };

  const getAssignedToName = () => {
    if (incident.assigned_to?.name) {
      const fullName = incident.assigned_to.last_name
        ? `${incident.assigned_to.name} ${incident.assigned_to.last_name}`
        : incident.assigned_to.name;
      return fullName;
    }
    if (incident.assignedTo && typeof incident.assignedTo === 'string') return incident.assignedTo;
    return 'Unassigned';
  };

  const getReportedByName = () => {
    if (incident.user?.name) {
      const fullName = incident.user.last_name
        ? `${incident.user.name} ${incident.user.last_name}`
        : incident.user.name;
      return fullName;
    }
    if (incident.reportedByName) return incident.reportedByName;
    if (incident.caller) return incident.caller;
    return 'Not specified';
  };

  const getCreatedAt = () => {
    return incident.createdAt || incident.created_at || 'Not specified';
  };

  const getUpdatedAt = () => {
    return incident.updatedAt || incident.updated_at || 'Not specified';
  };

  const getLatitude = () => {
    return incident.latitude || incident.lat;
  };

  const getLocation = () => {
    return incident.address;
  };

  const getLongitude = () => {
    return incident.longitude || incident.lng;
  };

  // Helper function to get action type name
  const getActionTypeName = (typeId: string) => {
    const types: { [key: string]: string } = {
      '1': 'Investigation',
      '2': 'Resolution',
      '3': 'Follow-up',
      '4': 'Escalation',
      '5': 'Site Visit',
      '6': 'Customer Contact'
    };
    return types[typeId] || 'Unknown';
  };

  // Helper function to get action status name
  const getActionStatusName = (statusId: string) => {
    const statuses: { [key: string]: string } = {
      '1': 'Open',
      '2': 'In Progress',
      '3': 'Completed',
      '4': 'Cancelled',
      '5': 'On Hold'
    };
    return statuses[statusId] || 'Unknown';
  };

  // Helper function to get action priority name
  const getActionPriorityName = (priorityId: string) => {
    const priorities: { [key: string]: string } = {
      '1': 'High',
      '2': 'Medium',
      '3': 'Low'
    };
    return priorities[priorityId] || 'Unknown';
  };

  return (
    <Modal isOpen={true} toggle={onClose} size="xl" style={{ maxWidth: '95vw', width: '95vw' }}>
      <ModalHeader toggle={onClose}>
        Incident Details - {getIncidentNumber()}
      </ModalHeader>
      <ModalBody style={{ maxHeight: '80vh', overflowY: 'auto' }}>

        {/* Navigation Tabs for Handlers */}
        {isHandler && (
          <Nav tabs className="mb-4">
            <NavItem>
              <NavLink
                className={activeTab === 'details' ? 'active' : ''}
                onClick={() => setActiveTab('details')}
                style={{ cursor: 'pointer' }}
              >
                Details
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'evidence' ? 'active' : ''}
                onClick={() => setActiveTab('evidence')}
                style={{ cursor: 'pointer' }}
              >
                Evidence ({evidenceData.images.length + evidenceData.readings.length})
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'actions' ? 'active' : ''}
                onClick={() => setActiveTab('actions')}
                style={{ cursor: 'pointer' }}
              >
                Actions ({evidenceData.actions.length})
              </NavLink>
            </NavItem>
          </Nav>
        )}

        <TabContent activeTab={isHandler ? activeTab : 'details'}>
          {/* Details Tab */}
          <TabPane tabId="details">
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Incident Number:</strong>
                  <span className="ms-2 text-primary fw-medium">{getIncidentNumber()}</span>
                </div>
                <div className="mb-3">
                  <strong>Title:</strong>
                  <span className="ms-2 text-dark">{getShortDescription()}</span>
                </div>
                <div className="mb-3">
                  <strong>Category:</strong>
                  <span className="ms-2 text-dark">{getCategoryName()}</span>
                </div>
                <div className="mb-3">
                  <strong>Sub Category:</strong>
                  <span className="ms-2 text-dark">{getSubCategoryName()}</span>
                </div>
                <div className="mb-3">
                  <strong>Reported By:</strong>
                  <span className="ms-2 text-dark">{getReportedByName()}</span>
                </div>
                <div className="mb-3">
                  <strong>Assigned to:</strong>
                  <span className="ms-2 text-dark">{getAssignedToName()}</span>
                </div>
                {(incident.assetId || incident.asset_id || incident.asset) && (
                  <div className="mb-3">
                    <strong>Asset:</strong>
                    <span className="ms-2 text-dark">{getAssetName()}</span>
                  </div>
                )}
                {(incident.siteId || incident.site_id || incident.site) && (
                  <div className="mb-3">
                    <strong>Site:</strong>
                    <span className="ms-2 text-dark">{getSiteName()}</span>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Status:</strong>
                  <Badge
                    className="ms-2"
                    style={{
                      backgroundColor: getStatusColor(incident.status || 'pending'),
                      color: 'white'
                    }}
                  >
                    {getIncidentStateName()}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Priority:</strong>
                  <Badge
                    className="ms-2"
                    style={{
                      backgroundColor: getPriorityColor(getPriorityName()),
                      color: 'white'
                    }}
                  >
                    {getPriorityName()}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Impact:</strong>
                  <span className="ms-2 text-dark">{getImpactName()}</span>
                </div>
                <div className="mb-3">
                  <strong>Urgency:</strong>
                  <span className="ms-2 text-dark">{getUrgencyName()}</span>
                </div>
                <div className="mb-3">
                  <strong>Contact Type:</strong>
                  <span className="ms-2 text-dark">{getContactTypeName()}</span>
                </div>
                <div className="mb-3">
                  <strong>Created:</strong>
                  <span className="ms-2 text-dark">{formatDate(getCreatedAt())}</span>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <hr />
                <div className="mb-3">
                  <strong>Detailed Description:</strong>
                  <p className="mt-2 p-3 bg-light rounded text-dark">
                    {getDescription()}
                  </p>
                </div>
              </Col>
              <Col md={6}>
                <hr />
                <div className="mb-3">
                  <strong>Location:</strong>
                  <p className="mt-2 p-3 bg-light rounded text-dark">
                    {getLocation()}
                  </p>
                </div>
              </Col>
            </Row>
          </TabPane>

          {/* Evidence Tab - Only for Handlers */}
          {isHandler && (
            <TabPane tabId="evidence">
              <h5 className="text-dark mb-4">Evidence & Data</h5>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                  <p className="mt-2 text-muted">Loading evidence data...</p>
                </div>
              ) : (
                <>
                  {/* Photos Section */}
                  {evidenceData.images.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-dark">Evidence Photos ({evidenceData.images.length})</h6>
                      <div className="table-responsive">
                        <Table striped>
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
                            {evidenceData.images.map((image) => (
                              <tr key={image.id}>
                                <td>
                                  <img
                                    src={image.url}
                                    alt="Evidence"
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={() => window.open(image.url, '_blank')}
                                    title="Click to view full size"
                                  />
                                </td>
                                <td>{image.name}</td>
                                <td>{image.size}</td>
                                <td><small>{image.uploadedAt}</small></td>
                                <td>
                                  <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => window.open(image.url, '_blank')}
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Ammonia Readings Section */}
                  {evidenceData.readings.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-dark">Ammonia Readings ({evidenceData.readings.length})</h6>
                      <div className="table-responsive">
                        <Table striped>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Reading</th>
                              <th>Unit</th>
                              <th>Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evidenceData.readings.map((reading) => (
                              <tr key={reading.id}>
                                <td>
                                  <Badge color={reading.type === 'downstream' ? 'info' : 'warning'}>
                                    {reading.type.charAt(0).toUpperCase() + reading.type.slice(1)}
                                  </Badge>
                                </td>
                                <td className="fw-medium">{reading.reading}</td>
                                <td>{reading.unit || 'mg/L'}</td>
                                <td>{new Date(reading.date).toLocaleDateString()}</td>
                                <td>
                                  <Badge color={parseFloat(reading.reading) > 1.5 ? 'danger' : 'success'}>
                                    {parseFloat(reading.reading) > 1.5 ? 'High' : 'Normal'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* No Evidence Message */}
                  {evidenceData.images.length === 0 && evidenceData.readings.length === 0 && (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </div>
                      <h6 className="text-muted">No Evidence Available</h6>
                      <p className="text-muted">
                        No photos or readings have been uploaded for this incident yet.
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabPane>
          )}

          {/* Actions Tab - Only for Handlers */}
          {isHandler && (
            <TabPane tabId="actions">
              <h5 className="text-dark mb-4">Actions & Tasks</h5>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                  <p className="mt-2 text-muted">Loading actions...</p>
                </div>
              ) : (
                <>
                  {evidenceData.actions.length > 0 ? (
                    <div className="table-responsive">
                      <Table striped>
                        <thead>
                          <tr>
                            <th>Action ID</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Details</th>
                            <th>Due Date</th>
                            <th>Complete</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evidenceData.actions.map((action) => (
                            <tr key={action.id}>
                              <td><small className="text-monospace">{action.id}</small></td>
                              <td>
                                <Badge color="secondary">
                                  {getActionTypeName(action.action_type_id)}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={
                                  action.action_status_id === '3' ? 'success' :
                                  action.action_status_id === '2' ? 'warning' :
                                  action.action_status_id === '5' ? 'secondary' :
                                  action.action_status_id === '4' ? 'danger' : 'info'
                                }>
                                  {getActionStatusName(action.action_status_id)}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={
                                  action.action_priority_id === '1' ? 'danger' :
                                  action.action_priority_id === '2' ? 'warning' : 'info'
                                }>
                                  {getActionPriorityName(action.action_priority_id)}
                                </Badge>
                              </td>
                              <td>
                                <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={action.detail}>
                                  {action.detail}
                                </div>
                              </td>
                              <td><small>{new Date(action.raised).toLocaleDateString()}</small></td>
                              <td>
                                <Badge color={action.complete ? 'success' : 'warning'}>
                                  {action.complete ? 'Yes' : 'No'}
                                </Badge>
                              </td>
                              <td><small>{new Date(action.created_at).toLocaleDateString()}</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="mb-3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted">
                          <path d="M9 11l3 3l8-8"/>
                          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.51 0 2.93.37 4.18 1.03"/>
                        </svg>
                      </div>
                      <h6 className="text-muted">No Actions Recorded</h6>
                      <p className="text-muted">
                        No actions have been created for this incident yet.
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabPane>
          )}
        </TabContent>
      </ModalBody>
      {/* <ModalFooter>
        {isHandler ? (
          <div className="d-flex w-100 justify-content-between align-items-center">
            <div>
              <Button color="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <Button color="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </ModalFooter> */}
    </Modal>
  );
};

export default ViewIncident;
