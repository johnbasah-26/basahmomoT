document.addEventListener('DOMContentLoaded', function() {
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const signupForm = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    const signupLinkContainer = document.getElementById('signupLinkContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('mm-logged-in');
            // Optionally, clear other session data here
            loginOverlay.style.display = "flex";
            // Hide main app content and logout button if you have them
            if (typeof mainApp !== "undefined") mainApp.style.display = "none";
            logoutBtn.style.display = "none";
            // Reset forms/views as needed
            loginForm.style.display = "block";
            signupForm.style.display = "none";
            if (signupLinkContainer) signupLinkContainer.style.display = "block";
        };
    }

    // Show signup form
    showSignup.onclick = function(e) {
        e.preventDefault();
        loginForm.style.display = "none";
        signupForm.style.display = "block";
        if (loginError) loginError.style.display = "none";
        if (signupLinkContainer) signupLinkContainer.style.display = "none"; // Hide the link
    };

    // Show login form
    showLogin.onclick = function(e) {
        e.preventDefault();
        signupForm.style.display = "none";
        loginForm.style.display = "block";
        if (signupError) signupError.style.display = "none";
        if (signupLinkContainer) signupLinkContainer.style.display = "block"; // Show the link again
    };

    // Sign Up logic
    signupForm.onsubmit = function(e) {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
    
        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.username === username)) {
            signupError.style.display = "block";
        } else {
            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));
            signupError.style.display = "none";
            signupForm.reset();
            signupSuccessModal.style.display = "flex"; // Show modal
        }
    };

        // ...successful signup modal
    
    const signupSuccessModal = document.getElementById('signupSuccessModal');
    const closeSignupSuccess = document.getElementById('closeSignupSuccess');
    
    // In your signupForm.onsubmit, replace alert with:
    signupSuccessModal.style.display = "flex";
    
    // Hide modal and show login form when OK is clicked
    closeSignupSuccess.onclick = function() {
        signupSuccessModal.style.display = "none";
        signupForm.style.display = "none";
        loginForm.style.display = "block";
    };

    // Login logic
    loginForm.onsubmit = function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.username === username && u.password === password)) {
            loginOverlay.style.display = "none";
        } else {
            if (loginError) loginError.style.display = "block";
        }
    };
        // After successful login
    loginOverlay.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
});

// Main application logic
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

    if (!localStorage.getItem('mm-transactions')) {
        localStorage.setItem('mm-transactions', JSON.stringify({
            mtn: [
                {
                    type: "Deposit",
                    amount: "0",
                    phone: "0000000000",
                    clientName: "Sample",
                    date: "2025-01-01",
                    time: "00:00",
                    network: "mtn"
                }
            ],
            airtel: [],
            vodafone: []
        }));
    }

    const logoutModal = document.getElementById('logoutModal');
    const confirmLogoutYes = document.getElementById('confirmLogoutYes');
    const confirmLogoutNo = document.getElementById('confirmLogoutNo');
    
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            logoutModal.style.display = "flex";
        };
    }
    
    if (confirmLogoutYes) {
        confirmLogoutYes.onclick = function() {
            localStorage.removeItem('mm-logged-in');
            logoutModal.style.display = "none";
            loginOverlay.style.display = "flex";
            if (typeof mainApp !== "undefined") mainApp.style.display = "none";
            logoutBtn.style.display = "none";
            loginForm.style.display = "block";
            signupForm.style.display = "none";
            if (signupLinkContainer) signupLinkContainer.style.display = "block";
        };
    }
    
    if (confirmLogoutNo) {
        confirmLogoutNo.onclick = function() {
            logoutModal.style.display = "none";
        };
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
            renderTransactions(network);
        });
    });

    timeRangeSelect.addEventListener('change', function() {
        const network = document.querySelector('.network-selector button.active').dataset.network;
        renderChart(network);
    });

    // Initial render
    renderChart('mtn');
    renderTransactions('mtn');

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
                            text: `${network.toUpperCase()} Transactions (GH₵)`,
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
                                    return 'GH₵ ' + value;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Render all transactions
      function renderTransactions() {
        const transactionsDiv = document.getElementById('transactions');
        // Use the correct key:
        let allNetworks = JSON.parse(localStorage.getItem('mm-transactions')) || { mtn: [], airtel: [], vodafone: [] };
        // Combine all transactions from all networks:
        let transactions = [...allNetworks.mtn, ...allNetworks.airtel, ...allNetworks.vodafone];
        transactionsDiv.innerHTML = '';
    
        if (transactions.length === 0) {
            transactionsDiv.innerHTML = '<p>No transactions yet.</p>';
            return;
        }
    
        const list = document.createElement('ul');
        list.style.listStyle = 'none';
        list.style.padding = '0';
    
        transactions.forEach((txn, idx) => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.7em';
            li.style.background = 'transparent';
            li.style.padding = '0.7em';
            li.style.borderRadius = '6px';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
    
            li.innerHTML = `
                <span>
                    <strong>${txn.type}</strong> | 
                    GH₵${txn.amount} | 
                    ${txn.phone} | 
                    ${txn.recipient || txn.clientName || ''} | 
                    ${txn.date} ${txn.time} | 
                    ${txn.network}
                </span>
                <button class="delete-txn-btn" data-idx="${idx}" style="color:#fff; background:#0f23da; border:none; border-radius:4px; padding:0.2em 1em; cursor:pointer;">
                    Delete
                </button>
            `;
            list.appendChild(li);
        });
    
        transactionsDiv.appendChild(list);
    
        // Attach delete event listeners
        document.querySelectorAll('.delete-txn-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-idx'));
                deleteTransaction(idx);
            };
        });
    }
    
    function deleteTransaction(idx) {
        let allNetworks = JSON.parse(localStorage.getItem('mm-transactions')) || { mtn: [], airtel: [], vodafone: [] };
        let transactions = [...allNetworks.mtn, ...allNetworks.airtel, ...allNetworks.vodafone];
        const txnToDelete = transactions[idx];
    
        // Find and remove from the correct network array
        if (txnToDelete && txnToDelete.network && allNetworks[txnToDelete.network]) {
            allNetworks[txnToDelete.network] = allNetworks[txnToDelete.network].filter(
                t => !(t.date === txnToDelete.date && t.time === txnToDelete.time && t.amount === txnToDelete.amount && t.phone === txnToDelete.phone)
            );
            localStorage.setItem('mm-transactions', JSON.stringify(allNetworks));
        }
        renderTransactions();
    }
    
    function addManualTransaction(e) {
        e.preventDefault();
        
        const form = e.target;
        const network = document.getElementById('network').value;
        const txnType = document.getElementById('txnType').value;
        const now = new Date();
        
                // ...inside addManualTransaction...
            
            const phoneInput = document.getElementById('phoneNumber');
            const clientNameInput = document.getElementById('clientName');
            const phoneNumber = phoneInput.value.trim();
            const clientName = clientNameInput.value.trim();
            
            let savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
            if (
                phoneNumber &&
                clientName &&
                !savedClients.some(entry => entry.phone === phoneNumber && entry.name === clientName)
            ) {
                savedClients.push({ name: clientName, phone: phoneNumber });
                localStorage.setItem('client-phones', JSON.stringify(savedClients));
            }
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
        renderTransactions(network);
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
        const headers = [["Date", "Time", "Type", "Amount (GH₵)", "From", "To"]];
        const txnData = data.map(t => [
            formatDate(t.date),
            t.time,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            (t.type === 'deposit' ? '+' : '-') + t.amount.toFixed(2),
            t.phone,
            t.recipient || '-'
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
                doc.text("©2025 recMe|HuBB Tec.", 
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

// Load saved phone numbers for autocomplete
function populatePhoneSuggestions() {
    const datalist = document.getElementById('phoneSuggestions');
    datalist.innerHTML = '';
    const savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
    savedClients.forEach(entry => {
        if (entry.name && entry.phone) { // Only add if both are present
            const option = document.createElement('option');
            option.value = entry.phone;
            option.label = `${entry.name} (${entry.phone})`;
            option.textContent = `${entry.name} (${entry.phone})`;
            datalist.appendChild(option);
        }
    });
}

document.getElementById('phoneNumber').addEventListener('input', function() {
    const phone = this.value.trim();
    const savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
    const match = savedClients.find(entry => entry.phone === phone);
    if (match && match.name) {
        document.getElementById('clientName').value = match.name;
    }
});

// Call this on page load and after saving a new phone number
populatePhoneSuggestions();
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    // Function to auto-fill date and time fields
    function autofillDateTime() {
        const now = new Date();
        // Format date as YYYY-MM-DD
        const dateStr = now.toISOString().split('T')[0];
        // Format time as HH:MM (24-hour)
        const timeStr = now.toTimeString().slice(0,5);

        const dateInput = document.getElementById('txnDate');
        const timeInput = document.getElementById('txnTime');
        if (dateInput) dateInput.value = dateStr;
        if (timeInput) timeInput.value = timeStr;
    }

    // Call on page load
    autofillDateTime();

    // Also call after form reset (after saving a transaction)
    const txnForm = document.getElementById('transactionForm');
    if (txnForm) {
        txnForm.addEventListener('reset', autofillDateTime);
    }
});


