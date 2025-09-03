document.addEventListener('DOMContentLoaded', function() {
    const { jsPDF } = window.jspdf;
    const ctx = document.getElementById('transactionChart').getContext('2d');
    let transactionChart;
    
    // Initialize transactions with time tracking
    let transactions = JSON.parse(localStorage.getItem('mm-transactions')) || {
        mtn: [],
        airtel: [],
        vodafone: []
    };

    // Update current time display
    function updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }
    
    // Set up time updates
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Initialize with sample data if empty
    if (transactions.mtn.length === 0) {
        const now = new Date();
        transactions.mtn.push({
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().substring(0, 5),
            amount: 15, 
            type: 'deposit', 
            phone: '0546643185',
            recipient: '',
            network: 'mtn'
        });
        saveToLocalStorage();
    }

    // DOM Elements
    const txnTypeSelect = document.getElementById('txnType');
    const recipientField = document.getElementById('recipient');
    const timeRangeSelect = document.getElementById('timeRange');

    // Event Listeners
    txnTypeSelect.addEventListener('change', function() {
        recipientField.style.display = this.value === 'transfer' ? 'block' : 'none';
    });

    document.getElementById('transactionForm').addEventListener('submit', addManualTransaction);
    document.getElementById('pdfBtn').addEventListener('click', generatePDFStatement);
    
    document.querySelectorAll('.network-selector button').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.network-selector button').forEach(b => {
                b.classList.remove('active');
                b.style.transform = 'translateY(0)';
                b.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            });
            
            this.classList.add('active');
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 6px 12px rgba(106, 17, 203, 0.3)';
            
            const network = this.dataset.network;
            renderChart(network);
            renderTransactionList(network);
        });
    });

    timeRangeSelect.addEventListener('change', function() {
        const network = document.querySelector('.network-selector button.active').dataset.network;
        renderChart(network);
    });

    // Initial render
    renderChart('mtn');
    renderTransactionList('mtn');

    // Core Functions
    function renderChart(network) {
        const data = filterByDateRange(transactions[network]);
        const grouped = groupTransactionsByDate(data);
        const dates = Object.keys(grouped).sort();
        
        if (transactionChart) {
            transactionChart.data.labels = dates;
            transactionChart.data.datasets.forEach((dataset, i) => {
                if (i === 0) dataset.data = dates.map(date => grouped[date].deposits || 0);
                if (i === 1) dataset.data = dates.map(date => grouped[date].withdrawals || 0);
                if (i === 2) dataset.data = dates.map(date => grouped[date].airtime || 0);
                if (i === 3) dataset.data = dates.map(date => grouped[date].transfer || 0);
                if (i === 4) dataset.data = dates.map(date => grouped[date].payment || 0);
            });
            transactionChart.update();
        } else {
            transactionChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Deposits',
                            data: dates.map(date => grouped[date].deposits || 0),
                            backgroundColor: '#00c853',
                            borderRadius: 6,
                            borderSkipped: false
                        },
                        {
                            label: 'Withdrawals',
                            data: dates.map(date => grouped[date].withdrawals || 0),
                            backgroundColor: '#ff3d00',
                            borderRadius: 6,
                            borderSkipped: false
                        },
                        {
                            label: 'Airtime',
                            data: dates.map(date => grouped[date].airtime || 0),
                            backgroundColor: '#ffab00',
                            borderRadius: 6,
                            borderSkipped: false
                        },
                        {
                            label: 'Transfers',
                            data: dates.map(date => grouped[date].transfer || 0),
                            backgroundColor: '#6200ea',
                            borderRadius: 6,
                            borderSkipped: false
                        },
                        {
                            label: 'Payments',
                            data: dates.map(date => grouped[date].payment || 0),
                            backgroundColor: '#0091ea',
                            borderRadius: 6,
                            borderSkipped: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${network.toUpperCase()} Transactions (GHS)`,
                            color: '#ffffff',
                            font: {
                                size: 16,
                                weight: '600'
                            }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                font: {
                                    size: 12
                                },
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#333',
                            borderWidth: 1,
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#b0b0b0'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#b0b0b0',
                                callback: function(value) {
                                    return 'GHS ' + value;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function renderTransactionList(network) {
        const list = document.getElementById('transactions');
        const data = filterByDateRange(transactions[network]);
        
        list.innerHTML = data
            .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
            .reverse()
            .map(t => `
                <div class="transaction">
                    <div class="txn-details">
                        <span class="txn-date">${formatDate(t.date)}</span>
                        <span class="txn-time">${t.time}</span>
                    </div>
                    <span class="${t.type === 'deposit' ? 'credit' : 'debit'}">
                        ${t.type === 'deposit' ? '+' : '-'}GHS${t.amount.toFixed(2)}
                        ${t.recipient ? `→ ${t.recipient}` : ''}
                    </span>
                    <span class="txn-phone">${t.phone || ''}</span>
                </div>
            `).join('');
    }

    function addManualTransaction(e) {
        e.preventDefault();
        
        const form = e.target;
        const network = document.getElementById('network').value;
        const txnType = document.getElementById('txnType').value;
        const now = new Date();
        
        const newTxn = {
            date: document.getElementById('txnDate').value || now.toISOString().split('T')[0],
            time: document.getElementById('txnTime').value || now.toTimeString().substring(0, 5),
            amount: parseFloat(document.getElementById('amount').value),
            type: txnType,
            phone: document.getElementById('phoneNumber').value,
            recipient: txnType === 'transfer' ? document.getElementById('recipient').value : '',
            network: network
        };
        
        // Add animation feedback
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        submitBtn.style.backgroundColor = '#00c853';
        
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Transaction';
            submitBtn.style.backgroundColor = '';
        }, 1500);
        
        transactions[network].push(newTxn);
        saveToLocalStorage();
        renderChart(network);
        renderTransactionList(network);
        form.reset();
        recipientField.style.display = 'none';
    }

    function generatePDFStatement() {
        const network = getCurrentNetwork();
        const data = transactions[network].sort((a, b) => 
            new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
        ).reverse();
        
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor('#6a11cb');
        doc.text(`${network.toUpperCase()} Transaction Statement`, 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor('#666');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-GH')} at ${new Date().toLocaleTimeString('en-GH')}`, 105, 22, { align: 'center' });
        
        // Transaction Table
        const headers = [["Date", "Time", "Type", "Amount (GHS)", "From", "To"]];
        const txnData = data.map(t => [
            formatDate(t.date),
            t.time,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            (t.type === 'deposit' ? '+' : '-') + t.amount.toFixed(2),
            t.phone,
            t.recipient || 'N/A'
        ]);
        
        doc.autoTable({
            head: headers,
            body: txnData,
            startY: 30,
            styles: {
                cellPadding: 5,
                fontSize: 10,
                valign: 'middle',
                textColor: '#333'
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 20 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 'auto' },
                5: { cellWidth: 'auto' }
            },
            headStyles: {
                fillColor: '#6a11cb',
                textColor: '#ffffff',
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: '#f5f5f5'
            },
            didDrawPage: function(data) {
                doc.setFontSize(10);
                doc.setTextColor('#999');
                doc.text("© 2025 Mobile Money Tracker | Developed by Bannor Hudson Basah", 
                    data.settings.margin.left, 
                    doc.internal.pageSize.height - 10
                );
            }
        });
        
        // Save PDF
        doc.save(`${network}_statement_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // Helper Functions
    function getCurrentNetwork() {
        return document.querySelector('.network-selector button.active').dataset.network;
    }

    function filterByDateRange(txns) {
        const range = document.getElementById('timeRange').value;
        const now = new Date();
        let cutoffDate = new Date();
        
        if (range === '7days') cutoffDate.setDate(now.getDate() - 7);
        else if (range === '30days') cutoffDate.setDate(now.getDate() - 30);
        else if (range === 'today') {
            const today = now.toISOString().split('T')[0];
            return txns.filter(t => t.date === today);
        }
        else return txns;
        
        return txns.filter(t => new Date(t.date) >= cutoffDate);
    }

    function groupTransactionsByDate(txns) {
        return txns.reduce((acc, curr) => {
            if (!acc[curr.date]) acc[curr.date] = { 
                deposits: 0, 
                withdrawals: 0, 
                airtime: 0, 
                transfer: 0,
                payment: 0
            };
            
            if (curr.type === 'deposit') acc[curr.date].deposits += curr.amount;
            else if (curr.type === 'withdrawal') acc[curr.date].withdrawals += curr.amount;
            else if (curr.type === 'airtime') acc[curr.date].airtime += curr.amount;
            else if (curr.type === 'transfer') acc[curr.date].transfer += curr.amount;
            else if (curr.type === 'payment') acc[curr.date].payment += curr.amount;
            
            return acc;
        }, {});
    }

    function formatDate(dateStr) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-GH', options);
    }

    function saveToLocalStorage() {
        localStorage.setItem('mm-transactions', JSON.stringify(transactions));
    }
});




