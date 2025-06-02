"use client";
import { CreateAccount, DontHaveAccount, EmailAddress, ForgotPassword, Href, ImagePath, OrSignInWith, Password, RememberPassword, SignIn, SignInToAccount } from "@/Constant";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import imageOne from "../../../public/assets/images/logo/logo-1.png";
import imageTwo from "../../../public/assets/images/logo/logo.png";
import { UserSocialApp } from "./UserSocialApp";

const UserForm = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formSubmitHandle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/pages/sample_page",
      });

      if (result?.ok) {
        toast.success("Successfully logged in! Redirecting...");
        router.push("/pages/sample_page");
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <Link className="logo" href={Href}>
          <Image priority width={100} height={34} className="img-fluid for-light" src={imageOne} alt="login page" />
          <Image priority width={100} height={34} className="img-fluid for-dark" src={imageTwo} alt="login page" />
        </Link>
      </div>
      <div className="login-main">
        <Form className="theme-form" onSubmit={(event) => formSubmitHandle(event)}>
          <h4>{SignInToAccount}</h4>
          <p>{"Enter your email & password to login"}</p>
          <FormGroup>
            <Label className="col-form-label">{EmailAddress}</Label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </FormGroup>
          <FormGroup>
            <Label className="col-form-label">{Password}</Label>
            <div className="form-input position-relative">
              <Input
                type={show ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
              <div className="show-hide" onClick={() => setShow(!show)}>
                <span className="show" />
              </div>
            </div>
          </FormGroup>
          <div className="form-group mb-0">
            <div className="checkbox p-0">
              <Input id="checkbox1" type="checkbox" />
              <Label className="text-muted" htmlFor="checkbox1">
                {RememberPassword}
              </Label>
            </div>
            <Link className="link" href="/auth/forgot-password">
              {ForgotPassword}?
            </Link>
            <div className="text-end mt-3">
              <Button type="submit" color="primary" block disabled={loading}>
                {loading ? "Signing In..." : SignIn}
              </Button>
            </div>
          </div>
          <h6 className="text-muted mt-4 or">{OrSignInWith}</h6>
          <UserSocialApp />
          <p className="mt-4 mb-0 text-center">
            {DontHaveAccount}
            <Link className="ms-2" href="/auth/register">
              {CreateAccount}
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
};
export default UserForm;
