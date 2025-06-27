'use client'
import CategoryData from "@/Components/Miscellaneous/Knowledgebase/CategoryData/CategoryData";
import axios from "axios";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import Swal from "sweetalert2";

type CategoryType = {
  id: number,
  name: string
  created_at?: string,
  updated_at?: string,
  deleted_at?: string
}
  const token = localStorage.getItem("authToken");
  
const Category =  ({ params }: { params: { id: string } }) => {
  
const [category, setCategory] = useState<CategoryType | null>()
const [name,setName]=useState({name:''})
  const id = params.id;
  console.log("id=", id)
  useEffect(() => {
    if (id) {
      
     fetchCategory();
     setName({name:category?category.name:""})
    }
    document.title=id
  },[id]);

  const fetchCategory = async () => {

  
    const response = await axios.get(
      `https://apexwpc.apextechno.co.uk/api/master/categories/${id}`,

      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
      }
    )
   
    setCategory(response.data.data)
    setName({name:response.data.data.name})

  }
  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default browser form submission
        console.log('Form data:', name);
        try {
          const response = await axios.put(
            `https://apexwpc.apextechno.co.uk/api/master/categories/${id}`,
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
              text: "Category edited Successfully!",
            }).then((result) => {
      if (result.isConfirmed) {
        redirect('/admin/roles/create-role'); // Redirect to /dashboard on confirmation
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
                  <h1>Edit Category</h1>
                 </CardHeader>
                 <CardBody>
               {category &&(
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

export default Category;

