"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, FormGroup, Input, Label, Alert } from "reactstrap";
import Image from "next/image";
import Link from "next/link";

const ApexLogo = "/assets/images/logo/apex-logo.png";

const UserForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const API_BASE_URL = "https://apexwpc.apextechno.co.uk/api";

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
      // Create FormData as your API expects
      const formData = new FormData();
      formData.append('email', email.trim());
      formData.append('password', password);

      console.log("Attempting login...");

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: formData
      });

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (response.ok && data.success) {
        // Extract user info from API response
        const token = data.token || data.access_token || data.data?.token;
        const user = data.user || data.data?.user || data.data || {};

        // Store user info in localStorage
        localStorage.setItem("authToken", token);
        localStorage.setItem("userId", user?.id || user?.user_id || "");
        localStorage.setItem("userName", user?.name || user?.username || email.split('@')[0]);
        localStorage.setItem("userEmail", user?.email || email);
        localStorage.setItem("userTeam", user?.team || user?.role || "User");

        console.log("Login successful, redirecting...");

        // Determine dashboard route based on team
        const userTeam = (user?.team || user?.role || "user").toLowerCase();

        let dashboardRoute = "/dashboard/enduser"; // default

        if (userTeam.includes("admin")) {
          dashboardRoute = "/dashboard/admin";
        } else if (userTeam.includes("incident") && userTeam.includes("manager")) {
          dashboardRoute = "/dashboard/incident_manager";
        } else if (userTeam.includes("incident") && userTeam.includes("handler")) {
          dashboardRoute = "/dashboard/incident_handler";
        } else if (userTeam.includes("developer")) {
          dashboardRoute = "/dashboard/developer";
        }

        // Force redirect immediately
        window.location.href = dashboardRoute;

      } else {
        const errorMessage = data.message || data.error || "Login failed";
        setError(errorMessage);
      }
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
              <div
                className="show-hide"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <span className="show" />
              </div>
            </div>
          </FormGroup>

          {/* Remember Me and Forgot Password */}
          <div className="form-group mb-0">
            <div className="checkbox p-0">
              <Input
                id="checkbox1"
                type="checkbox"
                disabled={loading}
              />
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

export default UserForm;
