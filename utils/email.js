const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url
    this.from = `JASON $$$ <${process.env.EMAIL_FROM}>`
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return 1
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }

  send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    })

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    }
  }

  sendWelcome() {
    this.send('welcome', 'Welcome to the Naturous Family!')
  }
}

const sendEmail = async options => {
  // create transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "3d43b3110f7e8f",
      pass: "d662a6b41666bc",
    },
  })

  // define email options


  // send email with nodemailer 
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail