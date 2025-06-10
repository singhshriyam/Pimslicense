"use client";
import { CreateAccount, EmailAddress, Password, SignIn, AlreadyHaveAccount, Name, Address, PostCode, Mobile, LastName } from "@/Constant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Container, Row, Col } from "reactstrap";

// Extend Window interface for timeout
declare global {
  interface Window {
    postcodeTimeout: NodeJS.Timeout;
  }
}

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

interface Step {
  id: number;
  title: string;
  completed: boolean;
}

const RegisterSimpleContainer = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    password_confirmation: "",
    address: "",
    postcode: "",
    mobile: "",
    name: "",
    last_name: "",
    otp: ""
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [captcha, setCaptcha] = useState<{ question: string; answer: number }>({
    question: "",
    answer: 0,
  });
  const [captchaInput, setCaptchaInput] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  // EmailJS Configuration
  const EMAILJS_CONFIG = {
    serviceId: 'service_h30s1zv',
    templateId: 'template_xt88g6m',
    publicKey: 'pwFf0WygEXe4SRTgB'
  };

  const steps: Step[] = [
    { id: 1, title: "Personal Details", completed: currentStep > 1 },
    { id: 2, title: "Contact & Verification", completed: currentStep > 2 },
    { id: 3, title: "Confirmation", completed: false },
  ];

  // Generate random math captcha
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

  // Auto-populate address based on postcode using free postcodes.io API
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
          setFormData(prev => ({
            ...prev,
            address: areaAddress
          }));
        }
      }
    } catch (error) {
      // Silently fail - user can still enter address manually
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle postcode input with debounced address lookup
  const handlePostcodeChange = (value: string) => {
    handleInputChange('postcode', value);

    if (typeof window !== 'undefined') {
      clearTimeout(window.postcodeTimeout);
      window.postcodeTimeout = setTimeout(() => {
        if (value.trim().length >= 5) {
          autoPopulateAddress(value);
        }
      }, 500);
    }
  };

  // Send OTP via EmailJS
  const sendOtp = async () => {
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: "Please enter your email address first" }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setLoading(true);

    try {
      const templateParams = {
        to_email: formData.email,
        user_name: formData.name || 'User',
        otp: otp, // Changed from otp_code to otp to match your template
        from_name: 'Registration Team',
        reply_to: 'noreply@yourapp.com'
      };

      const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_CONFIG.serviceId,
          template_id: EMAILJS_CONFIG.templateId,
          user_id: EMAILJS_CONFIG.publicKey,
          template_params: templateParams
        })
      });

      if (emailjsResponse.ok || emailjsResponse.status === 200) {
        sessionStorage.setItem('registration_otp', otp);
        sessionStorage.setItem('otp_timestamp', Date.now().toString());
        sessionStorage.setItem('otp_email', formData.email.toLowerCase().trim());

        setOtpSent(true);
        toast.success("OTP sent to your email successfully!");

        // Clear any email errors
        setErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      } else {
        throw new Error(`EmailJS Error: ${emailjsResponse.status}`);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, email: "Failed to send OTP. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate individual fields with detailed error messages
  const validateField = (field: keyof RegisterFormData, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2) return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "First name can only contain letters";
        return "";

      case 'last_name':
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2) return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Last name can only contain letters";
        return "";

      case 'email':
        if (!value.trim()) return "Email address is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address";
        return "";

      case 'mobile':
        if (!value.trim()) return "Mobile number is required";
        if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(value.trim())) return "Please enter a valid mobile number";
        return "";

      case 'postcode':
        if (!value.trim()) return "Postcode is required";
        if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(value.trim())) return "Please enter a valid UK postcode";
        return "";

      case 'address':
        if (!value.trim()) return "Address is required";
        if (value.trim().length < 10) return "Please enter a complete address";
        return "";

      case 'password':
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) return "Password must contain at least one letter and one number";
        return "";

      case 'password_confirmation':
        if (!value) return "Please confirm your password";
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

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        const nameError = validateField('name', formData.name);
        if (nameError) newErrors.name = nameError;

        const lastNameError = validateField('last_name', formData.last_name);
        if (lastNameError) newErrors.last_name = lastNameError;

        const postcodeError = validateField('postcode', formData.postcode);
        if (postcodeError) newErrors.postcode = postcodeError;

        const addressError = validateField('address', formData.address);
        if (addressError) newErrors.address = addressError;
        break;

      case 2:
        const emailError = validateField('email', formData.email);
        if (emailError) newErrors.email = emailError;

        const mobileError = validateField('mobile', formData.mobile);
        if (mobileError) newErrors.mobile = mobileError;

        if (!otpSent) {
          newErrors.otp = "Please send OTP first";
        } else {
          const otpError = validateField('otp', formData.otp);
          if (otpError) {
            newErrors.otp = otpError;
          } else {
            // Validate OTP with additional security checks
            const storedOtp = sessionStorage.getItem('registration_otp');
            const otpTimestamp = sessionStorage.getItem('otp_timestamp');
            const otpEmail = sessionStorage.getItem('otp_email');

            if (!storedOtp || formData.otp !== storedOtp) {
              newErrors.otp = "Invalid OTP. Please check and try again.";
            } else if (otpEmail !== formData.email.toLowerCase().trim()) {
              newErrors.otp = "OTP was sent to a different email address";
            } else if (otpTimestamp) {
              const timeElapsed = Date.now() - parseInt(otpTimestamp);
              if (timeElapsed > 10 * 60 * 1000) { // 10 minutes expiry
                newErrors.otp = "OTP has expired. Please request a new one.";
                sessionStorage.removeItem('registration_otp');
                sessionStorage.removeItem('otp_timestamp');
                sessionStorage.removeItem('otp_email');
                setOtpSent(false);
              }
            }
          }
        }

        if (!captchaInput.trim()) {
          newErrors.captcha = "Please solve the captcha";
        } else if (parseInt(captchaInput) !== captcha.answer) {
          newErrors.captcha = "Incorrect answer. Please try again.";
        }
        break;

      case 3:
        const passwordError = validateField('password', formData.password);
        if (passwordError) newErrors.password = passwordError;

        const confirmPasswordError = validateField('password_confirmation', formData.password_confirmation);
        if (confirmPasswordError) newErrors.password_confirmation = confirmPasswordError;
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      if (currentStep === 1) {
        generateCaptcha();
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const refreshCaptcha = () => {
    generateCaptcha();
    setCaptchaInput("");
    setErrors(prev => ({ ...prev, captcha: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setLoading(true);

    try {
      // Clean up OTP data from session
      sessionStorage.removeItem('registration_otp');
      sessionStorage.removeItem('otp_timestamp');
      sessionStorage.removeItem('otp_email');

      // Determine API endpoint
      let apiUrl;
      let useNextjsApi = false;

      try {
        const testResponse = await fetch('/api/register', { method: 'HEAD' });
        if (testResponse.status !== 404) {
          apiUrl = '/api/register';
          useNextjsApi = true;
        }
      } catch (e) {
        // API route doesn't exist, use CORS proxy
      }

      if (!useNextjsApi) {
        apiUrl = process.env.NODE_ENV === 'development'
          ? 'https://cors-anywhere.herokuapp.com/https://apexwpc.apextechno.co.uk/api/signup'
          : 'https://apexwpc.apextechno.co.uk/api/signup';
      }

      let requestBody;
      let requestHeaders = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      if (useNextjsApi) {
        requestBody = JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          address: formData.address.trim(),
          postcode: formData.postcode.toUpperCase().trim(),
          mobile: formData.mobile.trim(),
          last_name: formData.last_name.trim()
        });
        requestHeaders['Content-Type'] = 'application/json';
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name.trim());
        formDataToSend.append('email', formData.email.toLowerCase().trim());
        formDataToSend.append('password', formData.password);
        formDataToSend.append('password_confirmation', formData.password_confirmation);
        formDataToSend.append('address', formData.address.trim());
        formDataToSend.append('postcode', formData.postcode.toUpperCase().trim());
        formDataToSend.append('mobile', formData.mobile.trim());
        formDataToSend.append('last_name', formData.last_name.trim());
        requestBody = formDataToSend;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: requestBody,
        headers: requestHeaders
      });

      let data;
      const contentType = response.headers.get('content-type');

      try {
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
      } catch (parseError) {
        data = { success: response.ok, message: 'Registration response could not be parsed' };
      }

      const isSuccess = response.ok ||
                       data?.success === true ||
                       data?.status === 'success' ||
                       response.status === 200 ||
                       response.status === 201;

      if (isSuccess) {
        toast.success("Account created successfully! Redirecting to login...");

        // Clear form data
        setFormData({
          email: "",
          password: "",
          password_confirmation: "",
          address: "",
          postcode: "",
          mobile: "",
          name: "",
          last_name: "",
          otp: ""
        });

        setCurrentStep(1);
        setOtpSent(false);
        setCaptchaInput("");
        setErrors({});

        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        // Handle specific error messages including email exists
        if (data?.errors) {
          const apiErrors: { [key: string]: string } = {};

          if (typeof data.errors === 'object') {
            Object.keys(data.errors).forEach(key => {
              const errorMessages = Array.isArray(data.errors[key])
                ? data.errors[key]
                : [data.errors[key]];
              apiErrors[key] = errorMessages.join(', ');
            });
          }

          setErrors(apiErrors);

          // Show specific message for email exists
          if (apiErrors.email && apiErrors.email.toLowerCase().includes('taken')) {
            toast.error("This email address is already registered. Please use a different email or try logging in.");
          } else {
            toast.error("Please correct the errors below and try again.");
          }
        } else if (data?.message) {
          const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;

          if (message.toLowerCase().includes('email') && (message.toLowerCase().includes('taken') || message.toLowerCase().includes('exists'))) {
            setErrors({ email: "This email address is already registered" });
            toast.error("This email address is already registered. Please use a different email or try logging in.");
          } else {
            toast.error(message);
          }
        } else if (response.status === 422) {
          toast.error("Validation failed. Please check your information and try again.");
        } else if (response.status === 409) {
          setErrors({ email: "This email address is already registered" });
          toast.error("This email address is already registered. Please use a different email or try logging in.");
        } else {
          toast.error("Registration failed. Please try again.");
        }
      }
    } catch (error) {
      toast.error("Registration failed. Please check your connection and try again.");
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
      if (typeof window !== 'undefined' && window.postcodeTimeout) {
        clearTimeout(window.postcodeTimeout);
      }
    };
  }, []);

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

                      <FormGroup>
                        <Label className="col-form-label text-dark">First Name *</Label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your first name"
                          invalid={!!errors.name}
                          autoComplete="given-name"
                        />
                        {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label text-dark">Last Name *</Label>
                        <Input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Enter your last name"
                          invalid={!!errors.last_name}
                          autoComplete="family-name"
                        />
                        {errors.last_name && <div className="invalid-feedback d-block">{errors.last_name}</div>}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label text-dark">{PostCode || "Post Code"} *</Label>
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
                        <Label className="col-form-label text-dark">{Address || "Address"} *</Label>
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
                        <Label className="col-form-label text-dark">{Mobile || "Mobile"} *</Label>
                        <Input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                          placeholder="Enter your mobile number (e.g., +44 7123 456789)"
                          invalid={!!errors.mobile}
                          autoComplete="tel"
                        />
                        {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile}</div>}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label text-dark">{EmailAddress} *</Label>
                        <div className="d-flex">
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email address"
                            invalid={!!errors.email}
                            className="me-2"
                            autoComplete="email"
                          />
                          <Button
                            type="button"
                            color="success"
                            onClick={sendOtp}
                            disabled={!formData.email.trim() || loading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                            style={{ minWidth: '100px' }}
                          >
                            {loading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                          </Button>
                        </div>
                        {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
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
                            autoComplete="one-time-code"
                          />
                          {errors.otp && <div className="invalid-feedback d-block">{errors.otp}</div>}
                          <small className="text-muted">
                            OTP sent to {formData.email} (valid for 10 minutes)
                          </small>
                        </FormGroup>
                      )}

                      {/* Captcha */}
                      <FormGroup>
                        <Label className="col-form-label text-dark">Security Check *</Label>
                        <div className="d-flex align-items-center">
                          <div className="d-flex align-items-center me-3">
                            <span className="bg-light p-2 rounded me-2 fw-bold text-dark border">
                              {captcha.question} = ?
                            </span>
                            <Button
                              type="button"
                              color="link"
                              size="sm"
                              onClick={refreshCaptcha}
                              title="Generate new captcha"
                              className="text-primary"
                            >
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
                        <Button type="button" color="secondary" onClick={handleBack} className="flex-fill">
                          Back
                        </Button>
                        <Button type="button" color="primary" onClick={handleNext} className="flex-fill">
                          Continue to Password
                        </Button>
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
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Enter your password (min 6 characters)"
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
                            onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
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
                        <Button type="button" color="secondary" onClick={handleBack} className="flex-fill">
                          Back
                        </Button>
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
                    <span className="text-dark">{AlreadyHaveAccount || "Already have an account?"}</span>
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
