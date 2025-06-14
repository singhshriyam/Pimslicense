"use client";
import { CreateAccount, EmailAddress, Password, SignIn } from "@/Constant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Container, Row, Col, Card, CardBody } from "reactstrap";

interface RegisterFormData {
  email: string;
  password: string;
  password_confirmation: string;
  address: string;
  postcode: string;
  mobile: string;
  name: string;
  last_name: string;
  otp: string;
}

const RegisterSimpleContainer = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [registrationStatus, setRegistrationStatus] = useState<'form' | 'success' | 'error'>('form');
  const [registrationError, setRegistrationError] = useState<string>('');
  const [registrationErrorDetails, setRegistrationErrorDetails] = useState<any>(null);

  const [formData, setFormData] = useState<RegisterFormData>({
    email: "", password: "", password_confirmation: "", address: "", postcode: "",
    mobile: "", name: "", last_name: "", otp: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [captcha, setCaptcha] = useState<{ question: string; answer: number }>({ question: "", answer: 0 });
  const [captchaInput, setCaptchaInput] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [addressLoading, setAddressLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const router = useRouter();

  const steps = [
    { id: 1, title: "Personal Details", completed: currentStep > 1 },
    { id: 2, title: "Contact & Verification", completed: currentStep > 2 },
    { id: 3, title: "Confirmation", completed: false },
  ];

  // Reset functions
  const handleTryAgain = () => {
    setRegistrationStatus('form');
    setRegistrationError('');
    setRegistrationErrorDetails(null);
    setCurrentStep(3);
    setLoading(false);
  };

  const handleStartOver = () => {
    setRegistrationStatus('form');
    setRegistrationError('');
    setRegistrationErrorDetails(null);
    setCurrentStep(1);
    setFormData({
      email: "", password: "", password_confirmation: "", address: "", postcode: "",
      mobile: "", name: "", last_name: "", otp: ""
    });
    setOtpSent(false);
    setCaptchaInput("");
    setErrors({});
    setLoading(false);
  };

  // Input change handler
  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return;
    }

    setEmailChecking(true);

    try {
      const response = await fetch('https://apexwpc.apextechno.co.uk/api/users', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const users = await response.json();
        let userList = [];
        if (Array.isArray(users)) {
          userList = users;
        } else if (users.data && Array.isArray(users.data)) {
          userList = users.data;
        } else if (users.users && Array.isArray(users.users)) {
          userList = users.users;
        }

        const emailExists = userList.some((user: any) =>
          user.email && user.email.toLowerCase() === email.toLowerCase().trim()
        );

        if (emailExists) {
          setErrors(prev => ({ ...prev, email: "This email address is already registered" }));
        } else {
          setErrors(prev => {
            const { email, ...rest } = prev;
            return rest;
          });
        }
      } else {
        setErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      setErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    } finally {
      setEmailChecking(false);
    }
  };

  // Auto-populate address based on postcode
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
          setFormData(prev => ({ ...prev, address: areaAddress }));
        }
      }
    } catch (error) {
      // Silently fail - user can still enter address manually
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle email with debounced checking
  const handleEmailChange = (value: string) => {
    handleInputChange('email', value);

    if (typeof window !== 'undefined') {
      clearTimeout((window as any).emailCheckTimeout);
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: "" }));
      }
      (window as any).emailCheckTimeout = setTimeout(() => {
        if (value.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          checkEmailExists(value);
        }
      }, 1000);
    }
  };

  // Handle password with validation
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

    // Check password confirmation if it exists
    if (formData.password_confirmation && value !== formData.password_confirmation) {
      setErrors(prev => ({ ...prev, password_confirmation: "Passwords do not match" }));
    } else if (formData.password_confirmation) {
      setErrors(prev => {
        const { password_confirmation, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle password confirmation
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

  // Handle postcode with address lookup
  const handlePostcodeChange = (value: string) => {
    handleInputChange('postcode', value);

    if (typeof window !== 'undefined') {
      clearTimeout((window as any).postcodeTimeout);
      (window as any).postcodeTimeout = setTimeout(() => {
        if (value.trim().length >= 5) {
          autoPopulateAddress(value);
        }
      }, 500);
    }
  };

  // Password validation
  const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) return "Password must contain letters and numbers";
    return "";
  };

  // Field validation
  const validateField = (field: keyof RegisterFormData, value: string): string => {
    switch (field) {
      case 'name':
      case 'last_name':
        if (!value.trim()) return `${field === 'name' ? 'First' : 'Last'} name is required`;
        if (value.trim().length < 2) return "Must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Only letters allowed";
        return "";
      case 'email':
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Invalid email format";
        return "";
      case 'mobile':
        if (!value.trim()) return "Mobile number is required";
        if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(value.trim())) return "Invalid mobile number";
        return "";
      case 'postcode':
        if (!value.trim()) return "Postcode is required";
        if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(value.trim())) return "Invalid UK postcode";
        return "";
      case 'address':
        if (!value.trim()) return "Address is required";
        if (value.trim().length < 10) return "Please enter complete address";
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

  // Generate captcha
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
      case '*':
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
    }

    setCaptcha({ question, answer });
  };

  // Send OTP
  const sendOtp = async () => {
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setLoading(true);

    try {
      const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_h30s1zv',
          template_id: 'template_xt88g6m',
          user_id: 'pwFf0WygEXe4SRTgB',
          template_params: {
            to_email: formData.email,
            user_name: formData.name || 'User',
            otp: otp,
            from_name: 'Registration Team',
            reply_to: 'noreply@yourapp.com'
          }
        })
      });

      if (emailjsResponse.ok || emailjsResponse.status === 200) {
        sessionStorage.setItem('registration_otp', otp);
        sessionStorage.setItem('otp_timestamp', Date.now().toString());
        sessionStorage.setItem('otp_email', formData.email.toLowerCase().trim());
        setOtpSent(true);
        toast.success("OTP sent to your email successfully!");
        setErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      } else {
        throw new Error('Failed to send OTP');
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, email: "Failed to send OTP. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  // Validate step
  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        ['name', 'last_name', 'postcode', 'address'].forEach(field => {
          const error = validateField(field as keyof RegisterFormData, formData[field as keyof RegisterFormData]);
          if (error) newErrors[field] = error;
        });
        break;

      case 2:
        ['email', 'mobile'].forEach(field => {
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
            } else if (otpEmail !== formData.email.toLowerCase().trim()) {
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

        if (!captchaInput.trim()) {
          newErrors.captcha = "Please solve the captcha";
        } else if (parseInt(captchaInput) !== captcha.answer) {
          newErrors.captcha = "Incorrect answer";
        }
        break;

      case 3:
        ['password', 'password_confirmation'].forEach(field => {
          const error = validateField(field as keyof RegisterFormData, formData[field as keyof RegisterFormData]);
          if (error) newErrors[field] = error;
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 1) generateCaptcha();
    }
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const refreshCaptcha = () => {
    generateCaptcha();
    setCaptchaInput("");
    setErrors(prev => ({ ...prev, captcha: "" }));
  };

  // Submit handler
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      // Clean up session
      ['registration_otp', 'otp_timestamp', 'otp_email'].forEach(key =>
        sessionStorage.removeItem(key)
      );

      const apiFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'otp') {
          apiFormData.append(key, key === 'email' ? value.toLowerCase().trim() :
                           key === 'postcode' ? value.toUpperCase().trim() : value.trim());
        }
      });

      const response = await fetch('https://apexwpc.apextechno.co.uk/api/signup', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: apiFormData
      });

      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textResponse = await response.text();
          try {
            data = JSON.parse(textResponse);
          } catch {
            data = { message: textResponse, success: response.ok };
          }
        }
      } catch {
        data = { success: response.ok, message: 'Response could not be parsed' };
      }

      const isSuccess = (response.ok && data?.success === true) ||
                       data?.status === 'success' ||
                       response.status === 201 ||
                       (data?.message && data.message.toLowerCase().includes('success') && data?.success !== false);

      if (isSuccess) {
        setRegistrationStatus('success');
        toast.success("Account created successfully!");
      } else {
        let errorMessage = "Registration failed. Please try again.";
        let errorDetails = null;

        // Handle validation errors from API response
        if (data?.data && typeof data.data === 'object') {
          const errorArray: string[] = [];
          Object.entries(data.data).forEach(([field, fieldErrors]) => {
            const messages = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];
            messages.forEach(msg => errorArray.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`));
          });

          if (data.data.email && Array.isArray(data.data.email)) {
            const emailError = data.data.email[0];
            if (emailError.toLowerCase().includes('taken') ||
                emailError.toLowerCase().includes('already') ||
                emailError.toLowerCase().includes('exists')) {
              errorMessage = "Email address is already registered";
              errorDetails = ["This email is already in use. Please use a different email or try signing in."];
            } else {
              errorMessage = "Please correct the following errors:";
              errorDetails = errorArray;
            }
          } else {
            errorMessage = "Please correct the following errors:";
            errorDetails = errorArray;
          }
        } else if (data?.message) {
          errorMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        }

        setRegistrationError(errorMessage);
        setRegistrationErrorDetails(errorDetails);
        setRegistrationStatus('error');
      }
    } catch (error: any) {
      let errorMessage = "Network error occurred";
      let errorDetails = ["Please check your internet connection and try again."];

      setRegistrationError(errorMessage);
      setRegistrationErrorDetails(errorDetails);
      setRegistrationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && captcha.question === "") {
      generateCaptcha();
    }
  }, [currentStep, captcha.question]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if ((window as any).postcodeTimeout) {
          clearTimeout((window as any).postcodeTimeout);
        }
        if ((window as any).emailCheckTimeout) {
          clearTimeout((window as any).emailCheckTimeout);
        }
      }
    };
  }, []);

  // Success Page
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
                  <p className="text-dark mb-4">Welcome aboard! Your account has been created successfully.</p>
                </div>

                <Card className="bg-light mb-4">
                  <CardBody>
                    <h6 className="text-dark mb-3">Account Details:</h6>
                    <div className="text-start">
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Name:</strong></div>
                        <div className="col-8 text-dark">{formData.name} {formData.last_name}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Email:</strong></div>
                        <div className="col-8 text-dark">{formData.email}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4"><strong className="text-dark">Mobile:</strong></div>
                        <div className="col-8 text-dark">{formData.mobile}</div>
                      </div>
                      <div className="row">
                        <div className="col-4"><strong className="text-dark">Location:</strong></div>
                        <div className="col-8 text-dark">{formData.postcode}</div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <div className="d-grid gap-2">
                  <Button color="success" size="lg" onClick={() => router.push('/auth/login')} className="mb-2">
                    Sign In to Your Account
                  </Button>
                  <Button color="outline-secondary" size="sm" onClick={handleStartOver}>
                    Register Another Account
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Error Page
  if (registrationStatus === 'error') {
    return (
      <Container fluid className="p-0">
        <Row className="m-0">
          <Col xs={12} className="p-0">
            <div className="login-card login-dark">
              <div className="login-main">
                <Link className="logo" href="/">
                  <h3 className="text-center mb-4 text-dark">Registration Failed</h3>
                </Link>
                <div className="text-center mb-4">
                  <div className="mb-4">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" className="mb-3">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                </div>

                {registrationErrorDetails && (
                  <div className="mb-4">
                    <h5 className="text-dark text-center mb-3">What went wrong:</h5>
                    <div className="bg-light p-3 rounded">
                      {Array.isArray(registrationErrorDetails) ? (
                        <ul className="mb-0 text-center text-dark">
                          {registrationErrorDetails.map((error, index) => (
                            <li key={index} className="mb-2">{error}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-dark mb-0">{registrationErrorDetails}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group mb-0">
                  <div className="text-end mt-3">
                    <div className="d-flex gap-2">
                      <Button type="button" color="outline-secondary" onClick={handleStartOver} className="flex-fill">
                        Try again
                      </Button>
                      <Button type="button" color="outline-info" onClick={() => router.push('/auth/login')} className="flex-fill">
                        Sign In
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Main Registration Form
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

              {/* Progress Steps */}
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

                  {/* Step 1: Personal Details */}
                  {currentStep === 1 && (
                    <div>
                      <h4 className="text-dark">Personal Details</h4>
                      <p className="text-muted">Enter your personal information</p>

                      {['name', 'last_name'].map((field) => (
                        <FormGroup key={field}>
                          <Label className="col-form-label text-dark">
                            {field === 'name' ? 'First Name' : 'Last Name'} *
                          </Label>
                          <Input
                            type="text"
                            value={formData[field as keyof RegisterFormData]}
                            onChange={(e) => handleInputChange(field as keyof RegisterFormData, e.target.value)}
                            placeholder={`Enter your ${field === 'name' ? 'first name' : 'last name'}`}
                            invalid={!!errors[field]}
                            autoComplete={field === 'name' ? 'given-name' : 'family-name'}
                          />
                          {errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>}
                        </FormGroup>
                      ))}

                      <FormGroup>
                        <Label className="col-form-label text-dark">Post Code *</Label>
                        <Input
                          type="text"
                          value={formData.postcode}
                          onChange={(e) => handlePostcodeChange(e.target.value)}
                          placeholder="Enter your post code (e.g., SW1A 1AA)"
                          invalid={!!errors.postcode}
                          maxLength={8}
                          autoComplete="postal-code"
                        />
                        {errors.postcode && <div className="invalid-feedback d-block">{errors.postcode}</div>}
                        {addressLoading && <small className="text-info">Looking up area information...</small>}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label text-dark">Address *</Label>
                        <Input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter your full address"
                          invalid={!!errors.address}
                          autoComplete="street-address"
                        />
                        {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
                        <small className="text-muted">
                          Please include house number/name and street name. Area will auto-populate from postcode.
                        </small>
                      </FormGroup>

                      <div className="form-group mb-0">
                        <div className="text-end mt-3">
                          <Button type="button" color="primary" onClick={handleNext} block>
                            Continue to Contact & Verification
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Contact & Email Verification */}
                  {currentStep === 2 && (
                    <div>
                      <h4 className="text-dark">Contact & Email Verification</h4>
                      <p className="text-muted">Enter your contact details and verify your email</p>

                      <FormGroup>
                        <Label className="col-form-label text-dark">Mobile *</Label>
                        <Input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          placeholder="Enter your mobile number"
                          invalid={!!errors.mobile}
                        />
                        {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile}</div>}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label text-dark">{EmailAddress} *</Label>
                        <div className="d-flex">
                          <div className="position-relative flex-grow-1 me-2">
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleEmailChange(e.target.value)}
                              placeholder="Enter your email address"
                              invalid={!!errors.email}
                              autoComplete="email"
                            />
                            {emailChecking && (
                              <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                  <span className="visually-hidden">Checking...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            color="success"
                            onClick={sendOtp}
                            disabled={!formData.email.trim() || loading || emailChecking || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) || !!errors.email}
                            style={{ minWidth: '100px' }}
                          >
                            {loading ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                          </Button>
                        </div>
                        {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                        {emailChecking && <small className="text-info">Checking email availability...</small>}
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
                          <small className="text-muted">OTP sent to {formData.email} (valid for 10 minutes)</small>
                        </FormGroup>
                      )}

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

                      <div className="d-flex gap-2 mt-3">
                        <Button type="button" color="secondary" onClick={handleBack} className="flex-fill">Back</Button>
                        <Button type="button" color="primary" onClick={handleNext} className="flex-fill">Continue</Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Password & Confirmation */}
                  {currentStep === 3 && (
                    <div>
                      <h4 className="text-dark">Set Password & Confirm</h4>
                      <p className="text-muted">Create your password and review your information</p>

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

                      {/* Review Information */}
                      <div className="bg-light p-3 rounded mb-3">
                        <h6 className="mb-3 text-dark">Review Your Information:</h6>
                        <div className="row mb-2">
                          <div className="col-6"><strong className="text-dark">Name:</strong></div>
                          <div className="col-6 text-dark">{formData.name} {formData.last_name}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-6"><strong className="text-dark">Email:</strong></div>
                          <div className="col-6 text-dark">{formData.email} ✓</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-6"><strong className="text-dark">Mobile:</strong></div>
                          <div className="col-6 text-dark">{formData.mobile}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-6"><strong className="text-dark">Postcode:</strong></div>
                          <div className="col-6 text-dark">{formData.postcode}</div>
                        </div>
                        <div className="row">
                          <div className="col-6"><strong className="text-dark">Address:</strong></div>
                          <div className="col-6 text-dark">{formData.address}</div>
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
