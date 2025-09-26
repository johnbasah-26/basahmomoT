// Full Refactor: Single DOMContentLoaded with Cleaned Logic
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
    const txnNetworkSelect = el('txnNetwork') || el('network') || el('txnNetworkSelect');
    const transactionsDiv = el('transactions');
    const phoneSuggestions = el('phoneSuggestions');
    const transactionChartEl = el('transactionChart');

    /* ===========================
       STATE
       =========================== */
    let currentRange = "all-time"; // default
    let transactionChart = null;

    let transactions = JSON.parse(localStorage.getItem('mm-transactions')) || {
        mtn: [],
        airtel: [],
        vodafone: []
    };

    // Seed with a sample if empty
    if (!localStorage.getItem('mm-transactions')) {
        transactions.mtn.push({
            type: "Deposit",
            amount: 0,
            phone: "0000000000",
            clientName: "Sample",
            date: "2025-01-01",
            time: "00:00",
            network: "mtn"
        });
        saveToLocalStorage();
    }

    /* ===========================
       UTILITIES
       =========================== */
    function saveToLocalStorage() {
        localStorage.setItem('mm-transactions', JSON.stringify(transactions));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-GH', options);
    }

    function getCurrentNetwork() {
        const activeBtn = document.querySelector('.network-selector button.active');
        if (activeBtn) return activeBtn.dataset.network;
        if (txnNetworkSelect && txnNetworkSelect.value) return txnNetworkSelect.value.toLowerCase();
        return 'mtn';
    }

    function normalizeNetworkKey(key) {
        if (!key) return "mtn";
        key = key.toLowerCase();
        if (["mtn", "airtel", "vodafone"].includes(key)) return key;
        return "mtn";
    }

    /* ===========================
       CURRENT TIME
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
       FILTERING
       =========================== */
    function filterByRange(transactions, range) {
        const today = new Date();

        return transactions.filter(txn => {
            const txnDate = new Date(txn.date);

            switch (range) {
                case "today":
                    return txnDate.toDateString() === today.toDateString();

                case "this-week": {
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    return txnDate >= startOfWeek && txnDate <= today;
                }

                case "this-month":
                    return txnDate.getMonth() === today.getMonth() &&
                           txnDate.getFullYear() === today.getFullYear();

                case "this-year":
                    return txnDate.getFullYear() === today.getFullYear();

                case "all-time":
                default:
                    return true;
            }
        });
    }

    /* ===========================
       AUTH
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

    // Logout modal
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

    // Signup / Login toggles
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

    // Signup
    if (signupForm) {
        signupForm.onsubmit = function (e) {
            e.preventDefault();
            const username = (el('signupUsername')?.value.trim()) || '';
            const password = (el('signupPassword')?.value) || '';
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

    // Login
    if (loginForm) {
        loginForm.onsubmit = function (e) {
            e.preventDefault();
            const username = (el('username')?.value.trim()) || '';
            const password = (el('password')?.value) || '';
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
       PHONE SUGGESTIONS
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
                phoneSuggestions.appendChild(option);
            }
        });
    }
    populatePhoneSuggestions();

    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            const phone = this.value.trim();
            const savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
            const match = savedClients.find(entry => entry.phone === phone);
            if (match && match.name && clientNameInput) {
                clientNameInput.value = match.name;
            }

            // auto-network by prefix
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
    if (txnForm) txnForm.addEventListener('reset', autofillDateTime);

    /* ===========================
       NETWORK SELECTOR
       =========================== */
    const networkButtons = document.querySelectorAll('.network-selector button[data-network]');
    networkButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const net = this.dataset.network;
            networkButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (txnNetworkSelect) txnNetworkSelect.value = net;
            renderTransactions(net);
            renderChart(net);
        });
    });

    /* ===========================
       SUMMARY CALCULATION
       =========================== */
    function calculateSummary(data) {
        let balance = 0, cashIn = 0, cashOut = 0;
        const today = new Date().toISOString().split('T')[0];

        data.forEach(txn => {
            const amt = parseFloat(txn.amount) || 0;
            const type = txn.type.toLowerCase();
            if (type === 'deposit') {
                balance += amt;
                if (txn.date === today) cashIn += amt;
            } else if (type === 'withdrawal' || type === 'airtime' || type === 'transfer') {
                balance += amt;
                if (txn.date === today) cashOut += amt;
            }
        });

        return { balance, cashIn, cashOut };
    }

    function updateSummaries() {
        // Overall summary
        let allTxns = [
            ...(transactions.mtn || []),
            ...(transactions.airtel || []),
            ...(transactions.vodafone || [])
        ];
        allTxns = filterByRange(allTxns, currentRange);

        const overall = calculateSummary(allTxns);

        if (el('overallBalance')) {
            const overallBalanceEl = el('overallBalance');
            overallBalanceEl.textContent = overall.balance.toFixed(2);
            overallBalanceEl.className = overall.balance >= 0 ? "balance-positive" : "balance-negative";

            el('overallIn').textContent = overall.cashIn.toFixed(2);
            el('overallOut').textContent = overall.cashOut.toFixed(2);
        }

        // Per network summary
        const net = normalizeNetworkKey(getCurrentNetwork());
        const netTxns = filterByRange(transactions[net] || [], currentRange);
        const perNet = calculateSummary(netTxns);

        if (el('networkTitle')) {
            el('networkTitle').textContent = net.toUpperCase() + " Summary";
            const netBalanceEl = el('networkBalance');
            netBalanceEl.textContent = perNet.balance.toFixed(2);
            netBalanceEl.className = perNet.balance >= 0 ? "balance-positive" : "balance-negative";
            el('networkIn').textContent = perNet.cashIn.toFixed(2);
            el('networkOut').textContent = perNet.cashOut.toFixed(2);
        }
    }

    /* ===========================
       TRANSACTIONS RENDER / DELETE
       =========================== */
    function renderTransactions(networkArg) {
        if (!transactionsDiv) return;
        transactionsDiv.innerHTML = '';

        let listItems = [];
        if (networkArg) {
            listItems = [...(transactions[networkArg] || [])];
        } else {
            listItems = [
                ...transactions.mtn,
                ...transactions.airtel,
                ...transactions.vodafone
            ];
        }

        if (listItems.length === 0) {
            transactionsDiv.innerHTML = '<p>No transactions yet.</p>';
            updateSummaries();
            return;
        }

        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        listItems.forEach(txn => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.7em';
            li.style.padding = '0.7em';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';

            const left = document.createElement('span');
            left.innerHTML = `<strong>${txn.type}</strong> | GH₵${txn.amount} | ${txn.phone} | ${txn.recipient || txn.clientName || '-'} | ${txn.date} ${txn.time} | ${txn.network}`;

            const del = document.createElement('button');
            del.textContent = 'Delete';
            del.className = 'delete-txn-btn';
            del.style.cursor = 'pointer';
            del.style.border = 'none';
            del.style.padding = '0.35em 0.8em';
            del.style.borderRadius = '4px';
            del.style.background = '#0f23da';
            del.style.color = '#fff';
            del.onclick = () => deleteTransaction(txn);

            li.appendChild(left);
            li.appendChild(del);
            ul.appendChild(li);
        });

        transactionsDiv.appendChild(ul);
        updateSummaries();
    }

    function deleteTransaction(txn) {
        const net = normalizeNetworkKey(txn.network);
        transactions[net] = transactions[net].filter(t =>
            !(t.date === txn.date && t.time === txn.time && String(t.amount) === String(txn.amount) && t.phone === txn.phone)
        );
        saveToLocalStorage();
        renderTransactions(getCurrentNetwork());
        renderChart(getCurrentNetwork());
    }

    if (deleteAllTxnsBtn) {
        deleteAllTxnsBtn.onclick = function () {
            if (confirm('Are you sure you want to delete all transactions?')) {
                transactions = { mtn: [], airtel: [], vodafone: [] };
                saveToLocalStorage();
                renderTransactions();
                if (transactionChart) {
                    transactionChart.destroy();
                    transactionChart = null;
                }
                renderChart(getCurrentNetwork());
            }
        };
    }

    /* ===========================
       ADD TRANSACTION
       =========================== */
    if (txnForm) {
        txnForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const now = new Date();
            const dateVal = el('txnDate')?.value || now.toISOString().split('T')[0];
            const timeVal = el('txnTime')?.value || now.toTimeString().substring(0, 5);
            const amountInput = parseFloat(el('amount')?.value || '0') || 0;
            const txnType = txnTypeSelect?.value || 'deposit';
            const phoneVal = phoneInput?.value || '';
            const clientNameVal = clientNameInput?.value || '';
            const recipientVal = txnType === 'transfer' ? recipientField?.value || '' : '';
            const networkVal = normalizeNetworkKey(txnNetworkSelect?.value || 'mtn');

            // Save client phone if new
            let savedClients = JSON.parse(localStorage.getItem('client-phones')) || [];
            if (phoneVal && clientNameVal && !savedClients.some(entry => entry.phone === phoneVal)) {
                savedClients.push({ name: clientNameVal, phone: phoneVal });
                localStorage.setItem('client-phones', JSON.stringify(savedClients));
                populatePhoneSuggestions();
            }

            const newTxn = {
                date: dateVal,
                time: timeVal,
                amount: amountInput,
                type: txnType,
                phone: phoneVal,
                recipient: recipientVal,
                clientName: clientNameVal,
                network: networkVal
            };

            if (!transactions[networkVal]) transactions[networkVal] = [];
            transactions[networkVal].push(newTxn);
            saveToLocalStorage();

            txnForm.reset();
            autofillDateTime();
            renderTransactions(getCurrentNetwork());
            renderChart(getCurrentNetwork());
        });
    }

    /* ===========================
       CHART
       =========================== */
    function groupTransactionsByDate(data) {
        const grouped = {};
        data.forEach(txn => {
            if (!grouped[txn.date]) grouped[txn.date] = 0;
            grouped[txn.date] += parseFloat(txn.amount) || 0;
        });
        return grouped;
    }

    function renderChart(network) {
        if (!transactionChartEl) return;

        let dataForNet = network ? (transactions[network] || []) : [
            ...transactions.mtn,
            ...transactions.airtel,
            ...transactions.vodafone
        ];
        dataForNet = filterByRange(dataForNet, currentRange);
        const grouped = groupTransactionsByDate(dataForNet);

        const labels = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
        const values = labels.map(d => grouped[d]);

        if (transactionChart) {
            transactionChart.destroy();
        }

        transactionChart = new Chart(transactionChartEl, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Transactions - ${network || 'All'}`,
                    data: values,
                    fill: false,
                    borderColor: 'rgb(75,192,192)',
                    tension: 0.1
                }]
            }
        });

        updateSummaries();
    }

    /* ===========================
       EXPORT PDF
       =========================== */
    if (pdfBtn) {
        pdfBtn.onclick = function () {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const net = normalizeNetworkKey(getCurrentNetwork());
            let txns = filterByRange(transactions[net], currentRange);

            doc.text(`${net.toUpperCase()} Transactions`, 14, 20);

            const headers = [["Type", "Amount", " Client's number", "Client's name", "Date", "Time", "Network"]];
            const dataRows = txns.map(txn => [
                txn.type,
                txn.amount,
                txn.phone,
                // txn.recipient,
                txn.clientName,
                txn.date,
                txn.time,
                txn.network
            ]);

            if (doc.autoTable) {
                doc.autoTable({
                    head: headers,
                    body: dataRows,
                    startY: 30
                });
            }

            doc.save(`${net}-transactions.pdf`);
        };
    }

    /* ===========================
       TIME RANGE SELECTOR
       =========================== */
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', function () {
            currentRange = this.value;
            renderTransactions(getCurrentNetwork());
            renderChart(getCurrentNetwork());
        });
    }

    /* ===========================
       INITIAL RENDER
       =========================== */
    renderTransactions(getCurrentNetwork());
    renderChart(getCurrentNetwork());
    
});
