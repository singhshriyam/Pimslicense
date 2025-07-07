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
const userSchema = Yup.object({

  name: Yup.string().required("Please enter Contact Type"),
 });
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateContactType = () => {

  const [contactTypes, setContactTypes] = useState([]);
 
  useEffect(() => {
    getContactTypes();
   
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
        `https://apexwpc.apextechno.co.uk/api/master/sub-categories/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      const filterContactTypes = contactTypes.filter((contactType: any) => contactType.id !== id);
      setContactTypes(filterContactTypes);
    } catch (error) {}
  }
  });



  };






  const getContactTypes = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/master/contact-types",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setContactTypes(response.data.data);
      console.log("Contact Types=", contactTypes);
    } catch (error) {}
  };


  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: userSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/master/contact-types`,
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
           getContactTypes();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Contact Type  Created Successfully!",
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
                  <label htmlFor="">Contact Type Name <span className="text-danger">*</span></label>
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
                <h5>Contact Types</h5>
                <Badge color="danger" className="fs-6">
                  {contactTypes.length} Contact Types
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {contactTypes.length > 0 ? (
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
                      {contactTypes.map((contactType:any) => (
                        <tr key={contactType.id}>
                          <td>
                            <span className="fw-medium text-primary">{contactType.id}</span>
                          </td>
                          <td>
                           {contactType.name} 
                          </td>
                         
                          <td>
                            {contactType.category_name}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              

                                <Link
                          className="btn btn-primary"
                          href={`/admin/contact-type/${contactType.id}`}
                        >
                         ✎
                        </Link>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleDelete(contactType.id)}
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

export default CreateContactType;
