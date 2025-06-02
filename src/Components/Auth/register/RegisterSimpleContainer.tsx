"use client";
import { CreateAccount, EmailAddress, Password, SignIn, AlreadyHaveAccount, Name, Address, PostCode, Mobile, LastName } from "@/Constant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Container, Row, Col } from "reactstrap";

interface RegisterFormData {
  email: string;
  password: string;
  password_confirmation: string;
  address: string;
  postcode: string;
  mobile: string;
  name: string;
  last_name: string; // Both name and last_name are required
}

const RegisterSimpleContainer = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    password_confirmation: "",
    address: "",
    postcode: "",
    mobile: "",
    name: "",
    last_name: "" // Both fields included
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.last_name) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('password_confirmation', formData.password_confirmation);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('postcode', formData.postcode);
      formDataToSend.append('mobile', formData.mobile);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('last_name', formData.last_name); // Both fields sent

      console.log('Testing signup without bearer token...');

      // Test signup without bearer token first
      const response = await fetch('https://apexwpc.apextechno.co.uk/api/signup', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok && data.success) {
        toast.success("Account created successfully! Please login.");
        router.push("/auth/login");
      } else {
        // Log the error to see what the API expects
        console.error('API Error:', data);
        toast.error(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs={12} className="p-0">
          <div className="login-card login-dark">
            <div>
              <div>
                <Link className="logo" href="/">
                  <h3 className="text-center mb-4">Create Account</h3>
                </Link>
              </div>
              <div className="login-main">
                <Form className="theme-form" onSubmit={handleSubmit}>
                  <h4>{CreateAccount}</h4>
                  <p>{"Enter your details to create an account"}</p>

                  <FormGroup>
                    <Label className="col-form-label">{EmailAddress} *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">First Name *</Label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">Last Name *</Label>
                    <Input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">{Mobile || "Mobile"}</Label>
                    <Input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="Enter your mobile number"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">{Address || "Address"}</Label>
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">{PostCode || "Post Code"}</Label>
                    <Input
                      type="text"
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                      placeholder="Enter your post code"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">{Password} *</Label>
                    <div className="form-input position-relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <div className="show-hide" onClick={() => setShowPassword(!showPassword)}>
                        <span className="show" />
                      </div>
                    </div>
                  </FormGroup>

                  <FormGroup>
                    <Label className="col-form-label">Confirm Password *</Label>
                    <div className="form-input position-relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.password_confirmation}
                        onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                      <div className="show-hide" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <span className="show" />
                      </div>
                    </div>
                  </FormGroup>

                  <div className="form-group mb-0">
                    <div className="text-end mt-3">
                      <Button type="submit" color="primary" block disabled={loading}>
                        {loading ? "Creating Account..." : CreateAccount}
                      </Button>
                    </div>
                  </div>

                  <p className="mt-4 mb-0 text-center">
                    {AlreadyHaveAccount || "Already have an account?"}
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
