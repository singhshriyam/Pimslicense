"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Card, CardHeader, Badge, CardBody, Table, Button, Container } from "reactstrap";

const initialValues = {
    name:""
};
const AssetStateSchema = Yup.object({

  name: Yup.string().required("Please enter asset state name"),
 });
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateAssetState = () => {

  const [assetStates, setAssetStates] = useState([]);
 
  useEffect(() => {
    getAssetState();
   
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
        `https://apexwpc.apextechno.co.uk/api/asset/asset-state/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      const filterAssetState = assetStates.filter((state: any) => state.id !== id);
      setAssetStates(filterAssetState);
    } catch (error) {}
  }
  });



  };






  const getAssetState = async () => {
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


  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: AssetStateSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/asset/asset-state`,
            {
              name: values.name,
             },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
           getAssetState();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Asset State  Created Successfully!",
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
                  <label htmlFor="">Asset State Name <span className="text-danger">*</span></label>
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
                  {assetStates.length} Asset State
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {assetStates.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                <th>Id</th>
                <th>Name</th>
                <th colSpan={2}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetStates.map((state:any) => (
                        <tr key={state.id}>
                          <td>
                            <span className="fw-medium text-primary">{state.id}</span>
                          </td>
                          <td>
                           {state.name} 
                          </td>
                         
                          <td>
                            {state.category_name}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              

                                <Link
                          className="btn btn-primary"
                          href={`/admin/asset-state/${state.id}`}
                        >
                         ✎
                        </Link>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleDelete(state.id)}
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
                  <p className="text-muted mb-0">No Sub Categories</p>
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

export default CreateAssetState;
