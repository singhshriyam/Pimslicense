"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Row,
  Col,
  Card,
  CardHeader,
  Badge,
  CardBody,
  Table,
  Button,
  Container,
} from "reactstrap";
//id, site_type_id, status, catchment, notes, premises, street, locality, post_town, country, post_code, easting, created_at, updated_at, deleted_at
const initialValues = {
  site_type_id: "",
  status: "",
  catchment: "",
  notes: "",
  premises: "",
  street: "",
  locality: "",
  post_town: "",
  country: "",
  post_code: "",
  easting: "",
};
const siteSchema = Yup.object({
  site_type_id: Yup.number().required("Please select site type "),
  status: Yup.string().required("Please enter status"),
  catchment: Yup.string().required("Please enter catchment "),
  notes: Yup.string().required("Please enter notes"),
  premises: Yup.string().required("Please enter premises"),
  street: Yup.string().required("Please enter street"),
  locality: Yup.string().required("Please enter locality"),
  post_town: Yup.string().required("Please enter  post town"),
  post_code: Yup.string().required("Please enter post code "),
  easting: Yup.string().required("Please enter easting "),
});
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateSite = () => {
  const [site, setSite] = useState([]);
  const [siteTypes, setSiteTypes] = useState([]);
  const [sites, setSites] = useState([]);
  useEffect(() => {
    getSites();
    getSiteTypes();
  }, []);

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          const response = axios.delete(
            `https://apexwpc.apextechno.co.uk/api/master/sites/${id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );
          const filter = sites.filter((s: any) => s.id !== id);
          setSites(filter);
        } catch (error) {}
      }
    });
  };

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

  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: siteSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/master/sites`,
            {
              site_type_id: values.site_type_id,
              status: values.status,
              catchment: values.catchment,
              notes: values.notes,
              premises: values.premises,
              street: values.street,
              locality: values.locality,
              post_town: values.post_town,
              country: values.country,
              post_code: values.post_code,
              easting: values.easting,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getSites();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Site  Created Successfully!",
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
                        <label htmlFor="">
                          Select Site Type{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          name="asset_stock_room_id"
                          value={values.site_type_id}
                          onBlur={handleBlur}
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
                        {errors.site_type_id &&
                          touched.site_type_id && (
                            <p className="text-danger">
                              {errors.site_type_id}
                            </p>
                          )}
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
                          value={values.status}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.status && touched.status && (
                          <p className="text-danger">{errors.status}</p>
                        )}
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
                          value={values.catchment}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.catchment && touched.catchment && (
                          <p className="text-danger">{errors.catchment}</p>
                        )}
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
                          value={values.notes}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.notes && touched.notes && (
                          <p className="text-danger">{errors.notes}</p>
                        )}
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
                          value={values.premises}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.premises && touched.premises&& (
                          <p className="text-danger">{errors.premises}</p>
                        )}
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
                          value={values.street}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.street && touched.street && (
                          <p className="text-danger">{errors.street}</p>
                        )}
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
                          value={values.locality}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.locality && touched.locality && (
                          <p className="text-danger">{errors.locality}</p>
                        )}
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
                          value={values.post_town}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.post_town && touched.post_town && (
                          <p className="text-danger">{errors.post_town}</p>
                        )}
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
                          value={values.country}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.country && touched.country && (
                          <p className="text-danger">{errors.country}</p>
                        )}
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
                          value={values.post_code}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.post_code && touched.post_code && (
                          <p className="text-danger">{errors.post_code}</p>
                        )}
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
                          value={values.easting}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.easting && touched.easting && (
                          <p className="text-danger">{errors.easting}</p>
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
                    {siteTypes.length} assetSubStates
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                {siteTypes.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="table-borderless">
                      <thead className="table-light">
                        <tr>
                          <th>Id</th>
                          <th>locality</th>
                          <th>Asset Stock Room</th>
                          <th colSpan={2}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((site: any) => (
                          <tr key={site.id}>
                            <td>
                              <span className="fw-medium text-primary">
                                {site.id}
                              </span>
                            </td>
                            <td>{site.locality}</td>

                            <td>{site.site_type_id}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link
                                  className="btn btn-primary"
                                  href={`/admin/site/${site.id}`}
                                >
                                  ✎
                                </Link>
                                <Button
                                  color="danger"
                                  size="sm"
                                  title="Reject"
                                  onClick={() => handleDelete(site.id)}
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
                    <p className="text-muted mb-0">No Asset sites </p>
                    <small className="text-muted">
                      All requests have been processed
                    </small>
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

export default CreateSite;
