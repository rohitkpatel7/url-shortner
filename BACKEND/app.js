import express from "express";
import { nanoid } from "nanoid";
import dotenv from "dotenv"
import connectDB from "./src/config/monogo.config.js"
import short_url from "./src/routes/short_url.route.js";
dotenv.config("./.env")
import urlSchema from "./src/models/short_url.model.js"

const app=express();
 
app.use(express.json()) 
app.use(express.urlencoded({extended:true}))


app.post("/api/create",short_url)

app.get("/:id",async(req,res)=>{
  const {id} = req.params
  const url = await urlSchema.findOne({short_url:id})
  if(url){
    res.redirect(url.full_url)
  }else{
    res.status(404).send("Not Found")
  }
})

app.listen(5500,()=>{
    connectDB()
  console.log("Server is running on port http://localhost:5500");
})


//GET - REDIRECTION


//POST-CREATE SHORTURL
