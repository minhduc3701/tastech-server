function pendingExpense(accountants, expenses, employee) {
  let text = `Hello! \n\n
    ${employee.firstName} (${
    employee.email
  }) has sent an expense claim for reimbursement as below:
    ${expenses[0]._trip.name}
    ------------------------------------------------`
  expenses.map(expense => {
    text += ` 
      Name of expense:  ${expense.name}
      Expense category: ${expense.category}
      Transaction date: ${expense.transactionDate}
      Amount: ${expense.amount} ${expense.currency}
      Description: ${expense.message}
      --------------------------------------------------
      `
  })
  return {
    to: accountants[0].email,
    cc: accountants.map(e => e.email).splice(1),
    from: `EzBizTrip <${process.env.EMAIL_NO_REPLY}>`,
    subject: `Please review your colleague's expense claim`,
    text
  }
}

module.exports = {
  pendingExpense
}
