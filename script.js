// Full refactor: single DOMContentLoaded and complete feature set
document.addEventListener('DOMContentLoaded', function () {
    // Helper to safely get element by id
    const el = id => document.getElementById(id);

    /* ===========================
       ELEMENTS (AUTH / UI)
       =========================== */
    const loginOverlay = el('loginOverlay');
    const loginForm = el('loginForm');
    const loginError = el('loginError');
    const signupForm = el('signupForm');
    const signupError = el('signupError');
    const showSignup = el('showSignup');
    const showLogin = el('showLogin');
    const signupLinkContainer = el('signupLinkContainer');
    const logoutBtn = el('logoutBtn');
    const signupSuccessModal = el('signupSuccessModal');
    const closeSignupSuccess = el('closeSignupSuccess');
    const logoutModal = el('logoutModal');
    const confirmLogoutYes = el('confirmLogoutYes');
    const confirmLogoutNo = el('confirmLogoutNo');
    const currentTimeEl = el('currentTime');

    /* ===========================
       ELEMENTS (TRANSACTIONS / FORM)
       =========================== */
    const txnTypeSelect = el('txnType');
    const recipientField = el('recipient');
    const timeRangeSelect = el('timeRange');
    const txnForm = el('transactionForm') || el('txnForm');
    const pdfBtn = el('pdfBtn');
    const deleteAllTxnsBtn = el('deleteAllTxnsBtn');
    const phoneInput = el('phoneNumber');
    const clientNameInput = el('clientName');
    // handle both possible ids used in different versions
    const txnNetworkSelect = el('txnNetwork') || el('network') || el('txnNetworkSelect');
    const transactionsDiv = el('transactions');
    const phoneSuggestions = el('phoneSuggestions');
    const transactionChartEl = el('transactionChart');

    /* ===========================
       Libraries (optional)
       =========================== */
    const jsPDFModule = window.jspdf; // expecting window.jspdf available
    const hasAutoTable = jsPDFModule && typeof window.jspdf.jsPDF === 'function' && typeof window.jspdf.jsPDF().autoTable === 'function';

    /* ===========================
       STATE (load from localStorage)
       =========================== */
    let transactions = JSON.parse(localStorage.getItem('mm-transactions')) || {
        mtn: [],
        airtel: [],
        vodafone: []
    };

    // if storage empty, seed with sample like original
    if (!localStorage.getItem('mm-transactions')) {
        transactions = {
            mtn: [
                {
                    type: "Deposit",
                    amount: 0,
                    phone: "0000000000",
                    clientName: "Sample",
                    date: "2025-01-01",
                    time: "00:00",
                    network: "mtn"
                }
            ],
            airtel: [],
            vodafone: []
        };
        localStorage.setItem('mm-transactions', JSON.stringify(transactions));
    }

    let transactionChart = null;

    /* ===========================
       UTIL: current time display
       =========================== */
    function updateCurrentTime() {
        if (!currentTimeEl) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        currentTimeEl.textContent = timeString;
    }
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    /* ===========================
       AUTH / SIGNUP / LOGIN
       =========================== */
    function showOverlayIfNotLoggedIn() {
        const loggedIn = localStorage.getItem('mm-logged-in');
        if (loggedIn) {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (typeof mainApp !== 'undefined') mainApp.style.display = '';
        } else {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (typeof mainApp !== 'undefined') mainApp.style.display = 'none';
        }
    }
    showOverlayIfNotLoggedIn();

    // Logout flow (modal confirmation)
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (logoutModal) logoutModal.style.display = 'flex';
        };
    }
    if (confirmLogoutYes) {
        confirmLogoutYes.onclick = () => {
            localStorage.removeItem('mm-logged-in');
            if (logoutModal) logoutModal.style.display = 'none';
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (typeof mainApp !== 'undefined') mainApp.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (signupForm) signupForm.style.display = 'none';
            if (signupLinkContainer) signupLinkContainer.style.display = 'block';
        };
    }
    if (confirmLogoutNo) {
        confirmLogoutNo.onclick = () => {
            if (logoutModal) logoutModal.style.display = 'none';
        };
    }

    // show signup/login toggles (safeguarded)
    if (showSignup) {
        showSignup.addEventListener('click', e => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'block';
            if (loginError) loginError.style.display = 'none';
            if (signupLinkContainer) signupLinkContainer.style.display = 'none';
        });
    }
    if (showLogin) {
        showLogin.addEventListener('click', e => {
            e.preventDefault();
            if (signupForm) signupForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (signupError) signupError.style.display = 'none';
            if (signupLinkContainer) signupLinkContainer.style.display = 'block';
        });
    }

    // Signup handler
    if (signupForm) {
        signupForm.onsubmit = function (e) {
            e.preventDefault();
            const username = (el('signupUsername') && el('signupUsername').value.trim()) || '';
            const password = (el('signupPassword') && el('signupPassword').value) || '';
            let users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.username === username)) {
                if (signupError) signupError.style.display = 'block';
            } else {
                users.push({ username, password });
                localStorage.setItem('users', JSON.stringify(users));
                if (signupError) signupError.style.display = 'none';
                signupForm.reset();
                if (signupSuccessModal) signupSuccessModal.style.display = 'flex';
            }
        };
    }

    if (closeSignupSuccess) {
        closeSignupSuccess.onclick = function () {
            if (signupSuccessModal) signupSuccessModal.style.display = 'none';
            if (signupForm) signupForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        };
    }

    // Login handler
    if (loginForm) {
        loginForm.onsubmit = function (e) {
            e.preventDefault();
            const username = (el('username') && el('username').value.trim()) || '';
            const password = (el('password') && el('password').value) || '';
            let users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.username === username && u.password === password)) {
                localStorage.setItem('mm-logged-in', username);
                if (loginOverlay) loginOverlay.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';
                if (typeof mainApp !== 'undefined') mainApp.style.display = '';
            } else {
                if (loginError) loginError.style.display = 'block';
            }
        };
    }

    /* ===========================
       PHONE SUGGESTIONS (datalist)
       =========================== */
    function populatePhoneSuggestions() {
        if (!phoneSuggestions) return;
        phoneSuggestions.innerHTML = '';
        const savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
        savedClients.forEach(entry => {
            if (entry.name && entry.phone) {
                const option = document.createElement('option');
                option.value = entry.phone;
                option.label = `${entry.name} (${entry.phone})`;
                option.textContent = `${entry.name} (${entry.phone})`;
                phoneSuggestions.appendChild(option);
            }
        });
    }
    populatePhoneSuggestions();

    // Fill client name when phone matches saved
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            const phone = this.value.trim();
            const savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
            const match = savedClients.find(entry => entry.phone === phone);
            if (match && match.name && clientNameInput) {
                clientNameInput.value = match.name;
            }

            // auto-network by prefix (common GH prefixes)
            if (phone.length >= 3 && txnNetworkSelect) {
                const prefix = phone.substring(0, 3);
                if (["054", "059", "024", "055"].includes(prefix)) txnNetworkSelect.value = "mtn";
                else if (["050", "020"].includes(prefix)) txnNetworkSelect.value = "vodafone";
                else if (["027", "026", "057", "056"].includes(prefix)) txnNetworkSelect.value = "airtel";
            }
        });
    }

    /* ===========================
       FORM AUTO DATE/TIME
       =========================== */
    function autofillDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);
        if (el('txnDate')) el('txnDate').value = dateStr;
        if (el('txnTime')) el('txnTime').value = timeStr;
    }
    autofillDateTime();
    if (txnForm) {
        txnForm.addEventListener('reset', autofillDateTime);
    }

    /* ===========================
       NETWORK SELECTOR BUTTONS
       =========================== */
    const networkButtons = document.querySelectorAll('.network-selector button[data-network]');
    networkButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const net = this.dataset.network;
            // toggle active class visually
            networkButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // sync dropdown
            if (txnNetworkSelect) txnNetworkSelect.value = net;

            // render UI for that network
            renderChart(net);
            renderTransactions(net);
        });
    });

    /* ===========================
       HELPERS: Save & format
       =========================== */
    function saveToLocalStorage() {
        localStorage.setItem('mm-transactions', JSON.stringify(transactions));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-GH', options);
    }

    /* ===========================
       FILTER / GROUP for Chart
       =========================== */
    function filterByDateRange(txns) {
        if (!txns) return [];
        const range = (timeRangeSelect && timeRangeSelect.value) || 'all';
        const now = new Date();
        if (range === 'today') {
            const today = now.toISOString().split('T')[0];
            return txns.filter(t => t.date === today);
        }
        let cutoff = new Date();
        if (range === '7days') cutoff.setDate(now.getDate() - 7);
        else if (range === '30days') cutoff.setDate(now.getDate() - 30);
        else return txns;
        return txns.filter(t => new Date(t.date) >= cutoff);
    }

    function groupTransactionsByDate(txns) {
        return txns.reduce((acc, curr) => {
            if (!curr) return acc;
            const date = curr.date || '';
            if (!acc[date]) acc[date] = { deposits: 0, withdrawals: 0, airtime: 0, transfer: 0, payment: 0 };
            const amt = parseFloat(curr.amount) || 0;
            const type = (curr.type || '').toString().toLowerCase();
            if (type === 'deposit') acc[date].deposits += amt;
            else if (type === 'withdrawal') acc[date].withdrawals += amt;
            else if (type === 'airtime') acc[date].airtime += amt;
            else if (type === 'transfer') acc[date].transfer += amt;
            else if (type === 'payment') acc[date].payment += amt;
            return acc;
        }, {});
    }

    /* ===========================
       CHART RENDERING (Chart.js)
       =========================== */
    function getCurrentNetwork() {
        const activeBtn = document.querySelector('.network-selector button.active');
        if (activeBtn) return activeBtn.dataset.network;
        // fallback to dropdown
        if (txnNetworkSelect && txnNetworkSelect.value) return txnNetworkSelect.value;
        return 'mtn';
    }

    function renderChart(network) {
        if (!transactionChartEl || typeof Chart === 'undefined') return;
        const net = network || getCurrentNetwork();
        const dataForNet = transactions[net] || [];
        const filtered = filterByDateRange(dataForNet);
        const grouped = groupTransactionsByDate(filtered);
        const dates = Object.keys(grouped).sort();
        // if no dates, show placeholder
        const labels = dates.length ? dates : [new Date().toISOString().split('T')[0]];
        const deposits = labels.map(d => grouped[d] ? grouped[d].deposits : 0);
        const withdrawals = labels.map(d => grouped[d] ? grouped[d].withdrawals : 0);
        const airtime = labels.map(d => grouped[d] ? grouped[d].airtime : 0);
        const transfers = labels.map(d => grouped[d] ? grouped[d].transfer : 0);
        const payments = labels.map(d => grouped[d] ? grouped[d].payment : 0);

        if (transactionChart) {
            transactionChart.data.labels = labels;
            const ds = transactionChart.data.datasets;
            if (ds[0]) ds[0].data = deposits;
            if (ds[1]) ds[1].data = withdrawals;
            if (ds[2]) ds[2].data = airtime;
            if (ds[3]) ds[3].data = transfers;
            if (ds[4]) ds[4].data = payments;
            transactionChart.update();
            return;
        }

        // create new chart
        const ctx = transactionChartEl.getContext('2d');
        transactionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Deposits', data: deposits, backgroundColor: '#00c853', borderRadius: 6, borderSkipped: false },
                    { label: 'Withdrawals', data: withdrawals, backgroundColor: '#ff3d00', borderRadius: 6, borderSkipped: false },
                    { label: 'Airtime', data: airtime, backgroundColor: '#ffab00', borderRadius: 6, borderSkipped: false },
                    { label: 'Transfers', data: transfers, backgroundColor: '#6200ea', borderRadius: 6, borderSkipped: false },
                    { label: 'Payments', data: payments, backgroundColor: '#0091ea', borderRadius: 6, borderSkipped: false }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 800, easing: 'easeOutQuart' },
                plugins: {
                    title: {
                        display: true,
                        text: `${net.toUpperCase()} Transactions (GH₵)`,
                        color: '#ffffff',
                        font: { size: 16, weight: '600' }
                    },
                    legend: { position: 'bottom', labels: { color: '#ffffff', font: { size: 12 }, padding: 20, usePointStyle: true } },
                    tooltip: {
                        backgroundColor: 'rgba(30,30,30,0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#333',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#b0b0b0' } },
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#b0b0b0', callback: v => 'GH₵ ' + v } }
                }
            }
        });
    }

    // make timeRange change update chart
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            renderChart(getCurrentNetwork());
        });
    }

    /* ===========================
       RENDER / DELETE TRANSACTIONS
       - If network passed -> render only that network
       - else -> render all transactions combined
       =========================== */
    function renderTransactions(networkArg) {
        if (!transactionsDiv) return;
        transactionsDiv.innerHTML = '';
        let listItems = [];

        if (networkArg) {
            // render only networkArg
            const arr = transactions[networkArg] || [];
            listItems = arr.map(txn => ({ ...txn }));
        } else {
            // render all networks combined
            listItems = [
                ...transactions.mtn.map(t => ({ ...t })),
                ...transactions.airtel.map(t => ({ ...t })),
                ...transactions.vodafone.map(t => ({ ...t }))
            ];
        }

        if (listItems.length === 0) {
            transactionsDiv.innerHTML = '<p>No transactions yet.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        listItems.forEach((txn, idx) => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.7em';
            li.style.padding = '0.7em';
            li.style.borderRadius = '6px';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.background = 'transparent';

            const left = document.createElement('span');
            left.innerHTML = `<strong>${txn.type}</strong> | GH₵${txn.amount} | ${txn.phone} | ${txn.recipient || txn.clientName || '-'} | ${txn.date} ${txn.time} | ${txn.network}`;

            const del = document.createElement('button');
            del.className = 'delete-txn-btn';
            del.dataset.network = txn.network;
            del.dataset.date = txn.date;
            del.dataset.time = txn.time;
            del.dataset.amount = txn.amount;
            del.dataset.phone = txn.phone;
            del.textContent = 'Delete';
            del.style.cursor = 'pointer';
            del.style.border = 'none';
            del.style.padding = '0.35em 0.8em';
            del.style.borderRadius = '4px';
            del.style.background = '#0f23da';
            del.style.color = '#fff';

            del.addEventListener('click', function () {
                deleteTransaction(this.dataset);
            });

            li.appendChild(left);
            li.appendChild(del);
            ul.appendChild(li);
        });

        transactionsDiv.appendChild(ul);
    }

    function deleteTransaction(dataset) {
        const { network, date, time, amount, phone } = dataset;
        if (!network || !transactions[network]) return;
        transactions[network] = transactions[network].filter(t =>
            !(t.date === date && t.time === time && String(t.amount) === String(amount) && t.phone === phone)
        );
        saveToLocalStorage();
        renderTransactions(getCurrentNetwork()); // keep view consistent
        renderChart(getCurrentNetwork());
    }

    if (deleteAllTxnsBtn) {
        deleteAllTxnsBtn.onclick = function () {
            if (confirm('Are you sure you want to delete all transactions?')) {
                transactions = { mtn: [], airtel: [], vodafone: [] };
                localStorage.removeItem('mm-transactions');
                saveToLocalStorage();
                renderTransactions();
                if (transactionChart) transactionChart.destroy();
                transactionChart = null;
                renderChart(getCurrentNetwork());
            }
        };
    }

    /* ===========================
       ADD TRANSACTION (form submit)
       =========================== */
    if (txnForm) {
        txnForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const now = new Date();
            const dateVal = (el('txnDate') && el('txnDate').value) || now.toISOString().split('T')[0];
            const timeVal = (el('txnTime') && el('txnTime').value) || now.toTimeString().substring(0, 5);
            const amountInput = parseFloat((el('amount') && el('amount').value) || '0') || 0;
            const txnType = (txnTypeSelect && txnTypeSelect.value) || 'deposit';
            const phoneVal = (phoneInput && phoneInput.value) || '';
            const clientNameVal = (clientNameInput && clientNameInput.value) || '';
            const recipientVal = (recipientField && (el('recipient') && el('recipient').value)) || '';
            const networkVal = txnNetworkSelect ? txnNetworkSelect.value : 'mtn';

            // save client phone list if both provided and unique
            try {
                let savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
                if (phoneVal && clientNameVal && !savedClients.some(entry => entry.phone === phoneVal && entry.name === clientNameVal)) {
                    savedClients.push({ name: clientNameVal, phone: phoneVal });
                    localStorage.setItem('client-phones', JSON.stringify(savedClients));
                    populatePhoneSuggestions();
                }
            } catch (err) {
                // ignore errors here
            }

            const newTxn = {
                date: dateVal,
                time: timeVal,
                amount: amountInput,
                type: txnType,
                phone: phoneVal,
                recipient: txnType === 'transfer' ? recipientVal : '',
                clientName: clientNameVal,
                network: networkVal
            };

            // UI feedback for submit
            const submitBtn = txnForm.querySelector('button[type="submit"]') || txnForm.querySelector('button');
            if (submitBtn) {
                const prevHtml = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                submitBtn.style.backgroundColor = '#00c853';
                setTimeout(() => {
                    submitBtn.innerHTML = prevHtml;
                    submitBtn.style.backgroundColor = '';
                }, 1200);
            }

            // push and save
            if (!transactions[networkVal]) transactions[networkVal] = [];
            transactions[networkVal].push(newTxn);
            saveToLocalStorage();
            renderTransactions(networkVal);
            renderChart(networkVal);
            txnForm.reset();
            autofillDateTime();
            if (recipientField) recipientField.style.display = 'none';
        });
    }

    /* ===========================
       PDF EXPORT (jsPDF + autoTable)
       =========================== */
    function generatePDFStatement() {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            alert('PDF library not loaded.');
            return;
        }
        const jsPDF = window.jspdf.jsPDF;
        const network = getCurrentNetwork();
        const data = (transactions[network] || []).slice().sort((a, b) =>
            new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
        ).reverse();

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor('#6a11cb');
        doc.text(`${network.toUpperCase()} Transaction Statement`, 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor('#666');
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-GH')} at ${new Date().toLocaleTimeString('en-GH')}`, 105, 22, { align: 'center' });

        const headers = [["Date", "Time", "Type", "Amount (GH₵)", "From", "To"]];
        const txnData = data.map(t => [
            formatDate(t.date),
            t.time,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            ((t.type && t.type.toLowerCase() === 'deposit') ? '+' : '-') + (parseFloat(t.amount) || 0).toFixed(2),
            t.phone,
            t.recipient || '-'
        ]);

        // if autoTable exists on the doc, use it, else fallback to simple text table
        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: headers,
                body: txnData,
                startY: 30,
                styles: { cellPadding: 5, fontSize: 10, valign: 'middle', textColor: '#333' },
                columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 20 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 'auto' }, 5: { cellWidth: 'auto' } },
                headStyles: { fillColor: '#6a11cb', textColor: '#ffffff', fontStyle: 'bold' },
                alternateRowStyles: { fillColor: '#f5f5f5' },
                didDrawPage: function (data) {
                    doc.setFontSize(10);
                    doc.setTextColor('#999');
                    doc.text("©2025 recMe|HuBB Tec.", data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });
        } else {
            // simple fallback: write rows line by line
            let y = 30;
            doc.setFontSize(11);
            headers[0].forEach((h, i) => doc.text(String(h), 10 + i * 30, y));
            y += 6;
            txnData.forEach(row => {
                row.forEach((c, i) => doc.text(String(c), 10 + i * 30, y));
                y += 6;
                if (y > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    y = 20;
                }
            });
        }

        const fileName = `${network}_statement_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    if (pdfBtn) pdfBtn.addEventListener('click', generatePDFStatement);

    /* ===========================
       STARTUP: initial render & suggestions
       =========================== */
    // initial active network: pick first network button, else mtn
    if (networkButtons.length === 0 && txnNetworkSelect) {
        // ensure there is some visible 'active' reference if no buttons exist
        // we won't press any button, but chart will default to txnNetworkSelect.value
    } else if (networkButtons.length > 0) {
        // ensure exactly one active
        const anyActive = Array.from(networkButtons).some(b => b.classList.contains('active'));
        if (!anyActive) networkButtons[0].classList.add('active');
    }

    renderTransactions(getCurrentNetwork());
    renderChart(getCurrentNetwork());

    // keep phone suggestions updated after load
    populatePhoneSuggestions();

    /* ===========================
       Additional: ensure UI sync if network dropdown changed
       =========================== */
    if (txnNetworkSelect) {
        txnNetworkSelect.addEventListener('change', function () {
            // update network buttons styling to match dropdown
            const val = this.value;
            networkButtons.forEach(b => {
                if (b.dataset.network === val) b.classList.add('active'); else b.classList.remove('active');
            });
            renderChart(val);
            renderTransactions(val);
        });
    }
});
    function applyTimeBasedTheme() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
        document.body.classList.add('day-mode');
        document.body.classList.remove('night-mode');
    } else {
        document.body.classList.add('night-mode');
        document.body.classList.remove('day-mode');
    }
}

// Run at load
applyTimeBasedTheme();

// Optional: recheck every hour
setInterval(applyTimeBasedTheme, 60 * 60 * 1000);

