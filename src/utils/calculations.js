export function calculateTotals(data) {
    const totals = {
      totalIncome: 0,
      totalCOGS: 0,
      totalGrossProfit: 0,
      totalExpense: 0,
      totalNetIncome: 0,
    };
  
    data.forEach((row) => {
      totals.totalIncome += parseFloat(row['Total Income']) || 0;
      totals.totalCOGS += parseFloat(row['Total COGS']) || 0;
      totals.totalGrossProfit += parseFloat(row['Gross Profit']) || 0;
      totals.totalExpense += parseFloat(row['Total Expense']) || 0;
      totals.totalNetIncome += parseFloat(row['Net Income']) || 0;
    });
  
    return totals;
  }
  
  export function calculateProjections(data, months = 6) {
    const lastMonth = data[data.length - 1];
    const projections = [];
  
    for (let i = 1; i <= months; i++) {
      const projectedMonth = {
        Month: `Projected ${i}`,
        'Total Income': (parseFloat(lastMonth['Total Income']) * 1.05).toFixed(2),
        'Total COGS': (parseFloat(lastMonth['Total COGS']) * 1.03).toFixed(2),
        'Gross Profit': (parseFloat(lastMonth['Gross Profit']) * 1.07).toFixed(2),
        'Total Expense': (parseFloat(lastMonth['Total Expense']) * 1.02).toFixed(2),
        'Net Income': (parseFloat(lastMonth['Net Income']) * 1.1).toFixed(2),
      };
      projections.push(projectedMonth);
    }
  
    return projections;
  }
  
  export function calculateKPIs(data) {
    const totals = calculateTotals(data);
    
    const kpis = {
      grossProfitMargin: (totals.totalGrossProfit / totals.totalIncome * 100).toFixed(2),
      netProfitMargin: (totals.totalNetIncome / totals.totalIncome * 100).toFixed(2),
      operatingExpenseRatio: (totals.totalExpense / totals.totalIncome * 100).toFixed(2),
      revenueGrowthRate: calculateRevenueGrowthRate(data),
    };
  
    return kpis;
  }
  
  function calculateRevenueGrowthRate(data) {
    if (data.length < 2) return 0;
    
    const oldestRevenue = parseFloat(data[0]['Total Income']);
    const newestRevenue = parseFloat(data[data.length - 1]['Total Income']);
    
    return ((newestRevenue - oldestRevenue) / oldestRevenue * 100).toFixed(2);
  }