"use client";
import {
  CreateAccount,
  DontHaveAccount,
  EmailAddress,
  ForgotPassword,
  Href,
  OrSignInWith,
  Password,
  RememberPassword,
  SignIn
} from "@/Constant";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, memo } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Alert } from "reactstrap";
import Image from "next/image";
import ApexLogo from "../../../public/assets/images/logo/apex-logo.png";
import { loginUser, setStoredToken, refreshSession } from "../../app/(MainBody)/services/userService";
import { RoleUtils } from "@/Data/Layout/Menu";

const UserForm = memo(() => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Form validation
  const validateForm = (): boolean => {
    setFormError(null);

    if (!email.trim()) {
      setFormError("Email address is required");
      return false;
    }

    if (!isValidEmail(email)) {
      setFormError("Please enter a valid email address");
      return false;
    }

    if (!password.trim()) {
      setFormError("Password is required");
      return false;
    }

    if (password.length < 3) {
      setFormError("Password must be at least 3 characters long");
      return false;
    }

    return true;
  };

  // Handle redirection after successful login
  const handleRedirection = useCallback(async (userRole?: string) => {
    try {
      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh session to ensure it's valid
      const sessionValid = await refreshSession();
      if (!sessionValid) {
        console.warn('Session validation failed after login');
      }

      // Get session for role-based routing
      const session = await getSession();
      console.log('Session after login:', session);

      // Determine redirect route based on role
      let redirectRoute = '/dashboard/enduser'; // Default fallback

      if (userRole) {
        // Map user role to dashboard route
        const roleRoutes: Record<string, string> = {
          'ADMINISTRATOR': '/dashboard/admin',
          'INCIDENT_HANDLER': '/dashboard/incident_handler',
          'INCIDENT_MANAGER': '/dashboard/incident_manager',
          'SLA_MANAGER': '/dashboard/sla_manager',
          'DEVELOPER': '/dashboard/developer',
          'USER': '/dashboard/enduser'
        };

        const normalizedRole = userRole.toUpperCase().replace(/\s+/g, '_');
        redirectRoute = roleRoutes[normalizedRole] || '/dashboard/enduser';
      } else if (session?.user) {
        // Fallback to using RoleUtils if we have session
        try {
          const user = session.user as any;
          const role = user.team || 'USER';
          redirectRoute = RoleUtils.getDefaultDashboard(role);
        } catch (error) {
          console.warn('Error determining role from session:', error);
        }
      }

      console.log('Redirecting to:', redirectRoute);
      router.push(redirectRoute);

    } catch (error) {
      console.error('Redirection error:', error);
      // Fallback redirect
      router.push("/dashboard/enduser");
    }
  }, [router]);

  // Handle form submission with comprehensive error handling
  const formSubmitHandle = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || googleLoading) return;

    if (!validateForm()) return;

    setLoading(true);
    setFormError(null);

    try {
      console.log('Attempting login...');

      // First, login via API
      const loginResponse = await loginUser(email.trim(), password);

      if (loginResponse.success && loginResponse.data.token) {
        console.log('API Login successful');

        // Extract user data
        const userData = {
          token: loginResponse.data.token,
          userId: loginResponse.data.userId || loginResponse.data.user_id,
          email: email.trim(),
          name: loginResponse.data.user?.name || email.split('@')[0],
          team: loginResponse.data.user?.team || 'USER'
        };

        // Validate required data
        if (!userData.userId) {
          throw new Error('User ID not received from server');
        }

        console.log('User data:', {
          userId: userData.userId,
          email: userData.email,
          name: userData.name,
          team: userData.team
        });

        // Now authenticate with NextAuth
        const nextAuthResult = await signIn("credentials", {
          email: email.trim(),
          password: password,
          redirect: false,
        });

        if (nextAuthResult?.ok) {
          toast.success("Login successful! Redirecting...");
          await handleRedirection(userData.team);
        } else if (nextAuthResult?.error) {
          // NextAuth failed but API succeeded - still proceed
          console.warn('NextAuth failed:', nextAuthResult.error);
          toast.success("Login successful! Redirecting...");
          await handleRedirection(userData.team);
        } else {
          throw new Error('Authentication failed');
        }

      } else {
        throw new Error(loginResponse.message || 'Login failed');
      }

    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed. Please try again.';

      if (error.message.includes('credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('server') || error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
      toast.error(errorMessage);

    } finally {
      setLoading(false);
    }
  }, [email, password, loading, googleLoading, handleRedirection]);

  // Handle Google sign in
  const handleGoogleSignIn = useCallback(async () => {
    if (googleLoading || loading) return;

    setGoogleLoading(true);
    setFormError(null);

    try {
      const result = await signIn("google", {
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Google login successful! Redirecting...");
        await handleRedirection('USER'); // Default to USER for Google login
      } else if (result?.error) {
        throw new Error(result.error);
      } else {
        throw new Error('Google authentication failed');
      }

    } catch (error: any) {
      console.error('Google login error:', error);

      let errorMessage = 'Google login failed. Please try again.';
      if (error.message.includes('popup')) {
        errorMessage = 'Google login popup was blocked. Please allow popups and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
      toast.error(errorMessage);

    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, loading, handleRedirection]);

  // Input change handlers with validation
  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEmail(value);

    // Clear form error when user starts typing
    if (formError) {
      setFormError(null);
    }
  }, [formError]);

  const handlePasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPassword(value);

    // Clear form error when user starts typing
    if (formError) {
      setFormError(null);
    }
  }, [formError]);

  const togglePasswordVisibility = useCallback(() => {
    setShow(prev => !prev);
  }, []);

  const handleRememberMeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  }, []);

  const isFormDisabled = loading || googleLoading;
  const canSubmit = !isFormDisabled && email.trim() && password.trim();

  return (
    <div>
      <div className="text-center mb-4">
        <Link className="logo" href={Href || "/"}>
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
        <Form className="theme-form" onSubmit={formSubmitHandle} noValidate>
          <h5 className="text-center text-muted mb-4">
            Please enter your login credentials
          </h5>

          {/* Error Alert */}
          {formError && (
            <Alert color="danger" className="mb-3">
              {formError}
            </Alert>
          )}

          <FormGroup>
            <Label className="col-form-label" htmlFor="email">
              {EmailAddress || "Email Address"} <span className="text-danger">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              required
              disabled={isFormDisabled}
              className={formError && formError.toLowerCase().includes('email') ? 'is-invalid' : ''}
              autoComplete="email"
            />
          </FormGroup>

          <FormGroup>
            <Label className="col-form-label" htmlFor="password">
              {Password || "Password"} <span className="text-danger">*</span>
            </Label>
            <div className="form-input position-relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                required
                disabled={isFormDisabled}
                className={formError && formError.toLowerCase().includes('password') ? 'is-invalid' : ''}
                autoComplete="current-password"
              />
              <div
                className="show-hide"
                onClick={togglePasswordVisibility}
                style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
              >
                <span className="show" />
              </div>
            </div>
          </FormGroup>

          <div className="form-group mb-0">
            <div className="checkbox p-0">
              <Input
                id="checkbox1"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                disabled={isFormDisabled}
              />
              <Label className="text-muted" htmlFor="checkbox1">
                {RememberPassword || "Remember Password"}
              </Label>
            </div>
            <Link className="link" href="/auth/forgot-password">
              {ForgotPassword || "Forgot Password"}?
            </Link>
            <div className="text-end mt-3">
              <Button
                type="submit"
                color="primary"
                block
                disabled={!canSubmit}
                className="position-relative"
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </span>
                )}
                {loading ? "Signing In..." : (SignIn || "Sign In")}
              </Button>
            </div>
          </div>

          <h6 className="text-muted mt-4 or">{OrSignInWith || "Or Sign In With"}</h6>

          <div className="social-login mt-2">
            <Button
              type="button"
              color="danger"
              block
              disabled={isFormDisabled}
              onClick={handleGoogleSignIn}
              className="d-flex align-items-center justify-content-center mb-3 position-relative"
            >
              {googleLoading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </span>
              ) : (
                <svg
                  className="me-2"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "Signing In..." : "Continue with Google"}
            </Button>
          </div>

          <p className="mt-4 mb-0 text-center">
            {DontHaveAccount || "Don't have account?"}
            <Link className="ms-2" href="/auth/register">
              {CreateAccount || "Create Account"}
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
});

UserForm.displayName = 'UserForm';

export default UserForm;
