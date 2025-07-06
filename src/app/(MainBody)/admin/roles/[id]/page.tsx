"use client";
import CategoryData from "@/Components/Miscellaneous/Knowledgebase/CategoryData/CategoryData";
import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";


type RoleType = {
  id: number;
  name: string;
  team_id: any;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};
const token = localStorage.getItem("authToken");
const Role = ({ params }: { params: { id: string } }) => {
  const [role, setRole] = useState<RoleType | null>();
  const [name, setName] = useState({ name: "" });
  const [teamId, setTeamId] = useState({ team_id: "" });
  const [teams, setTeams] = useState([]);
  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchRole();
      // setName({ name: role ? role.name : "" });
      getTeams();
    }
    document.title = id;
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

  const fetchRole = async () => {
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/roles/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
    console.log("team_d=", response.data.data.team_id);
    setRole(response.data.data);
    setName({ name: response.data.data.name });
    setTeamId({ team_id: response.data.data.team_id });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", name);
    try {
      const response = await axios.put(
        `https://apexwpc.apextechno.co.uk/api/roles/${id}`,
        { name: name.name, team_id: teamId.team_id },
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
            redirect("/admin/roles/create-role"); // Redirect to /dashboard on confirmation
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName({ ...name, [e.target.name]: e.target.value });
    setTeamId({ ...teamId, [e.target.name]: e.target.value });
  };
  const handleChange1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTeamId({ ...teamId, [e.target.name]: e.target.value });
  };
  return (
    <>
      <Container fluid>
        {/* Welcome Header */}
        <br />
        {/* Pending Approvals */}
        <Row>
          <Col xs={6}>
            <Card>
              <CardHeader>
                <h1>Edit Role {teamId.team_id}</h1>
              </CardHeader>
              <CardBody>
                {role && (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="">Select Team/Group</label>
                      <select
                        className="form-control"
                        name="team_id"
                        value={teamId.team_id}
                        onChange={handleChange1}
                      >
                        <option value="">--Select Team--</option>
                        {teams &&
                          teams.map((team: any) => {
                            return (
                              <>
                                {team.id === teamId.team_id && (
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
                    <div className="form-group">
                      <label htmlFor="">Role Name</label>
                      <input
                        className="form-control"
                        type="text"
                        name="name"
                        value={name.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <br />
                    <button className="btn btn-primary">Submit</button>
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

export default Role;
