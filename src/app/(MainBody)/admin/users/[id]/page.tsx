"use client";

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type UserType = {
  id?: number;
  team_id: number;
  name: string;
  last_name: string;
  email: string;
  email_verified_at?: string;
  mobile?: string;
  address: string;
  postcode: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

const token = localStorage.getItem("authToken");
const User = ({ params }: { params: { id: string } }) => {
  const [user, setUser] = useState<UserType | null>();
  const [formData, setFormData] = useState<UserType>();
  // const [name, setName] = useState({ name: "" });
  // const [teamId, setTeamId] = useState({ team_id: "" });
  const [teams, setTeams] = useState([]);
  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchUser();
      // setName({ name: role ? role.name : "" });
      getTeams();
    }
    document.title = `Edit User ${id}`;
  }, [id]);

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

  const fetchUser = async () => {
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/users/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
  
    setUser(response.data.data);
    setFormData(response.data.data);
    // setName({ name: response.data.data.name });
    // setTeamId({ team_id: response.data.data.team_id });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.put(
        `https://apexwpc.apextechno.co.uk/api/users/${id}`,
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
            redirect("/admin/users/create-user"); // Redirect to /dashboard on confirmation
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
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };
  return (
    <>
      <Container fluid>
        {/* Welcome Header */}
        <br />
        {/* Pending Approvals */}
        <Row>
          <Col xs={12}>
            <Card>
               <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <h5>Edit User</h5>
               
              </div>
            </CardHeader>
              <CardBody>
                {user && (
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                            Name <span className="text-danger">*</span>
                          </label>
                          <input
                            className="form-control"
                            type="text"
                            name="name"
                            value={formData?.name}
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
                      <div className="col-md-4">
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
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                            Select Team/Group{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="team_id"
                            value={formData?.team_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">--Select Team--</option>
                            {teams &&
                              teams.map((team: any) => {
                                return (
                                  <>
                                    {team.id === user.team_id && (
                                      <option value={team.id} selected>
                                        {team.name}
                                      </option>
                                    )}
                                    <option value={team.id}>{team.name}</option>
                                  </>
                                );
                              })}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-4"></div>
                      <div className="col-md-4">
                        <br />

                        <button className="btn btn-primary" type="submit">
                          Submit
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default User;
