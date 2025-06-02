"use client";
import { CreateAccount, EmailAddress, Password, SignIn, Address, PostCode, Mobile } from "@/Constant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Container, Row, Col } from "reactstrap";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

interface RegisterFormData {
  email: string;
  password: string;
  password_confirmation: string;
  address: string;
  postcode: string;
  mobile: string;
  name: string;
  last_name: string;
}

// Yup validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  name: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .required("First name is required"),
  last_name: Yup.string()
    .min(2, "Last name must be at least 2 characters")
    .required("Last name is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords must match")
    .required("Please confirm your password"),
  mobile: Yup.string()
    .matches(/^[0-9+\-\s()]+$/, "Please enter a valid mobile number")
    .optional(),
  address: Yup.string().optional(),
  postcode: Yup.string().optional(),
});

const RegisterSimpleContainer = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const initialValues: RegisterFormData = {
    email: "",
    password: "",
    password_confirmation: "",
    address: "",
    postcode: "",
    mobile: "",
    name: "",
    last_name: ""
  };

  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);

    try {
      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('email', values.email);
      formDataToSend.append('password', values.password);
      formDataToSend.append('password_confirmation', values.password_confirmation);
      formDataToSend.append('address', values.address);
      formDataToSend.append('postcode', values.postcode);
      formDataToSend.append('mobile', values.mobile);
      formDataToSend.append('name', values.name);
      formDataToSend.append('last_name', values.last_name);

      console.log('Submitting signup...');

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
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ handleSubmit, handleChange, handleBlur, values, errors, touched, isValid }) => (
                    <Form className="theme-form" onSubmit={handleSubmit}>
                      <h4>{CreateAccount}</h4>
                      <p>{"Enter your details to create an account"}</p>

                      <FormGroup>
                        <Label className="col-form-label">{EmailAddress} *</Label>
                        <Input
                          type="email"
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your email"
                          invalid={touched.email && !!errors.email}
                        />
                        {touched.email && errors.email && (
                          <div className="text-danger small mt-1">{errors.email}</div>
                        )}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">First Name *</Label>
                        <Input
                          type="text"
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your first name"
                          invalid={touched.name && !!errors.name}
                        />
                        {touched.name && errors.name && (
                          <div className="text-danger small mt-1">{errors.name}</div>
                        )}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">Last Name *</Label>
                        <Input
                          type="text"
                          name="last_name"
                          value={values.last_name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your last name"
                          invalid={touched.last_name && !!errors.last_name}
                        />
                        {touched.last_name && errors.last_name && (
                          <div className="text-danger small mt-1">{errors.last_name}</div>
                        )}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">{Mobile || "Mobile"}</Label>
                        <Input
                          type="tel"
                          name="mobile"
                          value={values.mobile}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your mobile number"
                          invalid={touched.mobile && !!errors.mobile}
                        />
                        {touched.mobile && errors.mobile && (
                          <div className="text-danger small mt-1">{errors.mobile}</div>
                        )}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">{Address || "Address"}</Label>
                        <Input
                          type="text"
                          name="address"
                          value={values.address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your address"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">{PostCode || "Post Code"}</Label>
                        <Input
                          type="text"
                          name="postcode"
                          value={values.postcode}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your post code"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">{Password} *</Label>
                        <div className="form-input position-relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Enter your password"
                            invalid={touched.password && !!errors.password}
                          />
                          <div className="show-hide" onClick={() => setShowPassword(!showPassword)}>
                            <span className="show" />
                          </div>
                        </div>
                        {touched.password && errors.password && (
                          <div className="text-danger small mt-1">{errors.password}</div>
                        )}
                      </FormGroup>

                      <FormGroup>
                        <Label className="col-form-label">Confirm Password *</Label>
                        <div className="form-input position-relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            name="password_confirmation"
                            value={values.password_confirmation}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Confirm your password"
                            invalid={touched.password_confirmation && !!errors.password_confirmation}
                          />
                          <div className="show-hide" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <span className="show" />
                          </div>
                        </div>
                        {touched.password_confirmation && errors.password_confirmation && (
                          <div className="text-danger small mt-1">{errors.password_confirmation}</div>
                        )}
                      </FormGroup>

                      <div className="form-group mb-0">
                        <div className="text-end mt-3">
                          <Button
                            type="submit"
                            color="primary"
                            block
                            disabled={loading || !isValid}
                          >
                            {loading ? "Creating Account..." : CreateAccount}
                          </Button>
                        </div>
                      </div>

                      {/* <p className="mt-4 mb-0 text-center">
                        {AlreadyHaveAccount || "Already have an account?"}
                        <Link className="ms-2" href="/auth/login">
                          {SignIn}
                        </Link>
                      </p> */}
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterSimpleContainer;
