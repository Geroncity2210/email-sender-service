require("dotenv").config();
const runConsumer = require("./kafkaClient");

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



