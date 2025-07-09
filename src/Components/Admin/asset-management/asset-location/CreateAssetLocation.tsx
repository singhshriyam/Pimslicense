"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Card, CardHeader, Badge, CardBody, Table, Button, Container } from "reactstrap";

const initialValues = {
    address:"",
    lat:"",
    lng:""
};
const AssetLocationSchema = Yup.object({

  address: Yup.string().required("Please enter address"),
 });
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateAssetLocation = () => {

  const [assetLocations, setAssetLocations] = useState([]);
 
  useEffect(() => {
    getAssetLocations();
   
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
        `https://apexwpc.apextechno.co.uk/api/asset/asset-location/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      const filterAssetLocation = assetLocations.filter((location: any) => location.id !== id);
      setAssetLocations(filterAssetLocation);
    } catch (error) {}
  }
  });



  };






  const getAssetLocations = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-location",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetLocations(response.data.data);
     
    } catch (error) {}
  };


  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: AssetLocationSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/asset/asset-location`,
            {
              address: values.address,
              lat:values.lat,
              lng:values.lng
             },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
           getAssetLocations();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Asset Location  Created Successfully!",
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
              <div className="col-md-3">
                <div className="form-group">
                  <label htmlFor="">Address <span className="text-danger">*</span></label>
                  <input
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
               <div className="col-md-3">
                <div className="form-group">
                  <label htmlFor="">Lattitude</label>
                  <input
                    className="form-control"
                    name="lat"
                    value={values.lat}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.lat && touched.lat && (
                    <p className="text-danger">{errors.lat}</p>
                  )}
                </div>
              </div>
                <div className="col-md-3">
                <div className="form-group">
                  <label htmlFor="">Longitude</label>
                  <input
                    className="form-control"
                    name="lng"
                    value={values.lng}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.lng && touched.lng && (
                    <p className="text-danger">{errors.lng}</p>
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
                <h5>Asset State</h5>
                <Badge color="danger" className="fs-6">
                  {assetLocations.length} Asset State
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {assetLocations.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                <th>Id</th>
                <th>Address</th>
                <th>Lattitude</th>
                <th>Longitude</th>
                <th colSpan={2}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetLocations.map((location:any) => (
                        <tr key={location.id}>
                          <td>
                            <span className="fw-medium text-primary">{location.id}</span>
                          </td>
                          <td>
                           {location['address']} 
                          </td>
                         
                          <td>
                            {location.lat}
                          </td>
                           <td>
                            {location.lng}
                          </td>
                          <td>
                            Action
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              

                                <Link
                          className="btn btn-primary"
                          href={`/admin/asset-location/${location.id}`}
                        >
                         ✎
                        </Link>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleDelete(location.id)}
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
                  <p className="text-muted mb-0">No Asset Locations</p>
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

export default CreateAssetLocation;
