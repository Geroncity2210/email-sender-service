require("dotenv").config();
const express = require("express");
const PORT = process.env.API_PORT || 3001;
const runConsumer = require("./kafkaClient");
const app = express();
app.use(express.json());

runConsumer().then(()=>{
  console.log("Kafka consumer running")
})

/* Ignore esto, son pruebas preliminares
app.post("/email/send",async (req,res)=>{

  let {subject, text, addressee} = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: addressee,
    subject,
    text
  }

  let sentStatus = await emailService.send_email(mailOptions);

  console.log("Se envió el correo: ", sentStatus);

  if(sentStatus){
    res.status(200).send({status: "ok", message:"Email sent successfully"})
  }else{
    res.status(400).send({status: "oh my", message:"Email cannot be sent due to parameter errors"});
  }

});
*/

app.get("/check", async (req,res)=>{
  let isConnetionOk = await emailService.verify_connection();
  if (isConnetionOk) res.status(200).send({status: "ok", message:"Server is ready to take our messages"});
  else res.status(200).send({status: "oh my", message:"There was a verification error!"});
})

app.listen(PORT, ()=>{
  console.log(`Listening from port ${PORT}`);
  
})


