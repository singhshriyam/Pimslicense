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
import { setUsers } from "@/Redux/Reducers/ContactSlice";

const initialValues = {
  site_id: "",
  asset_state_id: null,
  asset_sub_state_id: null,
  asset_function_id: null,
  asset_class_id: null,
  asset_location_id: null,
  asset_department_id: null,
  asset_company_id: null,
  asset_stock_room_id: null,
  asset_aisle_id: null,
  asset_space_id: null,
  name: "",
  assigned_to_id: null,
  managed_by_id: null,
  owned_by_id: null,
  parent_id: null,
  tag: "",
  serial_no: "",
  installed_on: "",
  assigned_to_user_on: null,
};
const AssetSchema = Yup.object({
  site_id: Yup.number().required("Please Select Site "),
  name: Yup.string().required("Please Asset Name"),
  tag:Yup.string().required("OPlese Enter Tag"),
  serial_no:Yup.string().required("Please Enter Serial No"),
  installed_on:Yup.date().required("Please select install on date")
});
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const AddAsset = () => {
  const [assets, setAssets] = useState([]);

  //dropdowns
  const [sites, setSites] = useState([]);
  const [assetStates, setAssetStates] = useState([]);
  const [assetFunction, setAssetFunctions] = useState([]);
  const [assetClasses, setAssetClasses] = useState([]);
  const [assetLocations, setAssetLocations] = useState([]);
  const [assetDepartments, setAssetDepartments] = useState([]);
  const [assetCompanies, setAssetCompanies] = useState([]);
  const [assetStockRooms, setAssetStockRooms] = useState([]);
  const [assetAisles, setAssetAisles] = useState([]);
  const [assetSpaces, setAssetSpaces] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getAssets();
    getSites();
    getAssetStates();
    getAssetFunctions();
    getAssetClasses();
    getAssetLocations();
    getAssetDepartments();
    getAssetCompanies();
    getAssetStockRooms();
    getAssetAisles();
    // getAssetSpaces();
    getUsers();

   
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
            `https://apexwpc.apextechno.co.uk/api/master/assets/${id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );
          const filterassets = assets.filter(
            (asset: any) => asset.id !== id
          );
          setAssets(filterassets);
        } catch (error) {}
      }
    });
  };

   const getAssets = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/master/assets",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssets(response.data.data);
     } catch (error) {}
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
      setAssetStates(response.data.data);
     } catch (error) {}
  };
    const getAssetFunctions = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-function",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetFunctions(response.data.data);
     } catch (error) {}
  };
     const getAssetClasses = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-class",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetClasses(response.data.data);
     } catch (error) {}
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
      setAssetFunctions(response.data.data);
     } catch (error) {}
  };
   const getAssetDepartments = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-department",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetDepartments(response.data.data);
     } catch (error) {}
  };
     const  getAssetCompanies = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-company",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetCompanies(response.data.data);
     } catch (error) {}
  };
       const  getAssetStockRooms = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/asset/asset-stock-room",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setAssetStockRooms(response.data.data);
     } catch (error) {}
  };
       const    getAssetAisles = async () => {
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
      setAssetAisles(response.data.data);
     } catch (error) {}
  };
//        const  getAssetSpaces = async () => {
//     try {
//       const response = await axios.get(
//         "https://apexwpc.apextechno.co.uk/api/asset/class",
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token} `,
//           },
//         }
//       );
//       setAssetSpaces(response.data.data);
//      } catch (error) {}
//   };
       const  getUsers = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/users",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setUsers(response.data.data);
     } catch (error) {}
  };




  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: AssetSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/master/assets`,
            {
              name: values.name,
              site_id: values.site_id,
              tag:values.tag,
              serial_no:values.serial_no,
              installed_on:values.installed_on
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getAssets();

            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Asset   Created Successfully!",
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
                        Asset Name{" "}
                          <span className="text-danger">*</span>
                        </label>
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
                        <label htmlFor="">
                          Tag{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          className="form-control"
                          name="tag"
                          value={values.tag}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.tag && touched.tag && (
                          <p className="text-danger">{errors.tag}</p>
                        )}
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
                          value={values.serial_no}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.serial_no && touched.serial_no && (
                          <p className="text-danger">{errors.serial_no}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="">
                          Installed On{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                        type="date"
                          className="form-control"
                          name="installed_on"
                          value={values.installed_on}
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                        {errors.installed_on && touched.installed_on && (
                          <p className="text-danger">{errors.installed_on}</p>
                        )}
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
                          value={values.site_id}
                          onBlur={handleBlur}
                          onChange={handleChange}
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
                        {errors.site_id && touched.site_id && (
                          <p className="text-danger">{errors.site_id}</p>
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
                  <h5>Assets</h5>
                  <Badge color="danger" className="fs-6">
                    {assets.length} Assets
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                {assets.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="table-borderless">
                      <thead className="table-light">
                        <tr>
                          <th>Id</th>
                          <th>Name</th>
                          <th>Site</th>
                          <th>Tag</th>
                          <th>Serial No</th>
                          <th>Installed On</th>
                          <th colSpan={2}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((asset: any) => (
                          <tr key={asset.id}>
                            <td>
                              <span className="fw-medium text-primary">
                                {asset.id}
                              </span>
                            </td>
                            <td>{asset.name}</td>

                            <td>{asset.site.locality}</td>
                              <td>{asset.tag}</td>
                                <td>{asset.serial_no}</td>
                                  <td>{asset.installed_on}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link
                                  className="btn btn-primary"
                                  href={`/admin/asset/${asset.id}`}
                                >
                                  ✎
                                </Link>
                                <Button
                                  color="danger"
                                  size="sm"
                                  title="Reject"
                                  onClick={() => handleDelete(asset.id)}
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

export default AddAsset;
