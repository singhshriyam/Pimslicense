"use client";
import axios from "axios";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import Link from "next/link";

const initialValues = {
  team_id:"",
  name: "",
};
const roleSchema = Yup.object({
  team_id:Yup.string().required("Please Enter Team Id"),
  name: Yup.string().required("Please enter role name"),
});
const API_BASE_URL = process.env.API_BASE_URL;
const token = localStorage.getItem("authToken");

const createRole=()=> {
  const [role, setRole] = useState([]);
  const[teams,setTeams]=useState([])
  useEffect(() => {
    getRoles();
    getTeams();
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
      const response = axios.delete(
        `https://apexwpc.apextechno.co.uk/api/master/roles/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
     const filterRoles=role.filter((r:any)=>r.id!==id);
     setRole(filterRoles);
    } catch (error) {}
  }
  });



  };
  const getRoles = async () => {
    try {
      const response = await axios.get(
        "https://apexwpc.apextechno.co.uk/api/roles",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token} `,
          },
        }
      );
      setRole(response.data.data);
      console.log("roles", role);
    } catch (error) {}
  };
   const getTeams = async () => {
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
      setTeams(response.data.data);
      console.log("teams", teams);
    } catch (error) {}
  };

  const { values, handleBlur, handleChange, handleSubmit, errors, touched } =
    useFormik({
      initialValues,
      validationSchema: roleSchema,
      onSubmit: async (values) => {
        try {
          const response = await axios.post(
            `https://apexwpc.apextechno.co.uk/api/roles`,
            { name: values.name,team_id:values.team_id },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
            getRoles();
            {values.name=''}
            {values.team_id=''}
            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Role Created Successfully!",
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
          <h1>Add Role</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="">Select Team/Group</label>
                <select className="form-control"
                name="team_id" 
                value={values.team_id}
                onBlur={handleBlur}
                onChange={handleChange}>
                   <option value="">--Select Team--</option>
                  {teams && (
                    teams.map((team:any)=>{
                      return <>
                        <option value={team.id}>{team.name}</option>
                      </>
                    })
                  )
                  }
    
      
        
      </select>
              {errors.team_id && touched.team_id && (
                <p className="text-danger">{errors.team_id}</p>
              )}
            </div>
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
          <h2>All Roles</h2>

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Id</th>
                <th>Team/Group</th>
                <th>Category Name</th>
                <th>Created At</th>
                <th colSpan={2}>Action</th>
              </tr>
            </thead>
            <tbody>
              {role.map((myRole: any) => {
                return (
                  <>
                    <tr>
                      <td>{myRole.id}</td>
                      <td>{myRole.team_id}</td>
                      <td>{myRole.name}</td>
                      <td>{myRole.created_at}</td>
                      <td><Link className="btn btn-primary" href={`/admin/roles/${myRole.id}`}>Edit</Link></td>
                     <td><button className="btn btn-danger" onClick={()=>handleDelete(myRole.id)}>Delete</button></td>
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



export default createRole;