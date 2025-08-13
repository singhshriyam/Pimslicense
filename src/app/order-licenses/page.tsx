// /src/app/order-licenses/page.tsx

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/Components/dashboard/DashboardLayout';
import StepIndicator from '@/Components/order-licenses/StepIndicator';
import OrderTypeSelection from '@/Components/order-licenses/OrderTypeSelection';
import EditionSelection from '@/Components/order-licenses/EditionSelection';
import LicenseModelSelection from '@/Components/order-licenses/LicenseModelSelection';
import LicenseSetup from '@/Components/order-licenses/LicenseSetup';
import LicenseDetails from '@/Components/order-licenses/LicenseDetails';
import ReviewConfirm from '@/Components/order-licenses/ReviewConfirm';
import Checkout from '@/Components/order-licenses/Checkout';

export interface OrderData {
  // Step 1: Order Type
  orderType: string;

  // Step 2: Edition
  edition: string;

  // Step 3: License Model
  licenseModel: string;

  // Step 4: License Setup
  billingCycle: string;
  userCount: number;
  bundleType: string;

  // Step 5: License Details
  customerName: string;
  expirationDate: string;
  notes: string;

  // Calculated fields
  price: number;
  total: number;
}

const OrderLicenses = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userCompany, setUserCompany] = useState('');
  const [orderData, setOrderData] = useState<OrderData>({
    orderType: '',
    edition: '',
    licenseModel: '',
    billingCycle: 'yearly',
    userCount: 4,
    bundleType: '',
    customerName: '',
    expirationDate: '',
    notes: '',
    price: 0,
    total: 0
  });

  // Simulate getting user company from auth context/API
  // Replace this with your actual user context or API call
  useEffect(() => {
    // This is where you'd get the actual logged-in user's company
    // For now, using a placeholder - replace with actual implementation
    const getUserCompany = async () => {
      try {
        // Example: const user = await getCurrentUser();
        // setUserCompany(user.company);

        // Placeholder for demo - replace with actual user data
        setUserCompany('Acme Corporation');

        // Auto-populate customer name with user's company
        setOrderData(prev => ({
          ...prev,
          customerName: 'Acme Corporation' // Replace with actual company name
        }));
      } catch (error) {
        console.error('Error fetching user company:', error);
        // Fallback to default
        setUserCompany('Acme Corporation');
        setOrderData(prev => ({
          ...prev,
          customerName: 'Acme Corporation'
        }));
      }
    };

    getUserCompany();
  }, []);

  const handleNext = () => {
    console.log('handleNext called, current step:', currentStep);
    setCurrentStep(prev => {
      console.log('Moving from step', prev, 'to step', prev + 1);
      return prev + 1;
    });
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const updateOrderData = (data: Partial<OrderData>) => {
    setOrderData(prev => ({ ...prev, ...data }));
  };

  const handleCreateLicense = async () => {
    try {
      // Here you would typically submit the order to your API
      // const response = await createLicense(orderData);

      // For now, simulate successful creation
      console.log('Creating license with data:', orderData);

      // Redirect to My Licenses page
      router.push('/my-licenses');

    } catch (error) {
      console.error('Error creating license:', error);
      // Handle error (show toast, alert, etc.)
      alert('Error creating license. Please try again.');
    }
  };

  // Updated 7-step flow for ALL order types
  const renderCurrentStep = () => {
    console.log('Rendering step:', currentStep);

    switch (currentStep) {
      case 1:
        // Step 1: Order Type Selection
        return (
          <OrderTypeSelection
            onNext={handleNext}
            onUpdateData={updateOrderData}
            selectedType={orderData.orderType}
          />
        );

      case 2:
        // Step 2: Edition Selection
        return (
          <EditionSelection
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={updateOrderData}
            selectedEdition={orderData.edition}
            orderType={orderData.orderType}
          />
        );

      case 3:
        // Step 3: License Model Selection
        return (
          <LicenseModelSelection
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={updateOrderData}
            selectedModel={orderData.licenseModel}
            orderType={orderData.orderType}
            edition={orderData.edition}
          />
        );

      case 4:
        // Step 4: License Setup
        return (
          <LicenseSetup
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={updateOrderData}
            orderData={orderData}
          />
        );

      case 5:
        // Step 5: License Details
        return (
          <LicenseDetails
            onNext={handleNext}
            onBack={handleBack}
            onUpdateData={updateOrderData}
            orderData={orderData}
          />
        );

      case 6:
        // Step 6: Review & Confirm
        console.log('Rendering Review & Confirm step');
        return (
          <ReviewConfirm
            onNext={handleNext}
            onBack={handleBack}
            orderData={orderData}
          />
        );

      case 7:
        // Step 7: Checkout
        console.log('Rendering Checkout step');
        return (
          <Checkout
            onNext={handleCreateLicense}
            onBack={handleBack}
            orderData={orderData}
          />
        );

      default:
        console.log('Default case hit for step:', currentStep);
        return <div>Step {currentStep} not found</div>;
    }
  };

  // Updated step titles for 7-step flow
  const stepTitles = [
    'Order Type',
    'Edition',
    'Model',
    'Setup',
    'Details',
    'Review',
    'Checkout'
  ];

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h3 className="mb-1">Order Licenses</h3>
        <p className="text-muted mb-0">Choose and purchase the licenses you need</p>
      </div>

      {/* Step Indicator - 7 steps total */}
      {currentStep <= 7 && (
        <StepIndicator
          currentStep={currentStep}
          totalSteps={7}
          stepTitles={stepTitles}
        />
      )}

      {/* Current Step Content */}
      {renderCurrentStep()}
    </DashboardLayout>
  );
};

export default OrderLicenses;
