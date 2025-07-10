"use client";

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type AssetType = {
  id: number;
  site_id: number;
   asset_state_id?: number,
            asset_sub_state_id?: number,
            asset_function_id?: number,
            asset_class_id?: number,
            asset_location_id?: number,
            asset_department_id?: number,
            asset_company_id?: number,
            asset_stock_room_id?: number,
            asset_aisle_id?: number,
            asset_space_id?: number,
            name: string,
            assigned_to_id?: number,
            managed_by_id?: number,
            owned_by_id?: number,
            parent_id?: number,
            tag: string,
            serial_no: string,
            installed_on: string,
            assigned_to_user_on?: string,
            deleted_at:string,
            created_at:string,
            updated_at:string
};

const token = localStorage.getItem("authToken");
const EditAsset = ({ params }: { params: { id: string } }) => {
  const [asset, setAsset] = useState<AssetType | null>();
  const [formData, setFormData] = useState<AssetType>();
   const [sites, setSites] = useState([]);
 
  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchAsset();
      // setName({ name: role ? role.name : "" });
     getSites()
    }
    document.title = `Edit Asset ${id}`;
  }, [id]);


  const getSites = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/master/sites",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setSites(response.data.data);
     } catch (error) {}
  };
  const fetchAsset = async () => {
    const response = await axios.get(
    `https://apexwpc.apextechno.co.uk/api/master/assets/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
  
    setAsset(response.data.data);
    setFormData(response.data.data);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.put(
         `https://apexwpc.apextechno.co.uk/api/master/assets/${id}`,

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
          text: "Asset edited Successfully!",
        }).then((result) => {
          if (result.isConfirmed) {
            redirect("/admin/asset/create-asset"); // Redirect to /dashboard on confirmation
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
                <h5>Edit Asset</h5>
               
              </div>
            </CardHeader>
              <CardBody>
                {asset && (
                   <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                        Asset Name{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
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
                          Tag{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="tag"
                          value={formData?.tag}
                          
                          onChange={handleChange}
                          required
                        />
                     
                      </div>
                    </div>
                     <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                          Serial No{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="serial_no"
                          value={formData?.serial_no}
                          
                          onChange={handleChange}
                          required
                        />
                       
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                          Installed On{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                        type="datetime"
                          className="form-control"
                          name="installed_on"
                          value={formData?.installed_on}
                          
                          onChange={handleChange}
                          required
                        />
                       
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                          Select Site <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          name="site_id"
                          value={formData?.site_id}
                          
                          onChange={handleChange}
                          required
                        >
                          <option value="">--Select Site--</option>
                          {sites &&
                            sites.map((site: any) => {
                              return (
                                <>
                                  <option value={site.id}>
                                    {site.locality}
                                  </option>
                                </>
                              );
                            })}
                        </select>
                       
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
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EditAsset;
