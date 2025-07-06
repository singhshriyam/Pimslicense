"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Card, CardHeader, Badge, CardBody, Table, Button, Container } from "reactstrap";

const initialValues = {
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  address: "",
  postcode: "",
  team_id: "",
  password: "",
};
const userSchema = Yup.object({
  team_id: Yup.string().required("Please select team / user group"),
  first_name: Yup.string().required("Please enter first name"),
  email: Yup.string().email().required("Plese Enter Email"),
  password: Yup.string().min(6).required("Please enter password"),
});
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateUser = () => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState([]);
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    getUsers();
    getTeams();
  }, []);

  const handleDelete =  (id: number) => {
  
 Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
if (result.isConfirmed) {
    try {
      const response =  axios.delete(
        `https://apexwpc.apextechno.co.uk/api/users/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      const filterUsers = users.filter((u: any) => u.id !== id);
      setUsers(filterUsers);
    } catch (error) {}
  }
  });



  };






  const getUsers = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/users",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setUsers(response.data.data);
      console.log("users=", users);
    } catch (error) {}
  };
  const getTeams = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/teams",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setTeams(response.data.data);
      console.log("teams", teams);
    } catch (error) {}
  };

  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: userSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/users`,
            {
              name: values.first_name,
              last_name: values.last_name,
              email: values.email,
              mobile: values.mobile,
              password: values.password,
              team_id: values.team_id,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getUsers();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "User Created Successfully!",
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
      },
    });

  return (
    <>
        <Container fluid>
        <Row>
               <Col xs={12}>
                 <Card className="mb-4">
                   <CardBody>
      
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">First Name <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    name="first_name"
                    value={values.first_name}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.first_name && touched.first_name && (
                    <p className="text-danger">{errors.first_name}</p>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Last Name</label>
                  <input
                    className="form-control"
                    name="last_name"
                    value={values.last_name}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.last_name && touched.last_name && (
                    <p className="text-danger">{errors.last_name}</p>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Email <span className="text-danger">*</span></label>
                  <input
                    
                    className="form-control"
                    name="email"
                    value={values.email}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.email && touched.email && (
                    <p className="text-danger">{errors.email}</p>
                  )}
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
                    value={values.mobile}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.mobile && touched.mobile && (
                    <p className="text-danger">{errors.mobile}</p>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={values.address}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.address && touched.address && (
                    <p className="text-danger">{errors.address}</p>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Post Code</label>
                  <input
                    type="number"
                    className="form-control"
                    name="postcode"
                    value={values.postcode}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.postcode && touched.postcode && (
                    <p className="text-danger">{errors.postcode}</p>
                  )}
                </div>
              </div>
            
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Select Team/Group <span className="text-danger">*</span></label>
                  <select
                    className="form-control"
                    name="team_id"
                    value={values.team_id}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <option value="">--Select Team--</option>
                    {teams &&
                      teams.map((team: any) => {
                        return (
                          <>
                            <option value={team.id}>{team.name}</option>
                          </>
                        );
                      })}
                  </select>
                  {errors.team_id && touched.team_id && (
                    <p className="text-danger">{errors.team_id}</p>
                  )}
                </div>
              </div>
                <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Password <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={values.password}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.password && touched.password && (
                    <p className="text-danger">{errors.password}</p>
                  )}
                </div>
              </div>
              <div className="col-md-4">
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


         <Row>
        <Col xs={12}>
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Pending Approvals</h5>
                <Badge color="danger" className="fs-6">
                  {users.length} Users
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {users.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Team/Group</th>

                <th colSpan={2}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user:any) => (
                        <tr key={user.id}>
                          <td>
                            <span className="fw-medium text-primary">{user.id}</span>
                          </td>
                          <td>
                           {user.first_name} {user.last_name}
                          </td>
                          <td>{user.email}</td>
                          <td>{user.mobile}</td>
                          <td>
                           {user.address}
                          </td>
                          <td>
                            {user.team}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              

                                <Link
                          className="btn btn-primary"
                          href={`/admin/users/${user.id}`}
                        >
                         ✎
                        </Link>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleDelete(user.id)}
                              >
                                ✗
                              </Button>
                              {/* <Button color="outline-primary" size="sm" title="View Details">
                                View
                              </Button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No pending approvals</p>
                  <small className="text-muted">All requests have been processed</small>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
       
      </Container>
    </>
  );
};

export default CreateUser;
