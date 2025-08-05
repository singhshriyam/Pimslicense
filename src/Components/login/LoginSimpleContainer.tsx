"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, FormGroup, Input, Label, Alert } from "reactstrap";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";

const ApexLogo = "/assets/images/logo/apex-logo.png";

const LoginSimpleContainer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Clear error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Frontend-only validation - check if user exists in localStorage from registration
      const registeredEmails = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const userExists = registeredEmails.find((user: any) =>
        user.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!userExists) {
        setError("No account found with this email address");
        setLoading(false);
        return;
      }

      // Simple password validation (in real app, this would be hashed)
      if (password !== userExists.password) {
        setError("Invalid password");
        setLoading(false);
        return;
      }

      // Simulate successful login - store user session data
      const mockUserData = {
        userId: userExists.id || Date.now(),
        firstName: userExists.contact_name || 'User',
        lastName: userExists.contact_last_name || '',
        email: userExists.email,
        company: userExists.company_name || '',
        team: 'User', // Default team
        mobile: userExists.contact_phone || '',
        designation: userExists.contact_designation || ''
      };

      // Store authentication data
      localStorage.setItem("authToken", `demo-token-${Date.now()}`);
      localStorage.setItem("userId", mockUserData.userId.toString());
      localStorage.setItem('userFirstName', mockUserData.firstName);
      localStorage.setItem('userLastName', mockUserData.lastName);
      localStorage.setItem('userEmail', mockUserData.email);
      localStorage.setItem('userMobile', mockUserData.mobile);
      localStorage.setItem('userTeam', mockUserData.team);
      localStorage.setItem('userCompany', mockUserData.company);
      localStorage.setItem('userDesignation', mockUserData.designation);

      console.log('=== DEBUG - Login Successful ===');
      console.log('User logged in:', mockUserData);
      console.log('Stored in localStorage');

      toast.success(`Welcome back, ${mockUserData.firstName}!`);

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error("Login error:", error);
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Logo */}
      <div className="text-center mb-4">
        <Link href="/">
          <Image
            width={75}
            height={60}
            className="img-fluid"
            src={ApexLogo}
            alt="Apex Techno Login"
            priority
          />
        </Link>
      </div>

      <div className="login-main">
        <Form className="theme-form" onSubmit={handleLogin}>
          <h5 className="text-center text-muted mb-4">
            Please enter your login credentials
          </h5>

          {/* Error Alert */}
          {error && (
            <Alert color="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {/* Email Field */}
          <FormGroup>
            <Label htmlFor="email">
              Email Address <span className="text-danger">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </FormGroup>

          {/* Password Field */}
          <FormGroup>
            <Label htmlFor="password">
              Password <span className="text-danger">*</span>
            </Label>
            <div className="form-input position-relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
              <div
                className="show-hide"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: loading ? "not-allowed" : "pointer" }}
              >
                <span className="show" />
              </div>
            </div>
          </FormGroup>

          {/* Remember Me and Forgot Password */}
          <div className="form-group mb-0">
            <div className="checkbox p-0">
              <Input id="checkbox1" type="checkbox" disabled={loading} />
              <Label className="text-muted" htmlFor="checkbox1">
                Remember Password
              </Label>
            </div>
            <Link className="link" href="/auth/forgot-password">
              Forgot Password?
            </Link>

            {/* Submit Button */}
            <div className="text-end mt-3">
              <Button
                type="submit"
                color="primary"
                block
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          </div>

          {/* Register Link */}
          <p className="mt-4 mb-0 text-center">
            Don't have account?
            <Link className="ms-2" href="/auth/register">
              Create Account
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};

export default LoginSimpleContainer;
