"use client";
import React, { useState, useEffect } from 'react';

interface OrderSummaryProps {
  onNext: () => void;
  onBack: () => void;
  onUpdateData: (data: any) => void;
  orderData: any;
}

const OrderSummary = ({ onNext, onBack, onUpdateData, orderData }: OrderSummaryProps) => {
  const [userCount, setUserCount] = useState(orderData.userCount || 1);
  const [notes, setNotes] = useState(orderData.notes || '');
  const [loading, setLoading] = useState(false);

  // Update total when user count changes
  // useEffect(() => {
  //   onUpdateData({ userCount, notes });
  // }, [userCount, notes, onUpdateData]);

  const handleUserCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 1;
    setUserCount(Math.max(1, count)); // Minimum 1 user
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const calculateTotal = () => {
    return orderData.price * userCount;
  };

  const handleCompletePayment = async () => {
    setLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      onNext(); // Go to success page
    }, 2000);
  };

  const formatUserType = (type: string) => {
    return type === 'named' ? 'named user' : 'concurrent user';
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {/* Title */}
        <div className="text-center mb-5">
          <h4 className="fw-bold mb-2">Complete Your Order</h4>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-5">
            {/* Order Summary Section */}
            <div className="mb-5">
              <h5 className="fw-bold mb-4">Order Summary</h5>

              <div className="row mb-3">
                <div className="col-4">
                  <span className="text-muted">Product:</span>
                </div>
                <div className="col-8 text-end">
                  <span className="fw-medium">{orderData.licenseName}</span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-4">
                  <span className="text-muted">License Type:</span>
                </div>
                <div className="col-8 text-end">
                  <span className="fw-medium">{formatUserType(orderData.userType)}</span>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-4">
                  <span className="text-muted">Unit Price:</span>
                </div>
                <div className="col-8 text-end">
                  <span className="fw-medium">${orderData.price}</span>
                </div>
              </div>
            </div>

            {/* Number of Users */}
            <div className="mb-5">
              <label className="form-label fw-bold mb-3">Number of Users</label>
              <input
                type="number"
                className="form-control form-control-lg"
                value={userCount}
                onChange={handleUserCountChange}
                min="1"
                style={{ maxWidth: '200px' }}
              />
            </div>

            {/* Additional Notes */}
            <div className="mb-5">
              <label className="form-label fw-bold mb-3">Additional Notes (Optional)</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Any special requirements or notes..."
                value={notes}
                onChange={handleNotesChange}
              />
            </div>

            {/* Total Amount */}
            <div className="border-top pt-4 mb-5">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="fw-bold mb-0">Total Amount:</h4>
                <h3 className="fw-bold text-primary mb-0">${calculateTotal()}</h3>
              </div>
            </div>

            {/* Complete Payment Button */}
            <div className="d-grid">
              <button
                className="btn btn-primary btn-lg py-3"
                onClick={handleCompletePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing Payment...
                  </>
                ) : (
                  'Complete Payment'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="d-flex justify-content-between mt-4">
          <button
            className="btn btn-outline-secondary btn-lg px-4"
            onClick={onBack}
            disabled={loading}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </button>

          <div></div> {/* Spacer for flex layout */}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
