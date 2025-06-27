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

const CreateCategory=()=> {
  const [category, setCategory] = useState([]);
  useEffect(() => {
    getCategories();
  }, []);

  const handleDelete=async(id:number)=>{
try {
      const response = await axios.delete(
        `https://apexwpc.apextechno.co.uk/api/master/categories/${id}`,

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
     const filterCategory=category.filter((cat:any)=>cat.id!==id);
     setCategory(filterCategory);
    } catch (error) {}
  }
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
      setCategory(response.data.data);
      console.log("categories", category);
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
            `https://apexwpc.apextechno.co.uk/api/master/categories`,
            { name: values.name },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getCategories();
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
          <h3>Add Category</h3>
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
          <h2>All Categories</h2>

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
                <th>Category Name</th>
                <th>Created At</th>
                <th colSpan={2}>Action</th>
              </tr>
            </thead>
            <tbody>
              {category.map((cat: any) => {
                return (
                  <>
                    <tr>
                      <td>{cat.id}</td>
                      <td>{cat.name}</td>
                      <td>{cat.created_at}</td>
                      <td><Link className="btn btn-primary" href={`/admin/roles/${cat.id}`}>Edit</Link></td>
                     <td><button className="btn btn-danger" onClick={()=>handleDelete(cat.id)}>Delete</button></td>
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



export default CreateCategory;