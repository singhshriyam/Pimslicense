'use client'

import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type TeamType = {
  id: number,
  name: string
  created_at?: string,
  updated_at?: string,
 
}
  const token = localStorage.getItem("authToken");
  
const Team =  ({ params }: { params: { id: string } }) => {
  
const [team, setTeam] = useState<TeamType | null>()
const [name,setName]=useState({name:''})
  const id = params.id;
  console.log("id=", id)
  useEffect(() => {
    if (id) {
      
     fetchTeam();
     setName({name:team?team.name:""})
    }
    document.title=id
  },[id]);

  const fetchTeam = async () => {

  
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/teams/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    )
   
    setTeam(response.data.data)
    setName({name:response.data.data.name})

  }
  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default browser form submission
        console.log('Form data:', name);
        try {
          const response = await axios.put(
            `https://apexwpc.apextechno.co.uk/api/teams/${id}`,
            { name: name.name },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token} `,
              },
            }
          );

          if (response.status === 200) {
           ;
            console.log("Response=", response);
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Team edited Successfully!",
            }).then((result) => {
      if (result.isConfirmed) {
        redirect('/admin/teams/create-team'); // Redirect to /dashboard on confirmation
      }
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
        // Here you would typically send data to an API or perform other actions
      };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName({ ...name, [e.target.name]: e.target.value });
      };

  return <>
    <Container fluid>
           {/* Welcome Header */}
  <br/>
           {/* Pending Approvals */}
           <Row >
             <Col xs={6} >
               <Card>
                 <CardHeader>
                  <h1>Edit Team</h1>
                 </CardHeader>
                 <CardBody>
               {team &&(
    <form onSubmit={handleSubmit}>
      <input className="form-control" type="text" name="name" value={name.name} onChange={handleChange} />
     <br/>
      <button className="btn btn-primary">Submit</button>
    </form>)}
                 </CardBody>
               </Card>
             </Col>
           </Row>
         </Container>
 
  </>
}

export default Team;

