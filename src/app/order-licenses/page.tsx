"use client";
import React, { useState } from 'react';
import DashboardLayout from '@/Components/dashboard/DashboardLayout';
import StepIndicator from '@/Components/order-licenses/StepIndicator';
import OrderTypeSelection from '@/Components/order-licenses/OrderTypeSelection';
import LicenseSelection from '@/Components/order-licenses/LicenseSelection';
import OrderSummary from '@/Components/order-licenses/OrderSummary';
import OrderSuccess from '@/Components/order-licenses/OrderSuccess';

export interface OrderData {
  orderType: string;
  licenseType: string;
  licenseName: string;
  userType: string;
  price: number;
  userCount: number;
  notes: string;
}

const OrderLicenses = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<OrderData>({
    orderType: '',
    licenseType: '',
    licenseName: '',
    userType: '',
    price: 0,
    userCount: 1,
    notes: ''
  });

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const updateOrderData = (data: Partial<OrderData>) => {
    setOrderData(prev => ({ ...prev, ...data }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OrderTypeSelection
            onNext={handleNext}
            onUpdateData={updateOrderData}
            selectedType={orderData.orderType}
          />
        );
      case 2:
        return (
          <LicenseSelection
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={updateOrderData}
            orderData={orderData}
          />
        );
      case 3:
        return (
          <OrderSummary
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={updateOrderData}
            orderData={orderData}
          />
        );
      case 4:
        return (
          <OrderSuccess orderData={orderData} />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h3 className="mb-1">Order Licenses</h3>
        <p className="text-muted mb-0">Choose and purchase the licenses you need</p>
      </div>

      {/* Step Indicator */}
      {currentStep < 4 && <StepIndicator currentStep={currentStep} />}

      {/* Current Step Content */}
      {renderCurrentStep()}
    </DashboardLayout>
  );
};

export default OrderLicenses;
