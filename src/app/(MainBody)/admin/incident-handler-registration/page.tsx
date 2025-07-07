// Enhanced page.tsx for Admin Dashboard - Frontend Only
"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Table,
} from "reactstrap";
import {
  getCurrentUser,
  isAuthenticated,
} from "../../../(MainBody)/services/userService";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");
const formatedDate = (dateStr: string) => {
  const [yyyy, mm, dd, hh, mi] = dateStr.split(/[/:\-T]/);
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
};

type IncidentManagerType={
    first_name:string,
    last_name:string,
    email:string,
    password:string,
    department_id:number,
    designation_id:number,
    mobile?:string,
    address?:string,
    postcode?:string
    manager_id:number


}

type DepartmentType={
    id?:string,
    name:string
}
type DesignationType={
     id:number,
     name:string,
    department_id:number ,
     department_name: string
}

type UserType={
            id:number,
            first_name: string
            last_name?: string,
            email:string,
            mobile?: string,
            address?: string,
            postcode?: string,
            created_at?:string,
            team_id: number,
            team_name:string
}

const IncidentHandlerRegistration = () => {
 
  const [formData, setFormData] = useState<IncidentManagerType>();
   const [departments, setDepartments] = useState<DepartmentType[]>([]);
   const [designations, setDesignations] = useState<DesignationType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const router = useRouter();
  // Load user data on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }
    getDepartments();
  getUsers();
    
  },[]);

 const getUsers = async () => {
    try {
      const response = await axios.get(
        `https://apexwpc.apextechno.co.uk/api/users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );

      setUsers(response.data.data);
      console.log(response);
    } catch (error) {}
  };

  const getDepartments = async () => {
    try {
      const response = await axios.get(
        `https://apexwpc.apextechno.co.uk/api/departments`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );

      setDepartments(response.data.data);
      console.log(response);
    } catch (error) {}
  };

  const getDesignations = async () => {
    try {
      const response = await axios.get(
        `https://apexwpc.apextechno.co.uk/api/designations`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );

      setDesignations(response.data.data);
      console.log(response);
    } catch (error) {}
  };


   const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };
   const departmentChanged = async (e: any) => {
    console.log("department changedevent e=",e.target.value)
    try {
      const response = await axios.get(
        `https://apexwpc.apextechno.co.uk/api/designations-by-department/${e.target.value}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );

      setDesignations(response.data.data);
      console.log("Designations===",response);
    } catch (error) {}
  };
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.post(
        `https://apexwpc.apextechno.co.uk/api/incident-handler/registration`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );

      if (response.status === 200) {
        console.log("Response=", response);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Category edited Successfully!",
        }).then((result) => {
          if (result.isConfirmed) {
            redirect("/admin/incident-manager-registration"); // Redirect to /dashboard on confirmation
          }
        });
      }
    } catch (error: any) {
      console.log("Error=", error.message);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Something went wrong.",
      });
    }
    // Here you would typically send data to an API or perform other actions
  };
  return (
    <Container fluid>
      <Row>
        <Col xs={12}>
          <Card className="mb-4 mt-4">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1">
                    Admin Management -Incident Handler Registration
                  </h4>
                  <p className="text-muted mb-0">
                    Manage system configuration and data
                  </p>
                </div>
                <Button
                  color="outline-secondary"
                  onClick={() => router.push("/dashboard/admin")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Incident Manager Registration</h5>
                {/* <Badge color="danger" className="fs-6">
                  {allIncidents.length} Incidents
                </Badge> */}
              </div>
            </CardHeader>
            <CardBody>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                           First  Name <span className="text-danger">*</span>
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="name"
                            value={formData?.first_name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">Last Name</label>
                          <input
                            className="form-control"
                            name="last_name"
                            value={formData?.last_name}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            className="form-control"
                            name="email"
                            value={formData?.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">Mobile</label>
                          <input
                            type="number"
                            className="form-control"
                            name="mobile"
                            value={formData?.mobile}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">Address</label>
                          <input
                            type="text"
                            className="form-control"
                            name="address"
                            value={formData?.address}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <label htmlFor="">Post Code</label>
                          <input
                            type="number"
                            className="form-control"
                            name="postcode"
                            value={formData?.postcode}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-group">
                          <label htmlFor="">Password</label>
                          <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={formData?.password}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label htmlFor="">
                            Select Department{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="department_id"
                            value={formData?.department_id}
                            onChange={handleChange}
                              onClick={departmentChanged}
                            required
                          >
                            <option value="">--Select Department--</option>
                            {departments &&
                              departments.map((department: any) => {
                                return (
                                  <>
                                   
                                    <option value={department.id}>{department.name}</option>
                                  </>
                                );
                              })}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                         <div className="form-group">
                          <label htmlFor="">
                            Select Designation{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="designation_id"
                            value={formData?.designation_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">--Select Designation--</option>
                            {designations &&
                              designations.map((designation) => {
                                return (
                                  <>
                                   
                                    <option value={designation.id}>{designation.name}</option>
                                  </>
                                );
                              })}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                         <div className="form-group">
                          <label htmlFor="">
                            Select Manager{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="manager_id"
                            value={formData?.manager_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">--Select Manager--</option>
                            {users &&
                              users.map((user) => {
                                if(user.team_id==5)
                                {
return (
                                  <>
                                   
                                    <option value={user.id}>{user.first_name}</option>
                                  </>
                                );
                                }
                                
                              })}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <br />

                        <button className="btn btn-primary" type="submit">
                          Submit
                        </button>
                      </div>
                    </div>
                  </form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default IncidentHandlerRegistration;
