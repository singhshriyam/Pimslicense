'use client'
import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge } from 'reactstrap'
import {
  getStatusColor,
  getPriorityColor,
  formatDate,
  type Incident
} from '../app/(MainBody)/services/incidentService';

interface ViewIncidentProps {
  incident: Incident;
  onClose: () => void;
  userType?: string;
}

const ViewIncident: React.FC<ViewIncidentProps> = ({ incident, onClose, userType }) => {

  // Check if user has elevated permissions to see additional details
  const hasElevatedPermissions = () => {
    const currentUserType = userType?.toLowerCase() || '';
    return currentUserType.includes('handler') ||
           currentUserType.includes('manager') ||
           currentUserType.includes('admin') ||
           currentUserType.includes('field_engineer') ||
           currentUserType.includes('water_pollution_expert');
  };

  const isHandler = hasElevatedPermissions();

  return (
    <Modal isOpen={true} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        Incident Details - {incident.number}
      </ModalHeader>
      <ModalBody>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Incident Number:</strong>
              <span className="ms-2 text-primary fw-medium">{incident.number}</span>
            </div>
            <div className="mb-3">
              <strong>Title:</strong>
              <span className="ms-2 text-dark">{incident.shortDescription}</span>
            </div>
            <div className="mb-3">
              <strong>Category:</strong>
              <span className="ms-2 text-dark">{incident.category}</span>
            </div>
            <div className="mb-3">
              <strong>Sub Category:</strong>
              <span className="ms-2 text-dark">{incident.subCategory}</span>
            </div>
            <div className="mb-3">
              <strong>Caller:</strong>
              <span className="ms-2 text-dark">{incident.caller}</span>
            </div>
            <div className="mb-3">
              <strong>Contact Type:</strong>
              <span className="ms-2 text-dark">{incident.contactType}</span>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong>Priority:</strong>
              <Badge
                className="ms-2"
                style={{
                  backgroundColor: getPriorityColor(incident.priority),
                  color: 'white'
                }}
              >
                {incident.priority}
              </Badge>
            </div>
            <div className="mb-3">
              <strong>Status:</strong>
              <Badge
                className="ms-2"
                style={{
                  backgroundColor: getStatusColor(incident.status),
                  color: 'white'
                }}
              >
                {incident.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mb-3">
              <strong>Impact:</strong>
              <span className="ms-2 text-dark">{incident.impact || 'Not specified'}</span>
            </div>
            <div className="mb-3">
              <strong>Urgency:</strong>
              <span className="ms-2 text-dark">{incident.urgency || 'Not specified'}</span>
            </div>
            <div className="mb-3">
              <strong>Reported By:</strong>
              <span className="ms-2 text-dark">{incident.reportedByName || incident.caller}</span>
            </div>
            <div className="mb-3">
              <strong>Created:</strong>
              <span className="ms-2 text-dark">{formatDate(incident.createdAt)}</span>
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <hr />
            <div className="mb-3">
              <strong>Detailed Description:</strong>
              <p className="mt-2 p-3 bg-light rounded text-dark">
                {incident.description || incident.shortDescription}
              </p>
            </div>

            {/* Location Information */}
            {(incident.address || incident.postcode || (incident.latitude && incident.longitude)) && (
              <div className="mb-3">
                <strong>Location:</strong>
                <div className="mt-1 p-2 bg-light rounded text-dark">
                  {incident.address && (
                    <div className="text-dark">{incident.address}</div>
                  )}
                  {incident.postcode && (
                    <div className="text-dark">
                      <strong>Postcode:</strong> {incident.postcode}
                    </div>
                  )}
                  {(incident.latitude && incident.longitude) && (
                    <div className="text-dark">
                      <strong>GPS Coordinates:</strong> {incident.latitude.substring(0,8)}, {incident.longitude.substring(0,8)}
                      <span className="text-success ms-2">📍 Precise Location</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignment Information - Only for handlers/managers */}
            {isHandler && (
              <>
                <hr />
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Assigned To:</strong>
                      <div className="ms-2 text-dark">
                        {incident.assignedTo || 'Unassigned'}
                        {incident.assignedToEmail && (
                          <div className="text-muted small">{incident.assignedToEmail}</div>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Last Updated:</strong>
                      <div className="ms-2 text-dark">
                        {incident.updatedAt ? formatDate(incident.updatedAt) : 'Not updated'}
                      </div>
                    </div>
                  </Col>
                </Row>
              </>
            )}

            {/* Contact Information */}
            <hr />
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Reported By:</strong>
                  <div className="ms-2 text-dark">
                    {incident.reportedByName || incident.caller}
                    {incident.reportedBy && (
                      <div className="text-muted small">{incident.reportedBy}</div>
                    )}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Contact Method:</strong>
                  <div className="ms-2 text-dark">{incident.contactType}</div>
                </div>
              </Col>
            </Row>

            {/* Additional Handler Information */}
            {isHandler && (
              <>
                <hr />
                <div className="mb-3">
                  <h6 className="text-dark">Handler Notes</h6>
                  <div className="p-3 bg-light rounded">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Incident ID:</strong> {incident.id}
                      </div>
                      <div className="col-md-6">
                        <strong>Internal Reference:</strong> {incident.number}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-md-6">
                        <strong>Priority Level:</strong> {incident.priority}
                      </div>
                      <div className="col-md-6">
                        <strong>Impact Level:</strong> {incident.impact}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-md-6">
                        <strong>Urgency Level:</strong> {incident.urgency}
                      </div>
                      <div className="col-md-6">
                        <strong>Current Status:</strong> {incident.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Col>
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ViewIncident;
