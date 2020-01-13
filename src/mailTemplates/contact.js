function contact(data) {
  return {
    to: process.env.EMAIL_CONTACT,
    from: `${process.env.EMAIL_CONTACT_ALIAS} | Contact Form <${
      process.env.EMAIL_NO_REPLY
    }>`,
    subject: `New message from: ${data.email}`,
    text: `You receiced new message! \n\nFirst name: ${
      data.firstName
    } \n\nLast name: ${data.lastName} \n\nEmail: ${
      data.email
    } \n\nPhone number: ${data.phone} \n\nMessage: ${data.message} \n\n
      `
  }
}
module.exports = {
  contact
}
