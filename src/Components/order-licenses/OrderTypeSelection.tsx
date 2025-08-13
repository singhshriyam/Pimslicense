// /src/Components/order-licenses/OrderTypeSelection.tsx

"use client";
import React, { useState } from 'react';

interface OrderTypeSelectionProps {
  onNext: () => void;
  onUpdateData: (data: any) => void;
  selectedType: string;
}

const OrderTypeSelection = ({ onNext, onUpdateData, selectedType }: OrderTypeSelectionProps) => {
  const [selected, setSelected] = useState(selectedType);

  const orderTypes = [
    {
      id: 'new-license',
      title: 'New License',
      description: 'Purchase a new software license',
      icon: '🛡️',
      color: '#4285f4'
    },
    {
      id: 'additional-license',
      title: 'Additional License',
      description: 'Add more users to existing license',
      icon: '👥',
      color: '#34a853'
    },
    {
      id: 'break-fix-support',
      title: 'Break-Fix Support',
      description: 'On-demand technical support',
      icon: '🎧',
      color: '#ff9800'
    },
    {
      id: 'demo-license',
      title: 'Demo License',
      description: 'Free trial license for evaluation',
      icon: '🧪',
      color: '#34a853'
    },
    {
      id: 'renewal-support',
      title: 'Renewal Support',
      description: 'Renew existing support plan',
      icon: '💳',
      color: '#9c27b0'
    }
  ];

  const handleSelect = (typeId: string) => {
    setSelected(typeId);
    onUpdateData({ orderType: typeId });
  };

  const handleContinue = () => {
    if (selected) {
      onNext();
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="text-center mb-5">
        <h4 className="fw-bold mb-2">Select Order Type</h4>
      </div>

      {/* Order Type Cards */}
      <div className="d-flex justify-content-between flex-wrap gap-4 mb-5">
        {orderTypes.map((type) => (
          <div
            key={type.id}
            style={{ flex: '1 1 18%', minWidth: '180px', minHeight: '200px', cursor: 'pointer' }}
            className={`card h-100 d-flex flex-column ${selected === type.id ? 'border-primary shadow' : 'border-light'}`}
            onClick={() => handleSelect(type.id)}
          >
            <div className="card-body d-flex flex-column align-items-center text-center p-4">
              {/* Icon */}
              <div
                className="rounded d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: selected === type.id ? type.color : '#f8f9fa'
                }}
              >
                <span
                  style={{
                    fontSize: '28px',
                    filter: selected === type.id ? 'brightness(0) invert(1)' : 'none'
                  }}
                >
                  {type.icon}
                </span>
              </div>

              {/* Title */}
              <h5 className={`fw-bold mb-2 ${selected === type.id ? 'text-primary' : 'text-dark'}`}>
                {type.title}
              </h5>

              {/* Description */}
              <p className="text-muted mb-0 small flex-grow-1">
                {type.description}
              </p>

              {/* Selection Indicator */}
              {selected === type.id && (
                <div className="mt-3">
                  <i className="fas fa-check-circle text-primary fs-5"></i>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          className="btn btn-primary btn-lg px-5"
          onClick={handleContinue}
          disabled={!selected}
        >
          Continue to Edition Selection
          <i className="fas fa-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

export default OrderTypeSelection;
