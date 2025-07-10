"use client";

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type SiteType = {

  id: number,
        site_type_id?: number,
        site_type: {
            id?: number,
            name: string,
            deleted_at: string,
            created_at: string,
            updated_at: string
        },
        status: string
        catchment: string,
        notes: string,
        premises: string,
        street: string,
        locality: string,
        post_town: string,
        country: string,
        post_code: string,
        easting: string,
        created_at: string,
        updated_at: string
};

const token = localStorage.getItem("authToken");
const EditSite = ({ params }: { params: { id: string } }) => {
  const [site, setSite] = useState<SiteType | null>();
 const [formData, setFormData]  = useState<SiteType>();
 const [siteTypes, setSiteTypes]= useState([]);
  
 
  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchSite();
      // setName({ name: role ? role.name : "" });
     getSiteTypes()
    }
    document.title = `Edit Asset Aisle ${id}`;
  }, [id]);


  const getSiteTypes = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/master/site-types",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setSiteTypes(response.data.data);
    } catch (error) {}
  };

  const fetchSite = async () => {
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/master/sites/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
  
    setSite(response.data.data);
    setFormData(response.data.data);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.put(
        `https://apexwpc.apextechno.co.uk/api/master/sites/${id}`,
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
            redirect("/admin/site/create-site"); // Redirect to /dashboard on confirmation
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
                <h5>Edit Asset Aisle</h5>
               
              </div>
            </CardHeader>
              <CardBody>
                {site && (
                   <form onSubmit={handleSubmit}>
                  <div className="row">
                     <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                          Select Site Type{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          name="site_type_id"
                          value={formData?.site_type_id}
                       
                          onChange={handleChange}
                        >
                          <option value="">--Select Site Type--</option>
                          {siteTypes &&
                            siteTypes.map((siteType: any) => {
                              return (
                                <>
                                  <option value={siteType.id}>
                                    {siteType.name}
                                  </option>
                                </>
                              );
                            })}
                        </select>
                       
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Status{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="status"
                          value={formData?.status}
                       
                          onChange={handleChange}
                        />
                     
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Catchment{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="catchment"
                          value={formData?.catchment}
                       
                          onChange={handleChange}
                        />
                       
                      </div>
                    </div>
                     <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                      Notes{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="notes"
                          value={formData?.notes}
                       
                          onChange={handleChange}
                        />
                       
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Premises {" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="premises"
                          value={formData?.premises}
                       
                          onChange={handleChange}
                        />
                      
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                      Street{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="street"
                          value={formData?.street}
                       
                          onChange={handleChange}
                        />
                       
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Locality{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="locality"
                          value={formData?.locality}
                       
                          onChange={handleChange}
                        />
                       
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Post Town{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="post_town"
                          value={formData?.post_town}
                       
                          onChange={handleChange}
                        />
                      
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Country{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="country"
                          value={formData?.country}
                       
                          onChange={handleChange}
                        />
                      
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Post Code{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="post_code"
                          value={formData?.post_code}
                       
                          onChange={handleChange}
                        />
                       
                      </div>
                    </div>
                      <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                       Easting{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="easting"
                          value={formData?.easting}
                       
                          onChange={handleChange}
                        />
                       
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

export default EditSite;
