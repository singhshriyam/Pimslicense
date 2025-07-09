"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Card, CardHeader, Badge, CardBody, Table, Button, Container } from "reactstrap";

const initialValues = {
  asset_stock_room_id:"",
  name:""
};
const assetStateSchema = Yup.object({
  asset_state_id: Yup.number().required("Please select Asset state "),
  name: Yup.string().required("Please enter Asset Sub State name"),
 });
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateAssetAisle = () => {
  const [asstSubState, setAssetSubStae] = useState([]);
  const [assetSubStates, setAssetSubStates] = useState([]);
  const [assetStaes, setAssetStaes] = useState([]);
  useEffect(() => {
    getAssetSubStates();
    getAssetStates();
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
        `https://apexwpc.apextechno.co.uk/api/asset/asset-aisle/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      const filter = assetSubStates.filter((a: any) => a.id !== id);
      setAssetSubStates(filter);
    } catch (error) {}
  }
  });



  };






  const getAssetSubStates = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-aisle",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetSubStates(response.data.data);
   
    } catch (error) {}
  };
  const getAssetStates = async () => {
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
      setAssetStaes(response.data.data);
   
    } catch (error) {}
  };

  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: assetStateSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/asset/asset-aisle`,
            {
              name: values.name,
              asset_stock_room_id: values.asset_stock_room_id,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getAssetSubStates();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Asset Sub State  Created Successfully!",
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
                  <label htmlFor="">Asset Sub State Name <span className="text-danger">*</span></label>
                  <input
                    className="form-control"
                    name="name"
                    value={values.name}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.name && touched.name && (
                    <p className="text-danger">{errors.name}</p>
                  )}
                </div>
              </div>
               <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="">Select Asset State <span className="text-danger">*</span></label>
                  <select
                    className="form-control"
                    name="asset_stock_room_id"
                    value={values.asset_stock_room_id}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <option value="">--Select Category--</option>
                    {assetStaes &&
                      assetStaes.map((assetState: any) => {
                        return (
                          <>
                            <option value={assetState.id}>{assetState.name}</option>
                          </>
                        );
                      })}
                  </select>
                  {errors.asset_stock_room_id && touched.asset_stock_room_id && (
                    <p className="text-danger">{errors.asset_stock_room_id}</p>
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
                  {assetSubStates.length} assetSubStates
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {assetSubStates.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Asset Stock Room</th>
                <th colSpan={2}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetSubStates.map((assetSubState:any) => (
                        <tr key={assetSubState.id}>
                          <td>
                            <span className="fw-medium text-primary">{assetSubState.id}</span>
                          </td>
                          <td>
                           {assetSubState.name} 
                          </td>
                         
                          <td>
                            {assetSubState.asset_stock_room_name}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              

                                <Link
                          className="btn btn-primary"
                          href={`/admin/asset-aisle/${assetSubState.id}`}
                        >
                         ✎
                        </Link>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleDelete(assetSubState.id)}
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
                  <p className="text-muted mb-0">No Asset Sub Assets </p>
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

export default CreateAssetAisle;
