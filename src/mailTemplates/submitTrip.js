function submitTrip(user) {
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your trip request has been submitted`,
    html: `<style>div { color:red; }</style> <div>Well done,  ${
      user.firstName
    }! \n\n
      Your trip request has been submitted successfully. Our system shall let you know immediately once the your request is approved or not. </div>
      `
  }
}

module.exports = {
  submitTrip
}
