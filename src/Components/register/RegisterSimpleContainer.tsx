"use client";
import { CreateAccount, EmailAddress, Password, SignIn } from "@/Constant";
import Link from "next/link";
import emailjs from '@emailjs/browser';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Container, Row, Col, Card, CardBody } from "reactstrap";

interface RegisterFormData {
  company_name: string;
  company_address: string;
  company_postcode: string;
  contact_name: string;
  contact_last_name: string;
  contact_phone: string;
  contact_designation: string;
  contact_email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

const RegisterSimpleContainer = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [registrationStatus, setRegistrationStatus] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<RegisterFormData>({
    company_name: "",
    company_address: "",
    company_postcode: "",
    contact_name: "",
    contact_last_name: "",
    contact_phone: "",
    contact_designation: "",
    contact_email: "",
    otp: "",
    password: "",
    password_confirmation: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [captcha, setCaptcha] = useState<{ question: string; answer: number }>({ question: "", answer: 0 });
  const [captchaInput, setCaptchaInput] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [addressLoading, setAddressLoading] = useState(false);
  const router = useRouter();

  const steps = [
    { id: 1, title: "Company Details", completed: currentStep > 1 },
    { id: 2, title: "Primary Contact", completed: currentStep > 2 },
    { id: 3, title: "Confirmation", completed: false },
  ];

  const handleStartOver = () => {
    setRegistrationStatus('form');
    setCurrentStep(1);
    setFormData({
      company_name: "",
      company_address: "",
      company_postcode: "",
      contact_name: "",
      contact_last_name: "",
      contact_phone: "",
      contact_designation: "",
      contact_email: "",
      otp: "",
      password: "",
      password_confirmation: ""
    });
    setOtpSent(false);
    setCaptchaInput("");
    setErrors({});
    setLoading(false);
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const autoPopulateAddress = async (postcode: string) => {
    if (!postcode || postcode.length < 5) return;
    setAddressLoading(true);
    try {
      const cleanPostcode = postcode.toUpperCase().replace(/\s+/g, '');
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.result) {
          const areaAddress = `${data.result.admin_ward}, ${data.result.admin_district}, ${data.result.admin_county}`;
          setFormData(prev => ({ ...prev, company_address: prev.company_address || areaAddress }));
        }
      }
    } catch (error) {
      // Silently fail
    } finally {
      setAddressLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    handleInputChange('password', value);
    const passwordError = validatePassword(value);
    if (passwordError) {
      setErrors(prev => ({ ...prev, password: passwordError }));
    } else {
      setErrors(prev => {
        const { password, ...rest } = prev;
        return rest;
      });
    }
    if (formData.password_confirmation && value !== formData.password_confirmation) {
      setErrors(prev => ({ ...prev, password_confirmation: "Passwords do not match" }));
    } else if (formData.password_confirmation) {
      setErrors(prev => {
        const { password_confirmation, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePasswordConfirmationChange = (value: string) => {
    handleInputChange('password_confirmation', value);
    if (value && value !== formData.password) {
      setErrors(prev => ({ ...prev, password_confirmation: "Passwords do not match" }));
    } else {
      setErrors(prev => {
        const { password_confirmation, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePostcodeChange = (value: string) => {
    handleInputChange('company_postcode', value);
    if (typeof window !== 'undefined') {
      clearTimeout((window as any).postcodeTimeout);
      (window as any).postcodeTimeout = setTimeout(() => {
        if (value.trim().length >= 5) {
          autoPopulateAddress(value);
        }
      }, 500);
    }
  };

  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) return "Password must contain letters and numbers";
    return "";
  };

  const validateField = (field: keyof RegisterFormData, value: string): string => {
    switch (field) {
      case 'company_name':
        if (!value.trim()) return "Company name is required";
        if (value.trim().length < 2) return "Company name must be at least 2 characters";
        return "";
      case 'company_address':
        if (!value.trim()) return "Company address is required";
        if (value.trim().length < 10) return "Please enter complete address";
        return "";
      case 'company_postcode':
        if (!value.trim()) return "Postcode is required";
        if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(value.trim())) return "Invalid UK postcode";
        return "";
      case 'contact_name':
      case 'contact_last_name':
        if (!value.trim()) return `${field === 'contact_name' ? 'First' : 'Last'} name is required`;
        if (value.trim().length < 2) return "Must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Only letters allowed";
        return "";
      case 'contact_designation':
        if (!value.trim()) return "Designation is required";
        if (value.trim().length < 2) return "Must be at least 2 characters";
        return "";
      case 'contact_email':
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Invalid email format";
        return "";
      case 'contact_phone':
        if (!value.trim()) return "Phone number is required";
        if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(value.trim())) return "Invalid phone number";
        return "";
      case 'password':
        return validatePassword(value);
      case 'password_confirmation':
        if (!value) return "Please confirm password";
        if (value !== formData.password) return "Passwords do not match";
        return "";
      case 'otp':
        if (!value.trim()) return "OTP is required";
        if (!/^\d{6}$/.test(value.trim())) return "OTP must be 6 digits";
        return "";
      default:
        return "";
    }
  };

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let answer: number;
    let question: string;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
    }
    setCaptcha({ question, answer });
  };

  const sendOtp = async () => {
    if (!formData.contact_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      setErrors(prev => ({ ...prev, contact_email: "Please enter a valid email address" }));
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setLoading(true);

    try {
      // EmailJS configuration
      const templateParams = {
        to_email: formData.contact_email,
        otp: otp,
        company_name: formData.company_name || 'Your Company'
      };

      // Send email using EmailJS
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      // Store OTP in session storage
      sessionStorage.setItem('registration_otp', otp);
      sessionStorage.setItem('otp_timestamp', Date.now().toString());
      sessionStorage.setItem('otp_email', formData.contact_email.toLowerCase().trim());

      setOtpSent(true);
      setLoading(false);

      // Show OTP in notification for development/testing
      toast.success(`OTP sent to ${formData.contact_email} (Code: ${otp})`);

      setErrors(prev => {
        const { contact_email, ...rest } = prev;
        return rest;
      });

    } catch (error) {
      console.error('Failed to send OTP:', error);
      setLoading(false);
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    switch (step) {
      case 1:
        ['company_name', 'company_postcode', 'company_address'].forEach(field => {
          const error = validateField(field as keyof RegisterFormData, formData[field as keyof RegisterFormData]);
          if (error) newErrors[field] = error;
        });
        break;
      case 2:
        ['contact_name', 'contact_last_name', 'contact_designation', 'contact_email', 'contact_phone'].forEach(field => {
          const error = validateField(field as keyof RegisterFormData, formData[field as keyof RegisterFormData]);
          if (error) newErrors[field] = error;
        });
        if (!otpSent) {
          newErrors.otp = "Please send OTP first";
        } else {
          const otpError = validateField('otp', formData.otp);
          if (otpError) {
            newErrors.otp = otpError;
          } else {
            const storedOtp = sessionStorage.getItem('registration_otp');
            const otpTimestamp = sessionStorage.getItem('otp_timestamp');
            const otpEmail = sessionStorage.getItem('otp_email');
            if (!storedOtp || formData.otp !== storedOtp) {
              newErrors.otp = "Invalid OTP";
            } else if (otpEmail !== formData.contact_email.toLowerCase().trim()) {
              newErrors.otp = "OTP sent to different email";
            } else if (otpTimestamp && Date.now() - parseInt(otpTimestamp) > 10 * 60 * 1000) {
              newErrors.otp = "OTP expired. Request new one.";
              sessionStorage.removeItem('registration_otp');
              sessionStorage.removeItem('otp_timestamp');
              sessionStorage.removeItem('otp_email');
              setOtpSent(false);
            }
          }
        }
        break;
      case 3:
        ['password', 'password_confirmation'].forEach(field => {
          const error = validateField(field as keyof RegisterFormData, formData[field as keyof RegisterFormData]);
          if (error) newErrors[field] = error;
        });
        if (!captchaInput.trim()) {
          newErrors.captcha = "Please solve the captcha";
        } else if (parseInt(captchaInput) !== captcha.answer) {
          newErrors.captcha = "Incorrect answer";
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 2) generateCaptcha();
    }
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const refreshCaptcha = () => {
    generateCaptcha();
    setCaptchaInput("");
    setErrors(prev => ({ ...prev, captcha: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(3)) return;
    setLoading(true);
    setTimeout(() => {
      ['registration_otp', 'otp_timestamp', 'otp_email'].forEach(key =>
        sessionStorage.removeItem(key)
      );
      setRegistrationStatus('success');
      setLoading(false);
      toast.success("Account created successfully!");
    }, 2000);
  };

  useEffect(() => {
    if (currentStep === 3 && captcha.question === "") {
      generateCaptcha();
    }
  }, [currentStep, captcha.question]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if ((window as any).postcodeTimeout) {
          clearTimeout((window as any).postcodeTimeout);
        }
      }
    };
  }, []);

  if (registrationStatus === 'success') {
    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="login-card login-dark">
              <div className="text-center mb-4">
                <div className="mb-4">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2" className="mb-3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                  <h3 className="text-success mb-3">Registration Successful!</h3>
                  <p className="text-dark mb-4">Welcome aboard! Your company account has been created successfully.</p>
                </div>
                <Card className="bg-light mb-4">
                  <CardBody>
                    <h6 className="text-dark mb-3">Company Details:</h6>
                    <div className="text-start">
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Company:</strong></div>
                        <div className="col-8 text-dark">{formData.company_name}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Address:</strong></div>
                        <div className="col-8 text-dark">{formData.company_address}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Postcode:</strong></div>
                        <div className="col-8 text-dark">{formData.company_postcode}</div>
                      </div>
                      <hr />
                      <h6 className="text-dark mb-2">Primary Contact:</h6>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Name:</strong></div>
                        <div className="col-8 text-dark">{formData.contact_name} {formData.contact_last_name}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Designation:</strong></div>
                        <div className="col-8 text-dark">{formData.contact_designation}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Email:</strong></div>
                        <div className="col-8 text-dark">{formData.contact_email}</div>
                      </div>
                      <div className="row">
                        <div className="col-4"><strong className="text-dark">Phone:</strong></div>
                        <div className="col-8 text-dark">{formData.contact_phone}</div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <div className="d-grid gap-2">
                  <Button color="success" size="lg" onClick={() => router.push('/auth/login')} className="mb-2">
                    Sign In to Your Account
                  </Button>
                  <Button color="outline-secondary" size="sm" onClick={handleStartOver}>
                    Register Another Company
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="login-card login-dark">
            <div>
              <div>
                <Link className="logo" href="/">
                  <h3 className="text-center mb-4 text-dark">{CreateAccount}</h3>
                </Link>
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center px-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="d-flex align-items-center">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          step.id === currentStep
                            ? "bg-primary text-white"
                            : step.completed
                            ? "bg-success text-white"
                            : "bg-light text-dark"
                        }`}
                        style={{ width: '35px', height: '35px', fontSize: '14px' }}
                      >
                        {step.completed ? "✓" : step.id}
                      </div>
                      <span className="ms-2 small text-dark d-none d-md-inline">
                        {step.title}
                      </span>
                      {index < steps.length - 1 && (
                        <div className="flex-fill mx-3" style={{ height: '2px', backgroundColor: '#dee2e6' }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="login-main">
                <Form className="theme-form" onSubmit={handleSubmit}>
                  {currentStep === 1 && (
                    <div>
                      <h4 className="text-dark">Company Details</h4>
                      <p className="text-muted">Enter your company information</p>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Company Name *</Label>
                        <Input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          placeholder="Enter your company name"
                          invalid={!!errors.company_name}
                          autoComplete="organization"
                        />
                        {errors.company_name && <div className="invalid-feedback d-block">{errors.company_name}</div>}
                      </FormGroup>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Company Post Code *</Label>
                        <Input
                          type="text"
                          value={formData.company_postcode}
                          onChange={(e) => handlePostcodeChange(e.target.value)}
                          placeholder="Enter company post code (e.g., SW1A 1AA)"
                          invalid={!!errors.company_postcode}
                          maxLength={8}
                          autoComplete="postal-code"
                        />
                        {errors.company_postcode && <div className="invalid-feedback d-block">{errors.company_postcode}</div>}
                        {addressLoading && <small className="text-info">Looking up area information...</small>}
                      </FormGroup>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Company Address *</Label>
                        <Input
                          type="textarea"
                          rows={3}
                          value={formData.company_address}
                          onChange={(e) => handleInputChange('company_address', e.target.value)}
                          placeholder="Enter your company's full address"
                          invalid={!!errors.company_address}
                          autoComplete="street-address"
                        />
                        {errors.company_address && <div className="invalid-feedback d-block">{errors.company_address}</div>}
                        <small className="text-muted">
                          Please include building number/name, street name, and area. Additional area info will auto-populate from postcode.
                        </small>
                      </FormGroup>
                      <div className="form-group mb-0">
                        <div className="text-end mt-3">
                          <Button type="button" color="primary" onClick={handleNext} block>
                            Continue to Primary Contact
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div>
                      <h4 className="text-dark">Primary Contact</h4>
                      <p className="text-muted">Enter primary contact person details and verify email</p>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label className="col-form-label text-dark">First Name *</Label>
                            <Input
                              type="text"
                              value={formData.contact_name}
                              onChange={(e) => handleInputChange('contact_name', e.target.value)}
                              placeholder="Enter first name"
                              invalid={!!errors.contact_name}
                              autoComplete="given-name"
                            />
                            {errors.contact_name && <div className="invalid-feedback d-block">{errors.contact_name}</div>}
                          </FormGroup>
                        </Col>
                        <Col md={6}>
                          <FormGroup>
                            <Label className="col-form-label text-dark">Last Name *</Label>
                            <Input
                              type="text"
                              value={formData.contact_last_name}
                              onChange={(e) => handleInputChange('contact_last_name', e.target.value)}
                              placeholder="Enter last name"
                              invalid={!!errors.contact_last_name}
                              autoComplete="family-name"
                            />
                            {errors.contact_last_name && <div className="invalid-feedback d-block">{errors.contact_last_name}</div>}
                          </FormGroup>
                        </Col>
                      </Row>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Designation *</Label>
                        <Input
                          type="text"
                          value={formData.contact_designation}
                          onChange={(e) => handleInputChange('contact_designation', e.target.value)}
                          placeholder="Enter job title/designation (e.g., Managing Director, CEO)"
                          invalid={!!errors.contact_designation}
                          autoComplete="organization-title"
                        />
                        {errors.contact_designation && <div className="invalid-feedback d-block">{errors.contact_designation}</div>}
                      </FormGroup>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Phone Number *</Label>
                        <Input
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                          placeholder="Enter phone number"
                          invalid={!!errors.contact_phone}
                          autoComplete="tel"
                        />
                        {errors.contact_phone && <div className="invalid-feedback d-block">{errors.contact_phone}</div>}
                      </FormGroup>
                      <FormGroup>
                        <Label className="col-form-label text-dark">{EmailAddress} *</Label>
                        <div className="d-flex">
                          <div className="position-relative flex-grow-1 me-2">
                            <Input
                              type="email"
                              value={formData.contact_email}
                              onChange={(e) => handleInputChange('contact_email', e.target.value)}
                              placeholder="Enter email address"
                              invalid={!!errors.contact_email}
                              autoComplete="email"
                            />
                          </div>
                          <Button
                            type="button"
                            color="success"
                            onClick={sendOtp}
                            disabled={!formData.contact_email.trim() || loading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email) || !!errors.contact_email}
                            style={{ minWidth: '100px' }}
                          >
                            {loading ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                          </Button>
                        </div>
                        {errors.contact_email && <div className="invalid-feedback d-block">{errors.contact_email}</div>}
                      </FormGroup>
                      {otpSent && (
                        <FormGroup>
                          <Label className="col-form-label text-dark">Enter OTP *</Label>
                          <Input
                            type="text"
                            value={formData.otp}
                            onChange={(e) => handleInputChange('otp', e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            invalid={!!errors.otp}
                          />
                          {errors.otp && <div className="invalid-feedback d-block">{errors.otp}</div>}
                          <small className="text-muted">OTP sent to {formData.contact_email} (valid for 10 minutes)</small>
                        </FormGroup>
                      )}
                      <div className="d-flex gap-2 mt-3">
                        <Button type="button" color="secondary" onClick={handleBack} className="flex-fill">Back</Button>
                        <Button type="button" color="primary" onClick={handleNext} className="flex-fill">Continue</Button>
                      </div>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div>
                      <h4 className="text-dark">Captcha & Confirmation</h4>
                      <p className="text-muted">Complete security check, set password and review information</p>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Security Check *</Label>
                        <div className="d-flex align-items-center">
                          <div className="d-flex align-items-center me-3">
                            <span className="bg-light p-2 rounded me-2 fw-bold text-dark border">
                              {captcha.question} = ?
                            </span>
                            <Button type="button" color="link" size="sm" onClick={refreshCaptcha} className="text-primary">
                              🔄
                            </Button>
                          </div>
                          <Input
                            type="number"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            placeholder="Answer"
                            invalid={!!errors.captcha}
                            style={{ width: '100px' }}
                          />
                        </div>
                        {errors.captcha && <div className="invalid-feedback d-block">{errors.captcha}</div>}
                      </FormGroup>
                      <FormGroup>
                        <Label className="col-form-label text-dark">{Password} *</Label>
                        <div className="form-input position-relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            placeholder="Enter your password"
                            invalid={!!errors.password}
                            autoComplete="new-password"
                          />
                          <div className="show-hide" onClick={() => setShowPassword(!showPassword)}>
                            <span className="show" />
                          </div>
                        </div>
                        {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                        <small className="text-muted">
                          Password must be at least 6 characters with letters and numbers
                        </small>
                      </FormGroup>
                      <FormGroup>
                        <Label className="col-form-label text-dark">Confirm Password *</Label>
                        <div className="form-input position-relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.password_confirmation}
                            onChange={(e) => handlePasswordConfirmationChange(e.target.value)}
                            placeholder="Confirm your password"
                            invalid={!!errors.password_confirmation}
                            autoComplete="new-password"
                          />
                          <div className="show-hide" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <span className="show" />
                          </div>
                        </div>
                        {errors.password_confirmation && <div className="invalid-feedback d-block">{errors.password_confirmation}</div>}
                      </FormGroup>
                      <div className="bg-light p-3 rounded mb-3">
                        <h6 className="mb-3 text-dark">Review Your Information:</h6>
                        <div className="mb-3">
                          <strong className="text-dark">Company Details:</strong>
                          <div className="row mb-1 mt-2">
                            <div className="col-4 text-muted">Name:</div>
                            <div className="col-8 text-dark">{formData.company_name}</div>
                          </div>
                          <div className="row mb-1">
                            <div className="col-4 text-muted">Postcode:</div>
                            <div className="col-8 text-dark">{formData.company_postcode}</div>
                          </div>
                          <div className="row mb-1">
                            <div className="col-4 text-muted">Address:</div>
                            <div className="col-8 text-dark">{formData.company_address}</div>
                          </div>
                        </div>
                        <div>
                          <strong className="text-dark">Primary Contact:</strong>
                          <div className="row mb-1 mt-2">
                            <div className="col-4 text-muted">Name:</div>
                            <div className="col-8 text-dark">{formData.contact_name} {formData.contact_last_name}</div>
                          </div>
                          <div className="row mb-1">
                            <div className="col-4 text-muted">Designation:</div>
                            <div className="col-8 text-dark">{formData.contact_designation}</div>
                          </div>
                          <div className="row mb-1">
                            <div className="col-4 text-muted">Email:</div>
                            <div className="col-8 text-dark">{formData.contact_email} ✓</div>
                          </div>
                          <div className="row">
                            <div className="col-4 text-muted">Phone:</div>
                            <div className="col-8 text-dark">{formData.contact_phone}</div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <Button type="button" color="secondary" onClick={handleBack} className="flex-fill">Back</Button>
                        <Button type="submit" color="success" disabled={loading} className="flex-fill">
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Creating Account...
                            </>
                          ) : (
                            "Complete Registration"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="mt-4 mb-0 text-center">
                    <span className="text-dark">Already have an account?</span>
                    <Link className="ms-2" href="/auth/login">
                      {SignIn}
                    </Link>
                  </p>
                </Form>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterSimpleContainer;
