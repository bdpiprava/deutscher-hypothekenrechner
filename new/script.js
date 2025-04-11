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

    // --- Global Variables for Schedule Data ---
    let monthlyScheduleData = [];
    let yearlyScheduleData = [];

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        return value.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'});
    };

    const getNumericValue = (element, defaultValue = 0) => {
        const value = parseFloat(element.value);
        return isNaN(value) ? defaultValue : value;
    };

    // --- Core Calculation Logic ---
    const calculateMortgage = () => {
        // 1. Get Input Values
        const purchasePrice = getNumericValue(purchasePriceInput, 400000);
        const downPayment = getNumericValue(downPaymentInput, 100000);
        const monthlyPayment = getNumericValue(repaymentAmountInput, 1500);
        const agentFeePercent = getNumericValue(agentFeeInput, 3.57);
        const taxFeePercent = getNumericValue(realEstateTaxInput, 6.0);
        const notaryFeePercent = getNumericValue(notaryFeeInput, 2.0);
        const interestRatePercent = getNumericValue(interestRateInput, 3.61);
        const unscheduledYearlyPayment = getNumericValue(unscheduledPaymentInput, 0);

        // 2. Calculate Fees
        const agentFee = purchasePrice * (agentFeePercent / 100);
        const taxFee = purchasePrice * (taxFeePercent / 100);
        const notaryFee = purchasePrice * (notaryFeePercent / 100);
        const totalFees = agentFee + taxFee + notaryFee;

        // 3. Calculate Summary Values
        const totalCost = purchasePrice + totalFees;
        let initialLoanAmount = totalCost - downPayment;
        if (initialLoanAmount < 0) initialLoanAmount = 0; // Cannot have negative loan

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

        if (initialLoanAmount <= 0 || monthlyPayment <= 0 || interestRatePercent < 0) {
            payoffSummaryP.textContent = "Bitte gültige Werte für Darlehen, Rate und Zinssatz eingeben.";
            displaySchedule(); // Clear schedule table
            return; // Stop calculation if inputs are invalid for amortization
        }

        // Estimate minimum payment required to cover interest
        const minPayment = remainingBalance * monthlyInterestRate;
        if (monthlyPayment <= minPayment && unscheduledYearlyPayment <= 0) {
            payoffSummaryP.textContent = `Die monatliche Rate von ${formatCurrency(monthlyPayment)} reicht nicht aus, um die Zinsen (${formatCurrency(minPayment)}) zu decken. Das Darlehen wird nie zurückgezahlt.`;
            displaySchedule(); // Clear schedule table
            return;
        }


        let safetyBreak = 0; // Prevent potential infinite loops
        const MAX_MONTHS = 600; // 50 years limit

        while (remainingBalance > 0 && safetyBreak < MAX_MONTHS) {
            month++;
            safetyBreak++;

            let interestForMonth = remainingBalance * monthlyInterestRate;
            let principalForMonth = monthlyPayment - interestForMonth;
            let paymentThisMonth = monthlyPayment;

            // Adjust for last payment
            if (principalForMonth > remainingBalance) {
                principalForMonth = remainingBalance;
                paymentThisMonth = principalForMonth + interestForMonth;
            }

            if (paymentThisMonth < 0) paymentThisMonth = 0; // Cannot have negative payment
            if (interestForMonth < 0) interestForMonth = 0;
            if (principalForMonth < 0) principalForMonth = 0; // If rate only covers interest partially


            remainingBalance -= principalForMonth;
            totalInterestPaid += interestForMonth;

            // Store monthly data BEFORE potential unscheduled payment
            monthlyScheduleData.push({
                period: month,
                totalPayment: paymentThisMonth, // Regular payment
                interestPaid: interestForMonth,
                principalPaid: principalForMonth,
                unscheduled: 0, // Placeholder for unscheduled payment this month
                balance: remainingBalance // Balance *after* regular payment
            });


            // Apply Unscheduled Yearly Payment at the end of each year (after month 12, 24, etc.)
            if (unscheduledYearlyPayment > 0 && month % 12 === 0 && remainingBalance > 0) {
                const actualUnscheduledPayment = Math.min(unscheduledYearlyPayment, remainingBalance);
                remainingBalance -= actualUnscheduledPayment;
                // Add unscheduled payment info to the last month's record of the year
                monthlyScheduleData[monthlyScheduleData.length - 1].unscheduled = actualUnscheduledPayment;
                monthlyScheduleData[monthlyScheduleData.length - 1].balance = remainingBalance; // Update balance again

                // Note: Total Payment for the *month* doesn't include unscheduled.
                // It could be added or displayed separately if needed.
            }

            // Final check in case unscheduled payment paid it off exactly
            if (remainingBalance < 0.01) { // Use a small threshold for floating point issues
                remainingBalance = 0;
            }
        }

        // 6. Generate Yearly Summary from Monthly Data
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        let yearlyTotalPayment = 0;
        let yearlyUnscheduled = 0;

        monthlyScheduleData.forEach((m, index) => {
            yearlyInterest += m.interestPaid;
            yearlyPrincipal += m.principalPaid;
            yearlyTotalPayment += m.totalPayment; // Regular payments
            yearlyUnscheduled += m.unscheduled;

            if ((index + 1) % 12 === 0 || index === monthlyScheduleData.length - 1) {
                const year = Math.ceil((index + 1) / 12);
                yearlyScheduleData.push({
                    period: year,
                    // Combine regular and unscheduled for total annual outlay
                    totalPayment: yearlyTotalPayment + yearlyUnscheduled,
                    interestPaid: yearlyInterest,
                    // Combine regular principal and unscheduled payment
                    principalPaid: yearlyPrincipal + yearlyUnscheduled,
                    balance: m.balance // Balance at the end of the period (month or year)
                });
                // Reset yearly accumulators
                yearlyInterest = 0;
                yearlyPrincipal = 0;
                yearlyTotalPayment = 0;
                yearlyUnscheduled = 0;
            }
        });


        // 7. Update Payoff Summary
        const years = Math.floor(month / 12);
        const remainingMonths = month % 12;
        let payoffText = `Das Darlehen ist voraussichtlich `;
        if (years > 0) {
            payoffText += `in ca. ${years} Jahr${years > 1 ? 'en' : ''}`;
            if (remainingMonths > 0) {
                payoffText += ` und ${remainingMonths} Monat${remainingMonths > 1 ? 'en' : ''}`;
            }
        } else {
            payoffText += `in ${remainingMonths} Monat${remainingMonths > 1 ? 'en' : ''}`;
        }
        payoffText += ` abbezahlt.`;
        payoffText += ` Gezahlte Gesamtzinsen: ${formatCurrency(totalInterestPaid)}.`;

        if (safetyBreak >= MAX_MONTHS) {
            payoffText = `Berechnungslimit erreicht (${MAX_MONTHS / 12} Jahre). Überprüfen Sie die Eingabewerte. Restschuld: ${formatCurrency(remainingBalance)}`;
        }

        payoffSummaryP.textContent = payoffText;


        // 8. Display Initial Schedule (defaults to monthly)
        displaySchedule();
    };

    // --- Display Schedule Logic ---
    const displaySchedule = () => {
        const selectedView = document.querySelector('input[name="scheduleView"]:checked').value;
        const scheduleData = selectedView === 'yearly' ? yearlyScheduleData : monthlyScheduleData;

        scheduleBody.innerHTML = ''; // Clear previous rows

        if (!scheduleData || scheduleData.length === 0) {
            // Display a message if there's no data (e.g., invalid input)
            const row = scheduleBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5; // Span across all columns
            cell.textContent = 'Keine Tilgungsdaten verfügbar.';
            cell.style.textAlign = 'center';
            return;
        }


        periodHeader.textContent = selectedView === 'yearly' ? 'Jahr' : 'Monat';

        scheduleData.forEach(item => {
            const row = scheduleBody.insertRow();
            row.insertCell().textContent = item.period;
            // For yearly view, totalPayment includes regular + unscheduled
            // For monthly view, totalPayment is just the regular monthly rate (except maybe last month)
            // Unscheduled payment is shown in the principal calculation for yearly.
            row.insertCell().textContent = formatCurrency(item.totalPayment);
            row.insertCell().textContent = formatCurrency(item.interestPaid);
            row.insertCell().textContent = formatCurrency(item.principalPaid); // Includes unscheduled for yearly view
            row.insertCell().textContent = formatCurrency(item.balance);
        });
    };

    // --- Event Listeners ---
    const inputs = [
        purchasePriceInput, downPaymentInput, repaymentAmountInput,
        agentFeeInput, realEstateTaxInput, notaryFeeInput,
        interestRateInput, unscheduledPaymentInput
    ];
    inputs.forEach(input => input.addEventListener('input', calculateMortgage));

    scheduleViewRadios.forEach(radio => radio.addEventListener('change', displaySchedule));

    // --- Initial Calculation on Load ---
    calculateMortgage();
});