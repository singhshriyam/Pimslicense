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
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, memo } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label, Alert } from "reactstrap";
import Image from "next/image";
import ApexLogo from "../../../public/assets/images/logo/apex-logo.png";

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

  // Team to dashboard mapping
  const getTeamDashboard = (team: string): string => {
    const teamLower = team.toLowerCase().trim();

    if (teamLower.includes('admin')) return '/dashboard/admin';
    if (teamLower.includes('incident') && teamLower.includes('handler')) return '/dashboard/incident_handler';
    if (teamLower.includes('incident') && teamLower.includes('manager')) return '/dashboard/incident_manager';
    if (teamLower.includes('developer') || teamLower.includes('dev')) return '/dashboard/developer';
    if (teamLower.includes('sla')) return '/dashboard/developer';

    return '/dashboard/enduser';
  };

  // Handle form submission
  const formSubmitHandle = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || googleLoading) return;
    if (!validateForm()) return;

    setLoading(true);
    setFormError(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Login successful! Redirecting...");
        // The login page will handle the redirect based on session
        router.refresh();
      } else {
        throw new Error(result?.error || 'Invalid credentials');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message.includes('credentials')
        ? 'Invalid email or password. Please check your credentials.'
        : 'Login failed. Please try again.';

      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, googleLoading, router]);

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
        router.refresh();
      } else {
        throw new Error(result?.error || 'Google authentication failed');
      }

    } catch (error: any) {
      console.error('Google login error:', error);
      setFormError('Google login failed. Please try again.');
      toast.error('Google login failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, loading, router]);

  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (formError) setFormError(null);
  }, [formError]);

  const handlePasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (formError) setFormError(null);
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
