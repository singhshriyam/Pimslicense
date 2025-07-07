"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Card, CardHeader, Badge, CardBody, Table, Button, Container } from "reactstrap";

const initialValues = {
  category_id:"",
  name:""
};
const userSchema = Yup.object({
  category_id: Yup.number().required("Please select category "),
  name: Yup.string().required("Please enter Sub Category name"),
 });
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateSubCategory = () => {
  const [subCategory, setSubCategory] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    getSubCategories();
    getCategories();
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
      const filterSubCategories = subCategories.filter((subCategory: any) => subCategory.id !== id);
      setSubCategories(filterSubCategories);
    } catch (error) {}
  }
  });



  };






  const getSubCategories = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/master/sub-categories",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setSubCategories(response.data.data);
      console.log("SubCategories=", subCategories);
    } catch (error) {}
  };
  const getCategories = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/master/categories",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setCategories(response.data.data);
      console.log("categories", categories);
    } catch (error) {}
  };

  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: userSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/master/sub-categories`,
            {
              name: values.name,
              category_id: values.category_id,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getSubCategories();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Sub Category  Created Successfully!",
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
                  <label htmlFor="">Sub Category Name <span className="text-danger">*</span></label>
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
                  <label htmlFor="">Select Category <span className="text-danger">*</span></label>
                  <select
                    className="form-control"
                    name="category_id"
                    value={values.category_id}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <option value="">--Select Category--</option>
                    {categories &&
                      categories.map((category: any) => {
                        return (
                          <>
                            <option value={category.id}>{category.name}</option>
                          </>
                        );
                      })}
                  </select>
                  {errors.category_id && touched.category_id && (
                    <p className="text-danger">{errors.category_id}</p>
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
                  {subCategories.length} SubCategories
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {subCategories.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="table-borderless">
                    <thead className="table-light">
                      <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Category</th>
                <th colSpan={2}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subCategories.map((subCategory:any) => (
                        <tr key={subCategory.id}>
                          <td>
                            <span className="fw-medium text-primary">{subCategory.id}</span>
                          </td>
                          <td>
                           {subCategory.name} 
                          </td>
                         
                          <td>
                            {subCategory.category_name}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              

                                <Link
                          className="btn btn-primary"
                          href={`/admin/sub-category/${subCategory.id}`}
                        >
                         ✎
                        </Link>
                              <Button
                                color="danger"
                                size="sm"
                                title="Reject"
                                onClick={() => handleDelete(subCategory.id)}
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

export default CreateSubCategory;
