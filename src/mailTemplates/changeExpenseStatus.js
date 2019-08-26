function changeExpenseStatus(user, expense) {
  switch (expense.status) {
    case 'approved':
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your trip request has been approved`,
        text: `Congratulation,  ${user.firstName}! \n\n
          A reimbursement payment for your expense has been marked as Paid by your accountant. Detail:
          Trip: ${expense._trip.name}
          Payment date: ${expense.transactionDate}
          Payment amount: ${expense.amount} ${expense.currency}
          `
      }
    case 'rejected':
    default:
      return {
        to: user.email,
        from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
        subject: `Your trip request has been rejected`,
        html: `Dear ${user.firstName}! <br/>
          Your following expense claim was rejected:
          Date incurred: ${Date.now()}
          Trip: ${expense._trip.name}
          Type: ${expense.category}
          Description: ${expense.message}
          Amount:  ${expense.amount} ${expense.currency}
          Accountant comment:  ${expense.adminMessage}
          `
      }
  }
}

module.exports = {
  changeExpenseStatus
}
