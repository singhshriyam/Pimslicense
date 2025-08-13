"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, FormGroup, Input, Label, Alert } from "reactstrap";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { loginUser, saveAuthToken } from "@/services/apiService";

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

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login...');

      // Call the real API
      const response = await loginUser({
        email: email.toLowerCase().trim(),
        password: password
      });

      console.log('✅ Login successful:', response);

      // Handle successful response
      if (response.token) {
        // Save the authentication token
        saveAuthToken(response.token);

        // Save user data to localStorage for easy access
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
          localStorage.setItem('userFirstName', response.user.first_name || '');
          localStorage.setItem('userLastName', response.user.last_name || '');
          localStorage.setItem('userEmail', response.user.email || '');
          localStorage.setItem('userCompany', response.user.customer_name || '');
          localStorage.setItem('userRole', response.user.role || '');
          localStorage.setItem('userPhone', response.user.phone || '');
        }

        // Show success message
        toast.success(`Welcome back, ${response.user?.first_name || 'User'}!`);

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } else {
        setError("Login failed: No authentication token received");
      }

    } catch (error: any) {
      console.error("❌ Login error:", error);

      // Handle different types of errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError("Invalid email or password");
      } else if (error.message.includes('422')) {
        setError("Please check your email format and try again");
      } else if (error.message.includes('500')) {
        setError("Server error. Please try again later");
      } else {
        setError(error.message || "Login failed. Please try again");
      }
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
