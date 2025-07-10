"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";

const initialValues = {
  name: "",
};
const categorySchema = Yup.object({
  name: Yup.string().required("Please enter category name"),
});
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const CreateTeam=()=> {
  const [permission, setPermission] = useState([]);
  useEffect(() => {
    getPermissions();
  }, []);

  const handleDelete=async(id:number)=>{
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
        `https://apexwpc.apextechno.co.uk/api/teams/${id}`,

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
     const filterPermission=permission.filter((per:any)=>per.id!==id);
     setPermission(filterPermission);
    } catch (error) {}
   }
  });
  };

  const getPermissions = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/teams",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setPermission(response.data.data);
      console.log("permission", permission);
    } catch (error) {}
  };
  console.log(`${API_BASE_URL}/master/categories`);
  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: categorySchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/teams`,
            { name: values.name },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getPermissions();
            {values.name=''}
            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Category Created Successfully!",
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
      <div className="container">
        <div className="col-md-6">
          <h3>Add Permission</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="">Name</label>
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
            <br />
            <button className="btn btn-primary" type="submit">
              Submit
            </button>
          </form>
          <br />
        </div>
        <div className="col-md-12">
          <h2>All Permissions</h2>

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
                <th>Permission Name</th>
                <th>Created At</th>
                <th colSpan={2}>Action</th>
              </tr>
            </thead>
            <tbody>
              {permission.map((per: any) => {
                return (
                  <>
                    <tr>
                      <td>{per.id}</td>
                      <td>{per.name}</td>
                      <td>{per.created_at}</td>
                      <td><Link className="btn btn-primary" href={`/admin/teams/${per.id}`}>Edit</Link></td>
                     <td><button className="btn btn-danger" onClick={()=>handleDelete(per.id)}>Delete</button></td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}



export default CreateTeam;