function requestDemo(data) {
  return {
    to: process.env.EMAIL_CONTACT,
    from: `Request Demo - EzBizTrip <${data.email}>`,
    subject: `New request demo from email: ${data.email}`,
    text: `You receiced new request demo! \n\nFirst name: ${
      data.firstName
    } \n\nLast name: ${data.lastName} \n\nEmail: ${
      data.email
    } \n\nPhone number: ${data.phone} \n\nCompany: ${data.company} \n\nRole: ${
      data.role
    } \n\nNumber Of Employees: ${data.numberOfEmployees} \n\nCountry: ${
      data.country
    }`
  }
}

module.exports = {
  requestDemo
}
