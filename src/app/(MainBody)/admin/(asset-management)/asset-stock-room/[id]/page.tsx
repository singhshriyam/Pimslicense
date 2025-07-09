"use client";

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type AssetStockRoomType = {
  id?: number;
  name: string;
    created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

const token = localStorage.getItem("authToken");
const EditAssetStockRoom = ({ params }: { params: { id: string } }) => {
  const [assetStockRoom,setAssetStockRoom] = useState<AssetStockRoomType | null>();
  const [formData, setFormData] = useState<AssetStockRoomType>();

  const id = params.id;
  console.log("id=", id);
  useEffect(() => {
    if (id) {
      fetchAssetStockRoom();
      // setName({ name: role ? role.name : "" });
    
    }
    document.title = `Edit Contact Type ${id}`;
  }, [id]);


 

  const fetchAssetStockRoom= async () => {
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/asset/asset-stock-room/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    );
  
    setAssetStockRoom(response.data.data);
    setFormData(response.data.data);
    console.log("contact type=",response.data);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("Form data:", formData);
    try {
      const response = await axios.put(
        `https://apexwpc.apextechno.co.uk/api/asset/asset-stock-room/${id}`,
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
          text: "Asset Stock Room edited Successfully!",
        }).then((result) => {
          if (result.isConfirmed) {
            redirect("/admin/asset-stock-room/create-asset-stock-room"); // Redirect to /dashboard on confirmation
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
                <h5>Edit Asset Stock Room </h5>
               
              </div>
            </CardHeader>
              <CardBody>
                {assetStockRoom && (
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="">
                         Asset Stock Room Name <span className="text-danger">*</span>
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

export default EditAssetStockRoom;
