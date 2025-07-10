"use client";

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type AssetCompanyType = {
  id?: number;
  name: string;
    created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

const token = localStorage.getItem("authToken");
const EditAssetCompany = ({ params }: { params: { id: string } }) => {
  const [assetCompany,setAssetCompany] = useState<AssetCompanyType | null>();
  const [formData, setFormData] = useState<AssetCompanyType>();

  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchAssetCompany();
      // setName({ name: role ? role.name : "" });
    
    }
    document.title = `Edit Contact Type ${id}`;
  }, [id]);


 

  const fetchAssetCompany= async () => {
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/asset/asset-company/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
  
    setAssetCompany(response.data.data);
    setFormData(response.data.data);
   
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.put(
        `https://apexwpc.apextechno.co.uk/api/asset/asset-company/${id}`,
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
          text: "Asset State  edited Successfully!",
        }).then((result) => {
          if (result.isConfirmed) {
            redirect("/admin/asset-company/create-asset-company"); // Redirect to /dashboard on confirmation
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
                <h5>Edit Site Type</h5>
               
              </div>
            </CardHeader>
              <CardBody>
                {assetCompany && (
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                        Asset Company Name <span className="text-danger">*</span>
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

export default EditAssetCompany;
