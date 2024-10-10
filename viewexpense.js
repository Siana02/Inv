// js/expense-chart.js

document.addEventListener('DOMContentLoaded', function () {
    // Sample data for the chart
    const data = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [{
            label: 'Expenses',
            data: [1200, 1900, 3000, 500, 2100, 1500],
            backgroundColor: 'rgba(30, 144, 255, 0.2)', // Light blue background
            borderColor: 'rgba(30, 144, 255, 1)', // Blue border
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(255, 20, 147, 0.2)', // Light pink background on hover                                                                                                                                                                                      hoverBorderColor: 'rgba(255, 20, 147, 1)' // Pink border on hover                                                                                                                                                                                                   }]
    };

    // Create the chart
    const ctx = document.getElementById('expenseChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar', // Change to 'line' or other types if needed
        data: data,
        options: {
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += `$${context.parsed.y}`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
});
