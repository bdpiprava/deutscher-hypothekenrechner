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
    const paginationControlsDiv = document.querySelector('.pagination-controls');

    // --- Language Elements ---
    const langDeBtn = document.getElementById('lang-de-btn');
    const langEnBtn = document.getElementById('lang-en-btn');
    const htmlElement = document.documentElement;

    // --- Global Variables ---
    let monthlyScheduleData = [];
    let yearlyScheduleData = [];
    let currentLang = 'de'; // Default language

    // --- Pagination State ---
    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    // --- Translations ---
    const translations = {
        'de': {
            'title': 'Immobilienkredit Rechner',
            'mainHeading': 'Immobilienkredit Rechner',
            'inputsHeading': 'Eingaben',
            'purchasePriceLabel': 'Kaufpreis (€):',
            'downPaymentLabel': 'Eigenkapital (€):',
            'repaymentAmountLabel': 'Monatliche Rate (€):',
            'agentFeeLabel': 'Maklerprovision (%):',
            'realEstateTaxLabel': 'Grunderwerbsteuer (%):',
            'notaryFeeLabel': 'Notar- & Grundbuchkosten (%):',
            'interestRateLabel': 'Sollzinssatz (% p.a.):',
            'unscheduledPaymentLabel': 'Jährliche Sondertilgung (€):',
            'unscheduledPaymentYearsLabel': 'Sondertilgung für Jahre:',
            'unscheduledPaymentYearsPlaceholder': '0 = unbegrenzt',
            'summaryHeading': 'Zusammenfassung',
            'summaryPurchasePriceLabel': 'Kaufpreis',
            'summaryTotalFeesLabel': 'Kaufnebenkosten',
            'summaryAgentFeeLabel': 'Maklerprovision',
            'summaryTaxFeeLabel': 'Grunderwerbsteuer',
            'summaryNotaryFeeLabel': 'Notar- & Grundbuchkosten',
            'summaryTotalCostLabel': 'Gesamtkosten (Preis + Nebenkosten)',
            'summaryDownPaymentLabel': 'Eigenkapital',
            'summaryLoanAmountLabel': 'Initialer Darlehensbetrag',
            'scheduleHeading': 'Tilgungsplan',
            'scheduleYearlyLabel': 'Jährlich',
            'scheduleMonthlyLabel': 'Monatlich',
            'thTotalPayment': 'Gesamtzahlung',
            'thInterest': 'Zinsanteil',
            'thPrincipal': 'Tilgungsanteil',
            'thBalance': 'Restschuld',
            'prevPageBtn': '&laquo; Zurück',
            'nextPageBtn': 'Weiter &raquo;',
            // Dynamic text parts
            'periodHeaderYear': 'Jahr',
            'periodHeaderMonth': 'Monat',
            'pageInfo': 'Seite {currentPage} von {totalPages}',
            'payoffCalculating': 'Berechne...',
            'payoffNoLoan': 'Kein Darlehen erforderlich (Eigenkapital deckt Gesamtkosten).',
            'payoffInvalidInput': 'Bitte gültige Werte für Rate (> 0) und Zinssatz (>= 0) eingeben.',
            'payoffRateWarning': 'Warnung: Die monatliche Rate ({monthlyPayment}) reicht nicht aus, um die anfänglichen Zinsen ({minPayment}) zu decken. Ohne Sondertilgungen wird das Darlehen nie zurückgezahlt.',
            'payoffCompletePrefix': 'Das Darlehen ist voraussichtlich ',
            'payoffCompleteSuffix': ' abbezahlt.',
            'payoffCompleteInterest': ' Gezahlte Gesamtzinsen: {totalInterest}.',
            'payoffInYears': 'in {years} Jahr', // Singular
            'payoffInYearsPlural': 'in {years} Jahren', // Plural
            'payoffAndMonths': ' und {months} Monat', // Singular
            'payoffAndMonthsPlural': ' und {months} Monaten', // Plural
            'payoffInMonths': 'in {months} Monat', // Singular
            'payoffInMonthsPlural': 'in {months} Monaten', // Plural
            'payoffLimitReached': 'Berechnungslimit erreicht ({maxYears} Jahre). Das Darlehen konnte mit den aktuellen Eingaben nicht vollständig zurückgezahlt werden. Restschuld: {remainingBalance}',
            'payoffIncomplete': 'Berechnung unvollständig. Restschuld: {remainingBalance}',
            'noScheduleData': 'Keine Tilgungsdaten verfügbar oder Darlehen nicht erforderlich.'
        },
        'en': {
            'title': 'Mortgage Calculator',
            'mainHeading': 'Mortgage Calculator',
            'inputsHeading': 'Inputs',
            'purchasePriceLabel': 'Purchase Price (€):',
            'downPaymentLabel': 'Down Payment (€):',
            'repaymentAmountLabel': 'Monthly Payment (€):',
            'agentFeeLabel': 'Agent Fee (%):',
            'realEstateTaxLabel': 'Real Estate Transfer Tax (%):',
            'notaryFeeLabel': 'Notary & Land Registry Fees (%):',
            'interestRateLabel': 'Nominal Interest Rate (% p.a.):',
            'unscheduledPaymentLabel': 'Annual Unscheduled Payment (€):',
            'unscheduledPaymentYearsLabel': 'Unscheduled Payments for Years:',
            'unscheduledPaymentYearsPlaceholder': '0 = unlimited',
            'summaryHeading': 'Summary',
            'summaryPurchasePriceLabel': 'Purchase Price',
            'summaryTotalFeesLabel': 'Ancillary Purchase Costs',
            'summaryAgentFeeLabel': 'Agent Fee',
            'summaryTaxFeeLabel': 'Real Estate Transfer Tax',
            'summaryNotaryFeeLabel': 'Notary & Land Registry Fees',
            'summaryTotalCostLabel': 'Total Cost (Price + Fees)',
            'summaryDownPaymentLabel': 'Down Payment',
            'summaryLoanAmountLabel': 'Initial Loan Amount',
            'scheduleHeading': 'Amortization Schedule',
            'scheduleYearlyLabel': 'Yearly',
            'scheduleMonthlyLabel': 'Monthly',
            'thTotalPayment': 'Total Payment',
            'thInterest': 'Interest Portion',
            'thPrincipal': 'Principal Portion',
            'thBalance': 'Remaining Balance',
            'prevPageBtn': '&laquo; Previous',
            'nextPageBtn': 'Next &raquo;',
            // Dynamic text parts
            'periodHeaderYear': 'Year',
            'periodHeaderMonth': 'Month',
            'pageInfo': 'Page {currentPage} of {totalPages}',
            'payoffCalculating': 'Calculating...',
            'payoffNoLoan': 'No loan required (down payment covers total costs).',
            'payoffInvalidInput': 'Please enter valid values for Payment (> 0) and Interest Rate (>= 0).',
            'payoffRateWarning': 'Warning: The monthly payment ({monthlyPayment}) is not sufficient to cover the initial interest ({minPayment}). Without unscheduled payments, the loan will never be paid off.',
            'payoffCompletePrefix': 'The loan is expected to be paid off ',
            'payoffCompleteSuffix': '.',
            'payoffCompleteInterest': ' Total interest paid: {totalInterest}.',
            'payoffInYears': 'in {years} year', // Singular
            'payoffInYearsPlural': 'in {years} years', // Plural
            'payoffAndMonths': ' and {months} month', // Singular
            'payoffAndMonthsPlural': ' and {months} months', // Plural
            'payoffInMonths': 'in {months} month', // Singular
            'payoffInMonthsPlural': 'in {months} months', // Plural
            'payoffLimitReached': 'Calculation limit reached ({maxYears} years). The loan could not be fully repaid with the current inputs. Remaining balance: {remainingBalance}',
            'payoffIncomplete': 'Calculation incomplete. Remaining balance: {remainingBalance}',
            'noScheduleData': 'No amortization data available or loan not required.'
        }
    };

    // --- Helper Functions ---
    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'N/A';
        }
        // Using de-DE locale for consistent EUR formatting regardless of UI language
        return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    };

    const getNumericValue = (element, defaultValue = 0) => {
        if (!element) return defaultValue;
        const value = parseFloat(element.value);
        return isNaN(value) ? defaultValue : value;
    };

    // --- Language Switching Logic ---
    const setLanguage = (lang) => {
        if (!translations[lang]) return; // Language not supported
        currentLang = lang;
        localStorage.setItem('mortgageCalculatorLang', lang); // Store preference
        htmlElement.lang = lang; // Update html lang attribute

        const trans = translations[lang];

        // Update all elements with IDs matching translation keys
        Object.keys(trans).forEach(key => {
            const element = document.getElementById(`lang-${key}`);
            if (element) {
                // Handle specific element types if needed (e.g., buttons, inputs)
                if (element.tagName === 'BUTTON' || element.tagName === 'SPAN' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'TH' || element.tagName === 'LABEL' || element.tagName === 'TITLE') {
                    element.innerHTML = trans[key]; // Use innerHTML for buttons with entities like &laquo;
                } else {
                    element.textContent = trans[key];
                }
            }
            // Update placeholders
            const placeholderElement = document.querySelector(`[data-placeholder-key="${key}"]`);
            if (placeholderElement) {
                placeholderElement.placeholder = trans[key];
            }
        });

        // Update button active states
        if (lang === 'de') {
            langDeBtn.classList.add('active');
            langEnBtn.classList.remove('active');
        } else {
            langEnBtn.classList.add('active');
            langDeBtn.classList.remove('active');
        }

        // Recalculate and update dynamic text
        calculateMortgage();
    };

    // --- Core Calculation Logic ---
    const calculateMortgage = () => {
        // 1. Get Input Values (remains the same)
        const purchasePrice = getNumericValue(purchasePriceInput, 0);
        const downPayment = getNumericValue(downPaymentInput, 0);
        const monthlyPayment = getNumericValue(repaymentAmountInput, 0);
        const agentFeePercent = getNumericValue(agentFeeInput, 0);
        const taxFeePercent = getNumericValue(realEstateTaxInput, 0);
        const notaryFeePercent = getNumericValue(notaryFeeInput, 0);
        const interestRatePercent = getNumericValue(interestRateInput, 0);
        const unscheduledYearlyPayment = getNumericValue(unscheduledPaymentInput, 0);
        const unscheduledPaymentYears = getNumericValue(unscheduledPaymentYearsInput, 0);

        // 2. Calculate Fees (remains the same)
        const agentFee = purchasePrice * (agentFeePercent / 100);
        const taxFee = purchasePrice * (taxFeePercent / 100);
        const notaryFee = purchasePrice * (notaryFeePercent / 100);
        const totalFees = agentFee + taxFee + notaryFee;

        // 3. Calculate Summary Values (remains the same)
        const totalCost = purchasePrice + totalFees;
        let initialLoanAmount = totalCost - downPayment;
        if (initialLoanAmount < 0) initialLoanAmount = 0;

        // 4. Update Summary Display (uses formatCurrency, no text change here)
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
        const trans = translations[currentLang]; // Get current language translations

        payoffSummaryP.textContent = trans.payoffCalculating;
        scheduleBody.innerHTML = '';

        if (initialLoanAmount <= 0) {
            payoffSummaryP.textContent = trans.payoffNoLoan;
            currentPage = 1;
            displaySchedule();
            return;
        }

        if (monthlyPayment <= 0 || interestRatePercent < 0) {
            payoffSummaryP.textContent = trans.payoffInvalidInput;
            currentPage = 1;
            displaySchedule();
            return;
        }

        const minPayment = remainingBalance * monthlyInterestRate;
        if (monthlyPayment <= minPayment && unscheduledYearlyPayment <= 0 && interestRatePercent > 0) { // Added check for interestRate > 0
            payoffSummaryP.textContent = trans.payoffRateWarning
                .replace('{monthlyPayment}', formatCurrency(monthlyPayment))
                .replace('{minPayment}', formatCurrency(minPayment));
            // Continue calculation, but show warning
        } else {
            payoffSummaryP.textContent = trans.payoffCalculating; // Reset if warning condition not met
        }


        let safetyBreak = 0;
        const MAX_MONTHS = 720; // 60 years limit

        while (remainingBalance > 0 && safetyBreak < MAX_MONTHS) {
            month++;
            safetyBreak++;

            let interestForMonth = remainingBalance * monthlyInterestRate;
            if (interestForMonth < 0) interestForMonth = 0;

            let principalForMonth = monthlyPayment - interestForMonth;
            let paymentThisMonth = monthlyPayment;

            // If interest is higher than payment, principal becomes 0 (or negative, handled below)
            // Payment only covers interest in this case (unless it's the final payment)
            if (principalForMonth < 0) {
                paymentThisMonth = interestForMonth; // Only pay interest if payment doesn't cover it
                principalForMonth = 0;
            }


            // Check if this is the final payment
            if (remainingBalance + interestForMonth <= monthlyPayment) {
                interestForMonth = remainingBalance * monthlyInterestRate;
                if (interestForMonth < 0) interestForMonth = 0;
                principalForMonth = remainingBalance; // Pay off the exact remaining balance
                paymentThisMonth = principalForMonth + interestForMonth; // Final payment amount
            }

            // Ensure values are not negative due to floating point issues or edge cases
            paymentThisMonth = Math.max(0, paymentThisMonth);
            interestForMonth = Math.max(0, interestForMonth);
            principalForMonth = Math.max(0, principalForMonth);

            const balanceBeforePayment = remainingBalance;
            remainingBalance -= principalForMonth;
            totalInterestPaid += interestForMonth;

            // Handle potential floating point inaccuracies near zero
            if (remainingBalance < 0.005) {
                totalInterestPaid -= (0 - remainingBalance); // Adjust interest if we overpaid slightly
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

            // Apply unscheduled payment at the end of each year (month % 12 === 0)
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
                    // Update total payment for the month to include unscheduled
                    monthlyScheduleData[lastMonthIndex].totalPayment += actualUnscheduledPayment;
                    // Update balance for the month
                    monthlyScheduleData[lastMonthIndex].balance = remainingBalance;
                }
            }

            if (remainingBalance <= 0) {
                break; // Exit loop if loan is paid off
            }
        } // End while loop

        // 6. Generate Yearly Summary from Monthly Data (remains the same logic)
        yearlyScheduleData = [];
        let yearlyInterest = 0;
        let yearlyPrincipal = 0; // Includes regular principal + unscheduled
        let yearlyTotalPayment = 0; // Includes regular payment + unscheduled

        monthlyScheduleData.forEach((m, index) => {
            yearlyInterest += m.interestPaid;
            yearlyPrincipal += m.principalPaid + m.unscheduled; // Sum both principals for the year
            yearlyTotalPayment += m.totalPayment; // Already includes unscheduled in monthly data

            if ((index + 1) % 12 === 0 || index === monthlyScheduleData.length - 1) {
                const year = Math.ceil((index + 1) / 12);
                yearlyScheduleData.push({
                    period: year,
                    totalPayment: yearlyTotalPayment,
                    interestPaid: yearlyInterest,
                    principalPaid: yearlyPrincipal, // This now represents total principal reduction for the year
                    balance: m.balance
                });
                // Reset yearly accumulators
                yearlyInterest = 0;
                yearlyPrincipal = 0;
                yearlyTotalPayment = 0;
            }
        });

        // 7. Update Payoff Summary (using translations)
        if (remainingBalance <= 0) {
            const totalMonths = month;
            const years = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            let payoffText = trans.payoffCompletePrefix;

            if (years > 0) {
                payoffText += (years > 1 ? trans.payoffInYearsPlural : trans.payoffInYears).replace('{years}', years);
                if (remainingMonths > 0) {
                    payoffText += (remainingMonths > 1 ? trans.payoffAndMonthsPlural : trans.payoffAndMonths).replace('{months}', remainingMonths);
                }
            } else {
                payoffText += (remainingMonths > 1 ? trans.payoffInMonthsPlural : trans.payoffInMonths).replace('{months}', remainingMonths);
            }
            payoffText += trans.payoffCompleteSuffix;
            payoffText += trans.payoffCompleteInterest.replace('{totalInterest}', formatCurrency(totalInterestPaid));
            payoffSummaryP.textContent = payoffText;
        } else if (safetyBreak >= MAX_MONTHS) {
            payoffSummaryP.textContent = trans.payoffLimitReached
                .replace('{maxYears}', Math.floor(MAX_MONTHS / 12))
                .replace('{remainingBalance}', formatCurrency(remainingBalance));
        } else if (payoffSummaryP.textContent === trans.payoffCalculating) { // Only show incomplete if no other message was set
            payoffSummaryP.textContent = trans.payoffIncomplete.replace('{remainingBalance}', formatCurrency(remainingBalance));
        }


        // 8. Reset pagination and Display Initial Schedule
        currentPage = 1;
        displaySchedule();
    };

    // --- Display Schedule Logic (with Pagination and Language) ---
    const displaySchedule = () => {
        const selectedView = document.querySelector('input[name="scheduleView"]:checked').value;
        const fullScheduleData = selectedView === 'yearly' ? yearlyScheduleData : monthlyScheduleData;
        const trans = translations[currentLang]; // Get current translations

        scheduleBody.innerHTML = ''; // Clear previous rows

        // Calculate pagination parameters
        const totalItems = fullScheduleData.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        if (currentPage < 1) {
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedData = fullScheduleData.slice(startIndex, endIndex);

        // Update Period Header using translations
        periodHeader.textContent = selectedView === 'yearly' ? trans.periodHeaderYear : trans.periodHeaderMonth;

        // Render the current page's data
        if (paginatedData.length === 0 && totalItems === 0) {
            const row = scheduleBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5; // Matches number of columns
            cell.textContent = trans.noScheduleData;
            cell.style.textAlign = 'center';
        } else {
            paginatedData.forEach(item => {
                const row = scheduleBody.insertRow();
                row.insertCell().textContent = item.period;
                // For yearly view, item.totalPayment already includes unscheduled
                // For monthly view, item.totalPayment was updated to include unscheduled if applied that month
                row.insertCell().textContent = formatCurrency(item.totalPayment);
                row.insertCell().textContent = formatCurrency(item.interestPaid);
                // For yearly view, item.principalPaid includes unscheduled
                // For monthly view, show regular principal + unscheduled for that specific month
                const principalShown = selectedView === 'monthly' ? item.principalPaid + item.unscheduled : item.principalPaid;
                row.insertCell().textContent = formatCurrency(principalShown);
                row.insertCell().textContent = formatCurrency(item.balance);
            });
        }

        // Update Pagination Controls using translations
        if (totalPages <= 1) {
            paginationControlsDiv.style.display = 'none';
        } else {
            paginationControlsDiv.style.display = 'flex';
            pageInfoSpan.textContent = trans.pageInfo
                .replace('{currentPage}', currentPage)
                .replace('{totalPages}', totalPages);
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

    scheduleViewRadios.forEach(radio => radio.addEventListener('change', () => {
        currentPage = 1;
        displaySchedule();
    }));

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displaySchedule();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const selectedView = document.querySelector('input[name="scheduleView"]:checked').value;
        const fullScheduleData = selectedView === 'yearly' ? yearlyScheduleData : monthlyScheduleData;
        const totalPages = Math.ceil(fullScheduleData.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            displaySchedule();
        }
    });

    // Language Button Listeners
    langDeBtn.addEventListener('click', () => setLanguage('de'));
    langEnBtn.addEventListener('click', () => setLanguage('en'));

    // --- Initial Setup ---
    // Check localStorage for saved language preference
    const savedLang = localStorage.getItem('mortgageCalculatorLang');
    if (savedLang && translations[savedLang]) {
        setLanguage(savedLang); // Apply saved language
    } else {
        // Optional: Detect browser language (simple version)
        // const browserLang = navigator.language.split('-')[0];
        // if (browserLang === 'en') {
        //     setLanguage('en');
        // } else {
        setLanguage('de'); // Default to German if no preference/detection
        // }
    }
    // Initial calculation is triggered by setLanguage()
});