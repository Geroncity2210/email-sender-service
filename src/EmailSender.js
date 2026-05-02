class EmailSender {
  _transporter;

  constructor({ service, user, pass }) {
    const nodemailer = require("nodemailer");

    this._transporter = nodemailer.createTransport({
      service: service,
      auth: {
        user: user,
        pass: pass
      },
    });

  }
  async verify_connection() {
    try {
      await this._transporter.verify();
      console.log("Server is ready to take our messages");
      return true;
    } catch (err) {
      console.error("Verification failed:", err);
      return false;
    }
  }

  async send_email(mailOptions) {
    try {
      const info = await this._transporter.sendMail(mailOptions);
      console.log("Email sent succesfully: ", info.response);
      return true;
    } catch (err) {
      console.log("error", err);
      return false;
    }
  }
}

module.exports = EmailSender;