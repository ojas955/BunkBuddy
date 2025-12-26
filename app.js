/**
 * BunkBuddy - Main Application Logic
 * Handles all UI interactions and state management
 */

// ============================================================================
// Global State
// ============================================================================

let appState = {
  rotations: [],
  attendanceRecords: {}, // { 'YYYY-MM-DD': 'attended' | 'cancelled' | 'unmarked' }
  holidays: [],
  targetPercentage: 80,
  workingDaysPerWeek: 6,
  enableNotifications: false,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  sessions: [],
  weeklyTrendsChart: null,
};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  attachEventListeners();
  loadDataFromStorage();
  render();
});

function initializeApp() {
  // Initialize with default data if nothing exists
  const savedState = localStorage.getItem("bunkbuddy_state");
  if (!savedState) {
    // First-time user: create default rotation
    appState.rotations = [
      {
        id: generateId(),
        subject: "Sample Rotation",
        startDate: formatDateToYYYYMMDD(new Date()),
        endDate: formatDateToYYYYMMDD(addDays(new Date(), 30)),
      },
    ];
    appState.targetPercentage = 80;
    appState.workingDaysPerWeek = 6;
    appState.enableNotifications = false;
    appState.holidays = [];
    appState.attendanceRecords = {};
    saveDataToStorage();
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

function attachEventListeners() {
  // Tab Navigation
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", function () {
      switchTab(this.dataset.tab);
    });
  });

  // Dashboard
  document
    .getElementById("exportReportBtn")
    .addEventListener("click", exportReport);

  // Tracker
  document
    .getElementById("prevMonthBtn")
    .addEventListener("click", previousMonth);
  document.getElementById("nextMonthBtn").addEventListener("click", nextMonth);

  // Settings - Rotations
  document
    .getElementById("addRotationBtn")
    .addEventListener("click", showRotationForm);
  document
    .getElementById("saveRotationBtn")
    .addEventListener("click", saveNewRotation);
  document
    .getElementById("cancelRotationBtn")
    .addEventListener("click", hideRotationForm);

  // Settings - Holidays
  document
    .getElementById("addHolidayBtn")
    .addEventListener("click", addHoliday);

  // Settings - Data Management
  document
    .getElementById("saveSettingsBtn")
    .addEventListener("click", saveSettings);
  document
    .getElementById("exportDataBtn")
    .addEventListener("click", exportData);
  document
    .getElementById("importDataBtn")
    .addEventListener("click", triggerFileImport);
  document
    .getElementById("importFileInput")
    .addEventListener("change", importData);
  document
    .getElementById("resetDataBtn")
    .addEventListener("click", confirmReset);

  // Modal
  document
    .getElementById("confirmYesBtn")
    .addEventListener("click", executeConfirmedAction);
  document.getElementById("confirmNoBtn").addEventListener("click", closeModal);
}

// ============================================================================
// Tab Navigation
// ============================================================================

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Deactivate all buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName).classList.add("active");

  // Activate selected button
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  // Re-render tab if needed
  if (tabName === "tracker") {
    renderTracker();
  } else if (tabName === "dashboard") {
    renderDashboard();
  } else if (tabName === "settings") {
    renderSettings();
  }
}

// ============================================================================
// Dashboard Rendering
// ============================================================================

function renderDashboard() {
  updateSessions();
  const metrics = calculateAttendanceMetrics(
    appState.attendanceRecords,
    appState.sessions,
    appState.rotations
  );

  // Attendance Percentage
  document.getElementById(
    "attendancePercentage"
  ).textContent = `${metrics.overall.percentage}%`;
  document.getElementById(
    "attendanceSessionsInfo"
  ).textContent = `${metrics.overall.attended} / ${metrics.overall.total} sessions`;

  // Classes Needed
  const classesForTarget = calculateClassesNeeded(
    metrics,
    appState.targetPercentage
  );
  const classesFor75 = calculateClassesNeededForThreshold(metrics, 75);
  const classesFor80 = calculateClassesNeededForThreshold(metrics, 80);

  document.getElementById("classesForTarget").textContent = classesForTarget;
  document.getElementById("classesFor75").textContent = classesFor75;
  document.getElementById("classesFor80").textContent = classesFor80;

  // Subject-wise Attendance
  renderSubjectWiseAttendance(metrics);

  // Weekly Trends Chart
  renderWeeklyTrendsChart(metrics);
}

function renderSubjectWiseAttendance(metrics) {
  const container = document.getElementById("subjectWiseAttendance");

  if (appState.rotations.length === 0) {
    container.innerHTML =
      '<p class="empty-message">No active rotations. Set up in Settings tab.</p>';
    return;
  }

  let html = "";
  let hasData = false;

  appState.rotations.forEach((rotation) => {
    const data = metrics.bySubject[rotation.subject];
    if (data && data.total > 0) {
      hasData = true;
      html += `
                <div class="subject-item">
                    <div class="subject-name">${rotation.subject}</div>
                    <div class="subject-stats">
                        ${data.percentage}% (${data.attended}/${data.total})
                    </div>
                </div>
            `;
    }
  });

  if (!hasData) {
    container.innerHTML =
      '<p class="empty-message">No sessions scheduled yet.</p>';
  } else {
    container.innerHTML = html;
  }
}

function renderWeeklyTrendsChart() {
  updateSessions();
  const weeklyData = calculateWeeklyTrends(
    appState.attendanceRecords,
    appState.sessions,
    appState.rotations,
    appState.workingDaysPerWeek,
    appState.holidays
  );

  const ctx = document.getElementById("weeklyTrendsChart");
  if (!ctx) return;

  const labels = weeklyData.map((week) => {
    const date = new Date(week.weekStart);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const data = weeklyData.map((week) => week.percentage);

  // Destroy existing chart if it exists
  if (appState.weeklyTrendsChart) {
    appState.weeklyTrendsChart.destroy();
  }

  appState.weeklyTrendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length > 0 ? labels : ["No data"],
      datasets: [
        {
          label: "Attendance %",
          data: data.length > 0 ? data : [0],
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#6366f1",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
            color: "#cbd5e1",
          },
          grid: {
            color: "rgba(71, 85, 105, 0.3)",
          },
        },
        x: {
          ticks: {
            color: "#cbd5e1",
          },
          grid: {
            color: "rgba(71, 85, 105, 0.3)",
          },
        },
      },
    },
  });
}

function exportReport() {
  updateSessions();
  const metrics = calculateAttendanceMetrics(
    appState.attendanceRecords,
    appState.sessions,
    appState.rotations
  );
  const classesNeeded = calculateClassesNeeded(
    metrics,
    appState.targetPercentage
  );
  const report = generateTextReport(
    metrics,
    classesNeeded,
    appState.targetPercentage
  );

  const filename = `bunkbuddy_report_${formatDateToYYYYMMDD(new Date())}.txt`;
  downloadFile(report, filename, "text/plain");
  showSuccessMessage("Report exported successfully!");
}

// ============================================================================
// Tracker Rendering
// ============================================================================

function renderTracker() {
  updateSessions();
  renderCalendar();
  renderSessionsList();
}

function renderCalendar() {
  const monthName = getMonthName(appState.currentMonth);
  document.getElementById(
    "currentMonth"
  ).textContent = `${monthName} ${appState.currentYear}`;

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstDay = getFirstDayOfMonth(
    appState.currentYear,
    appState.currentMonth
  );
  const lastDay = getLastDayOfMonth(
    appState.currentYear,
    appState.currentMonth
  );

  // Add empty cells for days before month starts
  const startingDayOfWeek = firstDay.getDay();
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day other-month";
    emptyCell.textContent = "";
    grid.appendChild(emptyCell);
  }

  // Add days of the month
  const today = new Date();
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(appState.currentYear, appState.currentMonth, day);
    const dateStr = formatDateToYYYYMMDD(date);

    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.textContent = day;

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      dayCell.classList.add("today");
    }

    // Check if holiday
    if (isHoliday(date, appState.holidays)) {
      dayCell.classList.add("holiday");
    } else if (isWorkingDay(date, appState.workingDaysPerWeek)) {
      dayCell.classList.add("working-day");

      // Check attendance status
      const status = appState.attendanceRecords[dateStr] || "unmarked";
      if (status === "attended") {
        dayCell.classList.add("attended");
      } else if (status === "cancelled") {
        dayCell.classList.add("cancelled");
      }

      // Add click handler
      dayCell.addEventListener("click", () =>
        cycleAttendanceStatus(dateStr, dayCell)
      );
    } else {
      dayCell.classList.add("non-working-day");
    }

    grid.appendChild(dayCell);
  }

  // Add empty cells for days after month ends
  const totalCells = grid.children.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day other-month";
    emptyCell.textContent = "";
    grid.appendChild(emptyCell);
  }
}

function cycleAttendanceStatus(dateStr, dayCell) {
  const currentStatus = appState.attendanceRecords[dateStr] || "unmarked";
  let newStatus;

  // Unmarked -> Attended -> Cancelled -> Unmarked
  if (currentStatus === "unmarked") {
    newStatus = "attended";
  } else if (currentStatus === "attended") {
    newStatus = "cancelled";
  } else {
    newStatus = "unmarked";
  }

  // Update state
  if (newStatus === "unmarked") {
    delete appState.attendanceRecords[dateStr];
  } else {
    appState.attendanceRecords[dateStr] = newStatus;
  }

  // Update UI
  dayCell.classList.remove("attended", "cancelled");
  if (newStatus === "attended") {
    dayCell.classList.add("attended");
  } else if (newStatus === "cancelled") {
    dayCell.classList.add("cancelled");
  }

  // Save and update
  saveDataToStorage();
  renderDashboard(); // Update dashboard stats
}

function renderSessionsList() {
  const monthSessions = getSessionsForMonth(
    appState.sessions,
    appState.currentYear,
    appState.currentMonth
  );
  const container = document.getElementById("sessionsList");

  if (monthSessions.length === 0) {
    container.innerHTML =
      '<p class="empty-message">No sessions scheduled for this month.</p>';
    return;
  }

  let html = "";
  monthSessions.forEach((session) => {
    const status = appState.attendanceRecords[session.dateStr] || "unmarked";
    const dateDisplay = formatDisplayDate(session.date);

    let statusClass = "";
    let statusText = "Not Marked";
    if (status === "attended") {
      statusClass = "attended";
      statusText = "✓ Attended";
    } else if (status === "cancelled") {
      statusClass = "cancelled";
      statusText = "✗ Cancelled";
    }

    html += `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-subject">${session.subject}</div>
                    <div class="session-date">${dateDisplay}</div>
                </div>
                <div class="session-status">
                    <button class="btn btn-secondary session-btn-attended" data-date="${session.dateStr}">
                        ✓ Mark Attended
                    </button>
                    <button class="btn btn-danger session-btn-cancelled" data-date="${session.dateStr}">
                        ✗ Mark Cancelled
                    </button>
                </div>
            </div>
        `;
  });

  container.innerHTML = html;

  // Add event listeners to all session buttons
  container.querySelectorAll(".session-btn-attended").forEach((btn) => {
    btn.addEventListener("click", function () {
      markSessionAttended(this.dataset.date);
    });
  });

  container.querySelectorAll(".session-btn-cancelled").forEach((btn) => {
    btn.addEventListener("click", function () {
      markSessionCancelled(this.dataset.date);
    });
  });
}

function markSessionAttended(dateStr) {
  appState.attendanceRecords[dateStr] = "attended";
  saveDataToStorage();
  renderTracker();
  renderDashboard();
}

function markSessionCancelled(dateStr) {
  appState.attendanceRecords[dateStr] = "cancelled";
  saveDataToStorage();
  renderTracker();
  renderDashboard();
}

function previousMonth() {
  appState.currentMonth--;
  if (appState.currentMonth < 0) {
    appState.currentMonth = 11;
    appState.currentYear--;
  }
  renderTracker();
}

function nextMonth() {
  appState.currentMonth++;
  if (appState.currentMonth > 11) {
    appState.currentMonth = 0;
    appState.currentYear++;
  }
  renderTracker();
}

// ============================================================================
// Settings Rendering
// ============================================================================

function renderSettings() {
  renderRotationsList();
  renderHolidaysList();
  updateSettingsForm();
}

function renderRotationsList() {
  const container = document.getElementById("rotationsList");
  if (appState.rotations.length === 0) {
    container.innerHTML =
      '<p class="empty-message">No rotations added yet.</p>';
    return;
  }

  let html = "";
  appState.rotations.forEach((rotation) => {
    html += `
            <div class="rotation-item">
                <div class="rotation-info">
                    <div class="rotation-subject">${rotation.subject}</div>
                    <div class="rotation-dates">${rotation.startDate} to ${rotation.endDate}</div>
                </div>
                <button class="btn btn-danger rotation-delete-btn" data-rotation-id="${rotation.id}">
                    🗑️ Remove
                </button>
            </div>
        `;
  });

  container.innerHTML = html;

  // Add event listeners
  container.querySelectorAll(".rotation-delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      deleteRotation(this.dataset.rotationId);
    });
  });
}

function renderHolidaysList() {
  const container = document.getElementById("holidaysList");
  if (appState.holidays.length === 0) {
    container.innerHTML = '<p class="empty-message">No holidays added yet.</p>';
    return;
  }

  let html = "";
  appState.holidays.forEach((holiday) => {
    const date = getDateFromString(holiday);
    const displayDate = formatDisplayDate(date);

    html += `
            <div class="holiday-item">
                <div class="holiday-info">${displayDate}</div>
                <button class="btn btn-danger holiday-delete-btn" data-holiday="${holiday}">
                    🗑️ Remove
                </button>
            </div>
        `;
  });

  container.innerHTML = html;

  // Add event listeners
  container.querySelectorAll(".holiday-delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      deleteHoliday(this.dataset.holiday);
    });
  });
}

function updateSettingsForm() {
  document.getElementById("targetPercentage").value = appState.targetPercentage;
  document.getElementById("workingDaysPerWeek").value =
    appState.workingDaysPerWeek;
  document.getElementById("enableNotifications").checked =
    appState.enableNotifications;
}

function showRotationForm() {
  document.getElementById("rotationFormContainer").style.display = "block";
  document.getElementById("rotationSubject").value = "";
  document.getElementById("rotationStartDate").value = "";
  document.getElementById("rotationEndDate").value = "";
  document.getElementById("rotationSubject").focus();
}

function hideRotationForm() {
  document.getElementById("rotationFormContainer").style.display = "none";
}

function saveNewRotation() {
  const subject = document.getElementById("rotationSubject").value.trim();
  const startDate = document.getElementById("rotationStartDate").value;
  const endDate = document.getElementById("rotationEndDate").value;

  if (!subject) {
    alert("Please enter a subject name");
    return;
  }

  if (!startDate || !endDate) {
    alert("Please select both start and end dates");
    return;
  }

  if (!isValidDateRange(new Date(startDate), new Date(endDate))) {
    alert("End date must be after start date");
    return;
  }

  appState.rotations.push({
    id: generateId(),
    subject,
    startDate,
    endDate,
  });

  saveDataToStorage();
  hideRotationForm();
  renderSettings();
  renderDashboard();
  updateSessions();
  showSuccessMessage("Rotation added successfully!");
}

function deleteRotation(rotationId) {
  appState.rotations = appState.rotations.filter((r) => r.id !== rotationId);
  saveDataToStorage();
  renderSettings();
  renderDashboard();
  updateSessions();
  showSuccessMessage("Rotation removed!");
}

function addHoliday() {
  const holidayDate = document.getElementById("holidayDate").value;

  if (!holidayDate) {
    alert("Please select a date");
    return;
  }

  if (appState.holidays.includes(holidayDate)) {
    alert("This date is already marked as a holiday");
    return;
  }

  appState.holidays.push(holidayDate);
  appState.holidays.sort();

  saveDataToStorage();
  document.getElementById("holidayDate").value = "";
  renderSettings();
  renderDashboard();
  updateSessions();
  showSuccessMessage("Holiday added!");
}

function deleteHoliday(holiday) {
  appState.holidays = appState.holidays.filter((h) => h !== holiday);
  saveDataToStorage();
  renderSettings();
  renderDashboard();
  updateSessions();
  showSuccessMessage("Holiday removed!");
}

function saveSettings() {
  const targetPercentage = parseInt(
    document.getElementById("targetPercentage").value
  );
  const workingDaysPerWeek = parseInt(
    document.getElementById("workingDaysPerWeek").value
  );
  const enableNotifications = document.getElementById(
    "enableNotifications"
  ).checked;

  if (!isValidPercentage(targetPercentage)) {
    alert("Target percentage must be between 1 and 100");
    return;
  }

  if (!isValidWorkingDays(workingDaysPerWeek)) {
    alert("Working days must be between 1 and 7");
    return;
  }

  appState.targetPercentage = targetPercentage;
  appState.workingDaysPerWeek = workingDaysPerWeek;
  appState.enableNotifications = enableNotifications;

  saveDataToStorage();
  renderDashboard();
  updateSessions();
  showSuccessMessage("Settings saved successfully!");
}

// ============================================================================
// Data Management
// ============================================================================

function exportData() {
  const dataToExport = {
    rotations: appState.rotations,
    attendanceRecords: appState.attendanceRecords,
    holidays: appState.holidays,
    targetPercentage: appState.targetPercentage,
    workingDaysPerWeek: appState.workingDaysPerWeek,
    enableNotifications: appState.enableNotifications,
    exportDate: new Date().toISOString(),
  };

  const filename = `bunkbuddy_backup_${formatDateToYYYYMMDD(new Date())}.json`;
  downloadFile(
    JSON.stringify(dataToExport, null, 2),
    filename,
    "application/json"
  );
  showSuccessMessage("Data exported successfully!");
}

function triggerFileImport() {
  document.getElementById("importFileInput").click();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Validate imported data
      if (
        !data.rotations ||
        !data.attendanceRecords ||
        !Array.isArray(data.holidays)
      ) {
        alert("Invalid data format");
        return;
      }

      // Import data
      appState.rotations = data.rotations || [];
      appState.attendanceRecords = data.attendanceRecords || {};
      appState.holidays = data.holidays || [];
      appState.targetPercentage = data.targetPercentage || 80;
      appState.workingDaysPerWeek = data.workingDaysPerWeek || 6;
      appState.enableNotifications = data.enableNotifications || false;

      saveDataToStorage();
      render();
      showSuccessMessage("Data imported successfully!");
    } catch (error) {
      alert("Error reading file: " + error.message);
    }
  };

  reader.readAsText(file);
  event.target.value = ""; // Reset file input
}

let pendingConfirmAction = null;

function confirmReset() {
  pendingConfirmAction = "reset";
  showConfirmModal(
    "Reset All Data",
    "Are you sure you want to reset all data? This action cannot be undone."
  );
}

function executeConfirmedAction() {
  if (pendingConfirmAction === "reset") {
    appState = {
      rotations: [
        {
          id: generateId(),
          subject: "Sample Rotation",
          startDate: formatDateToYYYYMMDD(new Date()),
          endDate: formatDateToYYYYMMDD(addDays(new Date(), 30)),
        },
      ],
      attendanceRecords: {},
      holidays: [],
      targetPercentage: 80,
      workingDaysPerWeek: 6,
      enableNotifications: false,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      sessions: [],
      weeklyTrendsChart: null,
    };

    saveDataToStorage();
    render();
    closeModal();
    showSuccessMessage("All data reset to default!");
  }

  pendingConfirmAction = null;
}

// ============================================================================
// Modal
// ============================================================================

function showConfirmModal(title, message) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("confirmModal").style.display = "none";
}

// ============================================================================
// Success Message
// ============================================================================

function showSuccessMessage(message) {
  const el = document.getElementById("successMessage");
  document.getElementById("successText").textContent = message;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}

// ============================================================================
// Data Persistence
// ============================================================================

function saveDataToStorage() {
  localStorage.setItem("bunkbuddy_state", JSON.stringify(appState));
}

function loadDataFromStorage() {
  const savedState = localStorage.getItem("bunkbuddy_state");
  if (savedState) {
    const parsed = JSON.parse(savedState);
    appState = {
      ...appState,
      ...parsed,
      currentMonth: new Date().getMonth(), // Always use current month on load
      currentYear: new Date().getFullYear(),
      weeklyTrendsChart: null, // Charts can't be serialized
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function updateSessions() {
  appState.sessions = getAllScheduledSessions(
    appState.rotations,
    appState.workingDaysPerWeek,
    appState.holidays
  );
}

function render() {
  updateSessions();
  renderDashboard();
  renderSettings();
}

// Handle modal close when clicking outside
window.addEventListener("click", function (event) {
  const modal = document.getElementById("confirmModal");
  if (event.target === modal) {
    closeModal();
  }
});
