"use client";

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type AssetSubStateType = {

  id?: number;
  asset_state_id: number;
  name: string;
  asset_state_name: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

const token = localStorage.getItem("authToken");
const User = ({ params }: { params: { id: string } }) => {
  const [assetSubState, setAssetSubState] = useState<AssetSubStateType | null>();
 const [formData, setFormData]  = useState<AssetSubStateType>();
 const [assetStates, setAssetStates]= useState([]);
  // const [name, setName] = useState({ name: "" });
  // const [teamId, setTeamId] = useState({ team_id: "" });
  const [teams, setTeams] = useState([]);
  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchAssetSubState();
      // setName({ name: role ? role.name : "" });
     getCategories()
    }
    document.title = `Edit Asset Sub State ${id}`;
  }, [id]);


  const getCategories = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-state",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetStates(response.data.data);
     
    } catch (error) {}
  };

  const fetchAssetSubState = async () => {
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/asset/asset-sub-state/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
  
    setAssetSubState(response.data.data);
    setFormData(response.data.data);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.put(
        `https://apexwpc.apextechno.co.uk/api/asset/asset-sub-state/${id}`,
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
          text: "Sub Category edited Successfully!",
        }).then((result) => {
          if (result.isConfirmed) {
            redirect("/admin/asset-sub-state/create-asset-sub-state"); // Redirect to /dashboard on confirmation
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
                <h5>Edit Asset Sub State</h5>
               
              </div>
            </CardHeader>
              <CardBody>
                {assetSubState && (
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                           Asset Sub State Name <span className="text-danger">*</span>
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
                          <label htmlFor="">
                           Select Asset State{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-control"
                            name="asset_state_id"
                            value={formData?.asset_state_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">--Select Asset State--</option>
                            {assetStates &&
                              assetStates.map((assetState: any) => {
                                return (
                                  <>
                                    {assetState.id === assetSubState.asset_state_id && (
                                      <option value={assetState.id} selected>
                                        {assetState.name}
                                      </option>
                                    )}
                                    <option value={assetState.id}>{assetState.name}</option>
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
