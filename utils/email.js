const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.fullName.split(" ")[0];
    this.url = url;
    this.from = `Shopkart <${process.env.EMAIL_FROM}>`;
  }

  // 1) Create a transporter - service that actually sends email
  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    });
  }

  async send(template, subject) {
    // Send the actual mail

    // 1) Render the template
    const html = pug.renderFile(`${__dirname}/../email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //  2) Define the mail Options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    //  3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Shopkart Family", "v"); // (Pug template, Subject Line)
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};
