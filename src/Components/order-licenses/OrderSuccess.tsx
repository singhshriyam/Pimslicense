"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

interface OrderSuccessProps {
  orderData: any;
}

const OrderSuccess = ({ orderData }: OrderSuccessProps) => {
  const router = useRouter();

  const calculateTotal = () => {
    return orderData.price * orderData.userCount;
  };

  const formatUserType = (type: string) => {
    return type === 'named' ? 'named user' : 'concurrent user';
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  const handleViewMyLicenses = () => {
    router.push('/my-licenses');
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#e8f5e8'
              }}
            >
              <i className="fas fa-check text-success" style={{ fontSize: '40px' }}></i>
            </div>
          </div>

          {/* Success Title */}
          <h2 className="fw-bold mb-3">Order Successful!</h2>

          {/* Success Message */}
          <p className="text-muted mb-5">
            Your {orderData.licenseName} has been successfully ordered and activated.
          </p>

          {/* Order Details Card */}
          <div className="card border-0 shadow-sm mb-5">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4 text-start">Order Details</h6>

              <div className="row mb-3 text-start">
                <div className="col-6">
                  <span className="text-muted">Product:</span>
                </div>
                <div className="col-6">
                  <span className="fw-medium">{orderData.licenseName}</span>
                </div>
              </div>

              <div className="row mb-3 text-start">
                <div className="col-6">
                  <span className="text-muted">License Type:</span>
                </div>
                <div className="col-6">
                  <span className="fw-medium">{formatUserType(orderData.userType)}</span>
                </div>
              </div>

              <div className="row mb-3 text-start">
                <div className="col-6">
                  <span className="text-muted">Number of Users:</span>
                </div>
                <div className="col-6">
                  <span className="fw-medium">{orderData.userCount}</span>
                </div>
              </div>

              <div className="row mb-3 text-start">
                <div className="col-6">
                  <span className="text-muted">Unit Price:</span>
                </div>
                <div className="col-6">
                  <span className="fw-medium">${orderData.price}</span>
                </div>
              </div>

              {orderData.notes && (
                <div className="row mb-3 text-start">
                  <div className="col-6">
                    <span className="text-muted">Notes:</span>
                  </div>
                  <div className="col-6">
                    <span className="fw-medium">{orderData.notes}</span>
                  </div>
                </div>
              )}

              <hr className="my-3" />

              <div className="row text-start">
                <div className="col-6">
                  <span className="fw-bold">Order Total:</span>
                </div>
                <div className="col-6">
                  <span className="fw-bold text-primary fs-5">${calculateTotal()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-grid gap-3">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleReturnToDashboard}
            >
              Return to Dashboard
            </button>

            <button
              className="btn btn-outline-secondary btn-lg"
              onClick={handleViewMyLicenses}
            >
              View My Licenses
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-5 p-4 bg-light rounded">
            <h6 className="fw-bold mb-2">What's Next?</h6>
            <p className="text-muted small mb-0">
              Your license has been activated and is ready to use. You can manage all your licenses
              from the "My Licenses" section, and download installation files from your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
