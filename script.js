document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const purchasePriceInput = document.getElementById('purchasePrice');
    const downPaymentInput = document.getElementById('downPayment');
    const repaymentAmountInput = document.getElementById('repaymentAmount');
    const agentFeeInput = document.getElementById('agentFee');
    const realEstateTaxInput = document.getElementById('realEstateTax');
    const notaryFeeInput = document.getElementById('notaryFee');
    const interestRateInput = document.getElementById('interestRate');
    const unscheduledPaymentInput = document.getElementById('unscheduledPayment');
    const unscheduledPaymentYearsInput = document.getElementById('unscheduledPaymentYears');

    const summaryPurchasePriceSpan = document.getElementById('summaryPurchasePrice');
    const summaryTotalFeesSpan = document.getElementById('summaryTotalFees');
    const summaryAgentFeeSpan = document.getElementById('summaryAgentFee');
    const summaryTaxFeeSpan = document.getElementById('summaryTaxFee');
    const summaryNotaryFeeSpan = document.getElementById('summaryNotaryFee');
    const summaryTotalCostSpan = document.getElementById('summaryTotalCost');
    const summaryDownPaymentSpan = document.getElementById('summaryDownPayment');
    const summaryLoanAmountSpan = document.getElementById('summaryLoanAmount');
    const payoffSummaryP = document.getElementById('payoffSummary');

    const scheduleBody = document.getElementById('scheduleBody');
    const scheduleViewRadios = document.querySelectorAll('input[name="scheduleView"]');
    const periodHeader = document.getElementById('periodHeader');

    // --- Pagination Elements ---
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const pageInfoSpan = document.getElementById('pageInfo');
    const paginationControlsDiv = document.querySelector('.pagination-controls'); // To hide/show

    // --- Global Variables ---
    let monthlyScheduleData = [];
    let yearlyScheduleData = [];

    // --- Pagination State ---
    const ITEMS_PER_PAGE = 12; // Show 12 entries per page (1 year for monthly)
    let currentPage = 1;

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'N/A';
        }
        return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    };

    const getNumericValue = (element, defaultValue = 0) => {
        if (!element) return defaultValue;
        const value = parseFloat(element.value);
        return isNaN(value) ? defaultValue : value;
    };

    // --- Core Calculation Logic ---
    const calculateMortgage = () => {
        // ... (rest of the calculation logic remains the same up to point 8) ...
        // 1. Get Input Values
        const purchasePrice = getNumericValue(purchasePriceInput, 0);
        const downPayment = getNumericValue(downPaymentInput, 0);
        const monthlyPayment = getNumericValue(repaymentAmountInput, 0);
        const agentFeePercent = getNumericValue(agentFeeInput, 0);
        const taxFeePercent = getNumericValue(realEstateTaxInput, 0);
        const notaryFeePercent = getNumericValue(notaryFeeInput, 0);
        const interestRatePercent = getNumericValue(interestRateInput, 0);
        const unscheduledYearlyPayment = getNumericValue(unscheduledPaymentInput, 0);
        const unscheduledPaymentYears = getNumericValue(unscheduledPaymentYearsInput, 0);

        // 2. Calculate Fees
        const agentFee = purchasePrice * (agentFeePercent / 100);
        const taxFee = purchasePrice * (taxFeePercent / 100);
        const notaryFee = purchasePrice * (notaryFeePercent / 100);
        const totalFees = agentFee + taxFee + notaryFee;

        // 3. Calculate Summary Values
        const totalCost = purchasePrice + totalFees;
        let initialLoanAmount = totalCost - downPayment;
        if (initialLoanAmount < 0) initialLoanAmount = 0;

        // 4. Update Summary Display
        summaryPurchasePriceSpan.textContent = formatCurrency(purchasePrice);
        summaryAgentFeeSpan.textContent = formatCurrency(agentFee);
        summaryTaxFeeSpan.textContent = formatCurrency(taxFee);
        summaryNotaryFeeSpan.textContent = formatCurrency(notaryFee);
        summaryTotalFeesSpan.textContent = formatCurrency(totalFees);
        summaryTotalCostSpan.textContent = formatCurrency(totalCost);
        summaryDownPaymentSpan.textContent = formatCurrency(downPayment);
        summaryLoanAmountSpan.textContent = formatCurrency(initialLoanAmount);

        // 5. Amortization Calculation
        monthlyScheduleData = [];
        yearlyScheduleData = [];
        let remainingBalance = initialLoanAmount;
        let totalInterestPaid = 0;
        let month = 0;
        const monthlyInterestRate = (interestRatePercent / 100) / 12;

        payoffSummaryP.textContent = 'Berechne...';
        scheduleBody.innerHTML = '';

        if (initialLoanAmount <= 0) {
            payoffSummaryP.textContent = "Kein Darlehen erforderlich (Eigenkapital deckt Gesamtkosten).";
            currentPage = 1; // Reset page
            displaySchedule(); // Display empty schedule & update pagination
            return;
        }

        if (monthlyPayment <= 0 || interestRatePercent < 0) {
            payoffSummaryP.textContent = "Bitte gltige Werte für Rate (> 0) und Zinssatz (>= 0) eingeben.";
            currentPage = 1; // Reset page
            displaySchedule(); // Clear schedule table & update pagination
            return;
        }

        const minPayment = remainingBalance * monthlyInterestRate;
        if (monthlyPayment <= minPayment && unscheduledYearlyPayment <= 0) {
            payoffSummaryP.textContent = `Warnung: Die monatliche Rate (${formatCurrency(monthlyPayment)}) reicht nicht aus, um die anfänglichen Zinsen (${formatCurrency(minPayment)}) zu decken. Ohne Sondertilgungen wird das Darlehen nie zurückgezahlt.`;
        }

        let safetyBreak = 0;
        const MAX_MONTHS = 720;

        while (remainingBalance > 0 && safetyBreak < MAX_MONTHS) {
            month++;
            safetyBreak++;

            let interestForMonth = remainingBalance * monthlyInterestRate;
            if (interestForMonth < 0) interestForMonth = 0;

            let principalForMonth = monthlyPayment - interestForMonth;
            let paymentThisMonth = monthlyPayment;

            if (principalForMonth < 0) {
                principalForMonth = 0;
            }

            if (remainingBalance + interestForMonth <= monthlyPayment) {
                interestForMonth = remainingBalance * monthlyInterestRate;
                if (interestForMonth < 0) interestForMonth = 0;
                principalForMonth = remainingBalance;
                paymentThisMonth = principalForMonth + interestForMonth;
            }

            paymentThisMonth = Math.max(0, paymentThisMonth);
            interestForMonth = Math.max(0, interestForMonth);
            principalForMonth = Math.max(0, principalForMonth);

            const balanceBeforePayment = remainingBalance; // Store balance before deduction
            remainingBalance -= principalForMonth;
            totalInterestPaid += interestForMonth;

            if (remainingBalance < 0.005) {
                remainingBalance = 0;
            }

            monthlyScheduleData.push({
                period: month,
                totalPayment: paymentThisMonth,
                interestPaid: interestForMonth,
                principalPaid: principalForMonth,
                unscheduled: 0,
                balance: remainingBalance
            });

            if (unscheduledYearlyPayment > 0 && month % 12 === 0 && remainingBalance > 0) {
                const currentYear = Math.ceil(month / 12);
                let applyUnscheduledThisYear = (unscheduledPaymentYears <= 0) || (currentYear <= unscheduledPaymentYears);

                if (applyUnscheduledThisYear) {
                    const actualUnscheduledPayment = Math.min(unscheduledYearlyPayment, remainingBalance);
                    remainingBalance -= actualUnscheduledPayment;
                    if (remainingBalance < 0.005) {
                        remainingBalance = 0;
                    }
                    const lastMonthIndex = monthlyScheduleData.length - 1;
                    monthlyScheduleData[lastMonthIndex].unscheduled = actualUnscheduledPayment;
                    monthlyScheduleData[lastMonthIndex].balance = remainingBalance;
                }
            }

            if (remainingBalance <= 0) {
                break;
            }
        } // End while loop

        // 6. Generate Yearly Summary from Monthly Data
        yearlyScheduleData = [];
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        let yearlyTotalPayment = 0;
        let yearlyUnscheduled = 0;

        monthlyScheduleData.forEach((m, index) => {
            yearlyInterest += m.interestPaid;
            yearlyPrincipal += m.principalPaid;
            yearlyTotalPayment += m.totalPayment;
            yearlyUnscheduled += m.unscheduled;

            if ((index + 1) % 12 === 0 || index === monthlyScheduleData.length - 1) {
                const year = Math.ceil((index + 1) / 12);
                yearlyScheduleData.push({
                    period: year,
                    totalPayment: yearlyTotalPayment + yearlyUnscheduled,
                    interestPaid: yearlyInterest,
                    principalPaid: yearlyPrincipal + yearlyUnscheduled,
                    balance: m.balance
                });
                yearlyInterest = 0;
                yearlyPrincipal = 0;
                yearlyTotalPayment = 0;
                yearlyUnscheduled = 0;
            }
        });

        // 7. Update Payoff Summary
        if (remainingBalance <= 0) {
            const totalMonths = month;
            const years = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            let payoffText = `Das Darlehen ist voraussichtlich `;
            if (years > 0) {
                payoffText += `in ${years} Jahr${years > 1 ? 'en' : ''}`;
                if (remainingMonths > 0) {
                    payoffText += ` und ${remainingMonths} Monat${remainingMonths > 1 ? 'en' : ''}`;
                }
            } else {
                payoffText += `in ${remainingMonths} Monat${remainingMonths > 1 ? 'en' : ''}`;
            }
            payoffText += ` abbezahlt.`;
            payoffText += ` Gezahlte Gesamtzinsen: ${formatCurrency(totalInterestPaid)}.`;
            payoffSummaryP.textContent = payoffText;
        } else if (safetyBreak >= MAX_MONTHS) {
            payoffSummaryP.textContent = `Berechnungslimit erreicht (${Math.floor(MAX_MONTHS / 12)} Jahre). Das Darlehen konnte mit den aktuellen Eingaben nicht vollständig zurückgezahlt werden. Restschuld: ${formatCurrency(remainingBalance)}`;
        } else {
            payoffSummaryP.textContent = `Berechnung unvollständig. Restschuld: ${formatCurrency(remainingBalance)}`;
        }

        // 8. Reset pagination and Display Initial Schedule
        currentPage = 1; // Reset to first page after calculation
        displaySchedule();
    };

    // --- Display Schedule Logic (with Pagination) ---
    const displaySchedule = () => {
        const selectedView = document.querySelector('input[name="scheduleView"]:checked').value;
        const fullScheduleData = selectedView === 'yearly' ? yearlyScheduleData : monthlyScheduleData;

        scheduleBody.innerHTML = ''; // Clear previous rows

        // Calculate pagination parameters
        const totalItems = fullScheduleData.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        // Adjust currentPage if it's out of bounds (e.g., after filtering/recalculation)
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        if (currentPage < 1) {
            currentPage = 1;
        }

        // Calculate the slice of data for the current page
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedData = fullScheduleData.slice(startIndex, endIndex);

        // Update Period Header
        periodHeader.textContent = selectedView === 'yearly' ? 'Jahr' : 'Monat';

        // Render the current page's data
        if (paginatedData.length === 0 && totalItems === 0) {
            // Display a message if there's absolutely no data
            const row = scheduleBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = 'Keine Tilgungsdaten verfügbar oder Darlehen nicht erforderlich.';
            cell.style.textAlign = 'center';
        } else {
            paginatedData.forEach(item => {
                const row = scheduleBody.insertRow();
                row.insertCell().textContent = item.period;
                row.insertCell().textContent = formatCurrency(item.totalPayment);
                row.insertCell().textContent = formatCurrency(item.interestPaid);
                // Show total principal reduction (regular + unscheduled for the period)
                const principalShown = item.principalPaid + (selectedView === 'monthly' ? item.unscheduled : 0);
                row.insertCell().textContent = formatCurrency(principalShown);
                row.insertCell().textContent = formatCurrency(item.balance);
            });
        }

        // Update Pagination Controls
        if (totalPages <= 1) {
            // Hide controls if only one page or no pages
            paginationControlsDiv.style.display = 'none';
        } else {
            paginationControlsDiv.style.display = 'flex'; // Ensure it's visible
            pageInfoSpan.textContent = `Seite ${currentPage} von ${totalPages}`;
            prevPageButton.disabled = currentPage === 1;
            nextPageButton.disabled = currentPage === totalPages;
        }
    };

    // --- Event Listeners ---
    const inputs = [
        purchasePriceInput, downPaymentInput, repaymentAmountInput,
        agentFeeInput, realEstateTaxInput, notaryFeeInput,
        interestRateInput, unscheduledPaymentInput,
        unscheduledPaymentYearsInput
    ];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', calculateMortgage);
        }
    });

    // Listener for view toggle (Monthly/Yearly)
    scheduleViewRadios.forEach(radio => radio.addEventListener('change', () => {
        currentPage = 1; // Reset to page 1 when changing view
        displaySchedule();
    }));

    // Listeners for Pagination Buttons
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displaySchedule();
        }
    });

    nextPageButton.addEventListener('click', () => {
        // Need total pages calculation here or access to it
        const selectedView = document.querySelector('input[name="scheduleView"]:checked').value;
        const fullScheduleData = selectedView === 'yearly' ? yearlyScheduleData : monthlyScheduleData;
        const totalPages = Math.ceil(fullScheduleData.length / ITEMS_PER_PAGE);

        if (currentPage < totalPages) {
            currentPage++;
            displaySchedule();
        }
    });

    // --- Initial Calculation on Load ---
    calculateMortgage();
});