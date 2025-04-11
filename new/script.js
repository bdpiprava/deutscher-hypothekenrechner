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
    // Get the new input element
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

    // --- Global Variables for Schedule Data ---
    let monthlyScheduleData = [];
    let yearlyScheduleData = [];

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        // Add error handling for non-numeric values if necessary
        if (typeof value !== 'number' || isNaN(value)) {
            return 'N/A'; // Or some other placeholder
        }
        return value.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'});
    };

    const getNumericValue = (element, defaultValue = 0) => {
        // Ensure element exists before trying to read its value
        if (!element) return defaultValue;
        const value = parseFloat(element.value);
        return isNaN(value) ? defaultValue : value;
    };

    // --- Core Calculation Logic ---
    const calculateMortgage = () => {
        // 1. Get Input Values
        const purchasePrice = getNumericValue(purchasePriceInput, 0); // Use 0 as default for calculations
        const downPayment = getNumericValue(downPaymentInput, 0);
        const monthlyPayment = getNumericValue(repaymentAmountInput, 0);
        const agentFeePercent = getNumericValue(agentFeeInput, 0);
        const taxFeePercent = getNumericValue(realEstateTaxInput, 0);
        const notaryFeePercent = getNumericValue(notaryFeeInput, 0);
        const interestRatePercent = getNumericValue(interestRateInput, 0);
        const unscheduledYearlyPayment = getNumericValue(unscheduledPaymentInput, 0);
        // Read the new input value
        const unscheduledPaymentYears = getNumericValue(unscheduledPaymentYearsInput, 0); // 0 means unlimited

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
        let month = 0; // Use 0-based index internally for easier modulo? No, 1-based is used here.
        const monthlyInterestRate = (interestRatePercent / 100) / 12;

        // Clear previous results and errors
        payoffSummaryP.textContent = 'Berechne...';
        scheduleBody.innerHTML = ''; // Clear table early

        if (initialLoanAmount <= 0) {
            payoffSummaryP.textContent = "Kein Darlehen erforderlich (Eigenkapital deckt Gesamtkosten).";
            displaySchedule(); // Display empty schedule
            return;
        }

        if (monthlyPayment <= 0 || interestRatePercent < 0) {
            payoffSummaryP.textContent = "Bitte gltige Werte für Rate (> 0) und Zinssatz (>= 0) eingeben.";
            displaySchedule(); // Clear schedule table
            return; // Stop calculation if inputs are invalid for amortization
        }

        // Estimate minimum payment required to cover initial interest
        const minPayment = remainingBalance * monthlyInterestRate;
        // Allow calculation even if payment doesn't cover interest initially,
        // but warn if it *never* will (i.e., no unscheduled payment either)
        if (monthlyPayment <= minPayment && unscheduledYearlyPayment <= 0) {
            payoffSummaryP.textContent = `Warnung: Die monatliche Rate (${formatCurrency(monthlyPayment)}) reicht nicht aus, um die anfänglichen Zinsen (${formatCurrency(minPayment)}) zu decken. Ohne Sondertilgungen wird das Darlehen nie zurückgezahlt.`;
            // Don't return here, let the loop run to show increasing debt if needed, but limit iterations.
        }


        let safetyBreak = 0; // Prevent potential infinite loops
        const MAX_MONTHS = 720; // 60 years limit - increased slightly

        while (remainingBalance > 0 && safetyBreak < MAX_MONTHS) {
            month++;
            safetyBreak++;

            let interestForMonth = remainingBalance * monthlyInterestRate;
            // Ensure interest is not negative (can happen with negative rates, though unlikely)
            if (interestForMonth < 0) interestForMonth = 0;

            let principalForMonth = monthlyPayment - interestForMonth;
            let paymentThisMonth = monthlyPayment;

            // If interest exceeds payment, principal becomes negative (debt increases)
            // We allow this, but cap the principal reduction at 0 minimum.
            if (principalForMonth < 0) {
                principalForMonth = 0;
            }

            // Adjust for last payment - pay exactly the remaining balance + interest for that balance
            if (remainingBalance + interestForMonth <= monthlyPayment) {
                principalForMonth = remainingBalance;
                paymentThisMonth = principalForMonth + interestForMonth;
                interestForMonth = remainingBalance * monthlyInterestRate; // Recalculate interest on the exact remaining balance
                if (interestForMonth < 0) interestForMonth = 0;
                principalForMonth = remainingBalance; // Principal is exactly what's left
                paymentThisMonth = principalForMonth + interestForMonth;
            }


            // Ensure values are non-negative before storing/subtracting
            paymentThisMonth = Math.max(0, paymentThisMonth);
            interestForMonth = Math.max(0, interestForMonth);
            principalForMonth = Math.max(0, principalForMonth);


            remainingBalance -= principalForMonth;
            totalInterestPaid += interestForMonth;

            // Handle potential floating point inaccuracies near zero
            if (remainingBalance < 0.005) {
                remainingBalance = 0;
            }

            // Store monthly data BEFORE potential unscheduled payment
            monthlyScheduleData.push({
                period: month,
                totalPayment: paymentThisMonth, // Regular payment
                interestPaid: interestForMonth,
                principalPaid: principalForMonth,
                unscheduled: 0, // Placeholder for unscheduled payment this month
                balance: remainingBalance // Balance *after* regular payment but *before* potential unscheduled
            });

            // --- Apply Unscheduled Yearly Payment Logic ---
            // Check if it's the end of a year (month 12, 24, etc.)
            if (unscheduledYearlyPayment > 0 && month % 12 === 0 && remainingBalance > 0) {
                // Calculate the current year (1-based)
                const currentYear = Math.ceil(month / 12);

                // Check if unscheduled payments are limited by years and if we are within that limit
                let applyUnscheduledThisYear = false;
                if (unscheduledPaymentYears > 0) { // Is there a limit set?
                    if (currentYear <= unscheduledPaymentYears) { // Are we within the limited years?
                        applyUnscheduledThisYear = true;
                    }
                } else { // No limit set (unscheduledPaymentYears is 0 or less), apply always
                    applyUnscheduledThisYear = true;
                }

                // Apply the payment if conditions met
                if (applyUnscheduledThisYear) {
                    const actualUnscheduledPayment = Math.min(unscheduledYearlyPayment, remainingBalance);
                    remainingBalance -= actualUnscheduledPayment;

                    // Handle potential floating point inaccuracies near zero after unscheduled payment
                    if (remainingBalance < 0.005) {
                        remainingBalance = 0;
                    }

                    // Add unscheduled payment info to the last month's record of the year
                    const lastMonthIndex = monthlyScheduleData.length - 1;
                    monthlyScheduleData[lastMonthIndex].unscheduled = actualUnscheduledPayment;
                    // Update the balance in the record to reflect the state *after* the unscheduled payment
                    monthlyScheduleData[lastMonthIndex].balance = remainingBalance;
                }
            }

            // Break loop if balance is paid off
            if (remainingBalance <= 0) {
                break;
            }
        } // End while loop

        // 6. Generate Yearly Summary from Monthly Data
        yearlyScheduleData = []; // Clear previous yearly data
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        let yearlyTotalPayment = 0;
        let yearlyUnscheduled = 0;

        monthlyScheduleData.forEach((m, index) => {
            yearlyInterest += m.interestPaid;
            yearlyPrincipal += m.principalPaid;
            yearlyTotalPayment += m.totalPayment; // Accumulate regular payments
            yearlyUnscheduled += m.unscheduled; // Accumulate unscheduled payments

            // If it's the last month of a year OR the very last month of the loan
            if ((index + 1) % 12 === 0 || index === monthlyScheduleData.length - 1) {
                const year = Math.ceil((index + 1) / 12);
                yearlyScheduleData.push({
                    period: year,
                    // Total payment for the year = sum of monthly payments + sum of unscheduled payments in that year
                    totalPayment: yearlyTotalPayment + yearlyUnscheduled,
                    interestPaid: yearlyInterest,
                    // Total principal reduction for the year = sum of monthly principal + sum of unscheduled
                    principalPaid: yearlyPrincipal + yearlyUnscheduled,
                    balance: m.balance // Balance at the end of the period (last month of the year or final month)
                });
                // Reset yearly accumulators for the next year
                yearlyInterest = 0;
                yearlyPrincipal = 0;
                yearlyTotalPayment = 0;
                yearlyUnscheduled = 0;
            }
        });


        // 7. Update Payoff Summary
        if (remainingBalance <= 0) { // Loan paid off
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
        } else if (safetyBreak >= MAX_MONTHS) { // Hit calculation limit
            payoffSummaryP.textContent = `Berechnungslimit erreicht (${Math.floor(MAX_MONTHS / 12)} Jahre). Das Darlehen konnte mit den aktuellen Eingaben nicht vollständig zurückgezahlt werden. Restschuld: ${formatCurrency(remainingBalance)}`;
        } else {
            // This case should ideally not be reached if the initial checks are correct,
            // but as a fallback:
            payoffSummaryP.textContent = `Berechnung unvollständig. Restschuld: ${formatCurrency(remainingBalance)}`;
        }


        // 8. Display Initial Schedule (respects current view selection)
        displaySchedule();
    };

    // --- Display Schedule Logic ---
    const displaySchedule = () => {
        const selectedView = document.querySelector('input[name="scheduleView"]:checked').value;
        // Use the globally calculated data
        const scheduleData = selectedView === 'yearly' ? yearlyScheduleData : monthlyScheduleData;

        scheduleBody.innerHTML = ''; // Clear previous rows

        if (!scheduleData || scheduleData.length === 0) {
            // Display a message if there's no data (e.g., invalid input, loan paid instantly)
            const row = scheduleBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5; // Span across all columns
            cell.textContent = 'Keine Tilgungsdaten verfügbar oder Darlehen nicht erforderlich.';
            cell.style.textAlign = 'center';
            return;
        }


        periodHeader.textContent = selectedView === 'yearly' ? 'Jahr' : 'Monat';

        scheduleData.forEach(item => {
            const row = scheduleBody.insertRow();
            row.insertCell().textContent = item.period;
            // Yearly view: item.totalPayment already includes regular + unscheduled for the year.
            // Monthly view: item.totalPayment is the regular payment (except maybe last).
            // We could add a separate column for unscheduled if needed for monthly, but
            // current yearly calculation sums it into principalPaid and totalPayment.
            row.insertCell().textContent = formatCurrency(item.totalPayment);
            row.insertCell().textContent = formatCurrency(item.interestPaid);
            // Yearly view: item.principalPaid includes regular principal + unscheduled.
            // Monthly view: item.principalPaid is regular principal. item.unscheduled holds the extra payment for that month (if any).
            row.insertCell().textContent = formatCurrency(item.principalPaid + (selectedView === 'monthly' ? item.unscheduled : 0)); // Show total principal reduction
            row.insertCell().textContent = formatCurrency(item.balance);
        });
    };

    // --- Event Listeners ---
    const inputs = [
        purchasePriceInput, downPaymentInput, repaymentAmountInput,
        agentFeeInput, realEstateTaxInput, notaryFeeInput,
        interestRateInput, unscheduledPaymentInput,
        unscheduledPaymentYearsInput // Add listener for the new input
    ];
    // Use 'input' for immediate feedback, 'change' might be slightly less resource intensive
    inputs.forEach(input => {
        if (input) { // Check if element exists before adding listener
            input.addEventListener('input', calculateMortgage);
        }
    });


    scheduleViewRadios.forEach(radio => radio.addEventListener('change', displaySchedule));

    // --- Initial Calculation on Load ---
    calculateMortgage();
});