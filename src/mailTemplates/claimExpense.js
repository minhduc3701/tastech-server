function claimExpense(user) {
  return {
    to: user.email,
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Your Expense Claim has been submitted`,
    text: `Well done,  ${user.firstName}! \n\n
      Your expense claim has been sent to your accounting department successfully. 
      Please wait for their process.
      In the mean time, you can check the status any time.
      `
  }
}

module.exports = {
  claimExpense
}
