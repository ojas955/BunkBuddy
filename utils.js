/**
 * Utility Functions for BunkBuddy
 * Handles all calculation and data manipulation logic
 */

// ============================================================================
// Date Utilities
// ============================================================================

function isWorkingDay(date, workingDaysPerWeek) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const nonWorkingDays = 7 - workingDaysPerWeek;

  // If workingDaysPerWeek is 6, non-working is Sunday (0)
  // If workingDaysPerWeek is 5, non-working are Saturday (6) and Sunday (0)
  if (workingDaysPerWeek === 6) {
    return dayOfWeek !== 0; // All except Sunday
  } else if (workingDaysPerWeek === 7) {
    return true; // All days
  } else if (workingDaysPerWeek === 5) {
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Except Sunday and Saturday
  } else {
    // For other values, we exclude the last N days of the week
    return dayOfWeek < workingDaysPerWeek;
  }
}

function isHoliday(date, holidays) {
  const dateStr = formatDateToYYYYMMDD(date);
  return holidays.includes(dateStr);
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromString(dateStr) {
  return new Date(dateStr + "T00:00:00");
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1);
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDaysDifference(date1, date2) {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  return Math.floor((time2 - time1) / (1000 * 60 * 60 * 24));
}

function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

function formatDisplayDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getMonthName(month) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month];
}

// ============================================================================
// Attendance Calculations
// ============================================================================

function getAllScheduledSessions(rotations, workingDaysPerWeek, holidays) {
  const sessions = [];

  rotations.forEach((rotation) => {
    const startDate = getDateFromString(rotation.startDate);
    const endDate = getDateFromString(rotation.endDate);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (
        isWorkingDay(currentDate, workingDaysPerWeek) &&
        !isHoliday(currentDate, holidays)
      ) {
        sessions.push({
          dateStr: formatDateToYYYYMMDD(currentDate),
          date: new Date(currentDate),
          subject: rotation.subject,
          rotationId: rotation.id,
        });
      }
      currentDate = addDays(currentDate, 1);
    }
  });

  // Sort by date
  sessions.sort((a, b) => a.date - b.date);
  return sessions;
}

function getSessionsForMonth(sessions, year, month) {
  return sessions.filter((session) => {
    const sessionDate = session.date;
    return (
      sessionDate.getFullYear() === year && sessionDate.getMonth() === month
    );
  });
}

function getSessionsForDateRange(sessions, startDate, endDate) {
  return sessions.filter((session) => {
    return session.date >= startDate && session.date <= endDate;
  });
}

function calculateAttendanceMetrics(attendanceRecords, sessions, rotations) {
  const metrics = {
    overall: {
      total: sessions.length,
      attended: 0,
      cancelled: 0,
      pending: 0,
      percentage: 0,
    },
    bySubject: {},
  };

  // Initialize subject metrics
  rotations.forEach((rotation) => {
    metrics.bySubject[rotation.subject] = {
      total: 0,
      attended: 0,
      cancelled: 0,
      percentage: 0,
    };
  });

  // Count attendance by date and subject
  sessions.forEach((session) => {
    const status = attendanceRecords[session.dateStr] || "unmarked";
    const subjectMetrics = metrics.bySubject[session.subject];

    if (status !== "cancelled") {
      metrics.overall.total++;
      subjectMetrics.total++;

      if (status === "attended") {
        metrics.overall.attended++;
        subjectMetrics.attended++;
      } else {
        metrics.overall.pending++;
      }
    } else {
      metrics.overall.cancelled++;
      subjectMetrics.cancelled++;
    }
  });

  // Calculate percentages
  if (metrics.overall.total > 0) {
    metrics.overall.percentage = Math.round(
      (metrics.overall.attended / metrics.overall.total) * 100
    );
  }

  Object.keys(metrics.bySubject).forEach((subject) => {
    const subjectMetrics = metrics.bySubject[subject];
    if (subjectMetrics.total > 0) {
      subjectMetrics.percentage = Math.round(
        (subjectMetrics.attended / subjectMetrics.total) * 100
      );
    }
  });

  return metrics;
}

function calculateClassesNeeded(metrics, targetPercentage) {
  const totalSessions = metrics.overall.total;
  const attendedSessions = metrics.overall.attended;

  if (totalSessions === 0) return 0;

  // Formula: classes_needed = ceil(total * target% / 100) - attended
  const classesRequired = Math.ceil((totalSessions * targetPercentage) / 100);
  const classesNeeded = Math.max(0, classesRequired - attendedSessions);

  return classesNeeded;
}

function calculateClassesNeededForThreshold(metrics, thresholdPercentage) {
  return calculateClassesNeeded(metrics, thresholdPercentage);
}

// ============================================================================
// Weekly Trends Calculation
// ============================================================================

function calculateWeeklyTrends(
  attendanceRecords,
  sessions,
  rotations,
  workingDaysPerWeek,
  holidays
) {
  const weeklyData = {};

  sessions.forEach((session) => {
    const date = session.date;
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekKey = formatDateToYYYYMMDD(weekStart);

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart: new Date(weekStart),
        total: 0,
        attended: 0,
      };
    }

    const status = attendanceRecords[session.dateStr] || "unmarked";

    if (status !== "cancelled") {
      weeklyData[weekKey].total++;

      if (status === "attended") {
        weeklyData[weekKey].attended++;
      }
    }
  });

  // Convert to array and calculate percentages
  const weeks = Object.values(weeklyData)
    .sort((a, b) => a.weekStart - b.weekStart)
    .map((week) => ({
      label: `${formatDateToYYYYMMDD(week.weekStart)}`,
      percentage:
        week.total > 0 ? Math.round((week.attended / week.total) * 100) : 0,
      weekStart: week.weekStart,
    }));

  // Return last 12 weeks or less
  return weeks.slice(Math.max(0, weeks.length - 12));
}

// ============================================================================
// Data Export/Report Generation
// ============================================================================

function generateTextReport(metrics, classesNeeded, targetPercentage) {
  const border = "=".repeat(50);
  let report = `\n${border}\n`;
  report += `B.O.Y.'S BUNKBUDDY - ATTENDANCE REPORT\n`;
  report += `${border}\n\n`;

  // Overall Attendance
  report += `OVERALL ATTENDANCE\n`;
  report += `-`.repeat(50) + `\n`;
  report += `Attendance Percentage: ${metrics.overall.percentage}%\n`;
  report += `Sessions Attended: ${metrics.overall.attended}\n`;
  report += `Total Sessions: ${metrics.overall.total}\n`;
  report += `Cancelled Sessions: ${metrics.overall.cancelled}\n\n`;

  // Classes Needed
  report += `CLASSES NEEDED\n`;
  report += `-`.repeat(50) + `\n`;
  report += `To reach your target (${targetPercentage}%): ${classesNeeded} classes\n`;
  report += `For 75% threshold: ${calculateClassesNeededForThreshold(
    metrics,
    75
  )} classes\n`;
  report += `For 80% threshold: ${calculateClassesNeededForThreshold(
    metrics,
    80
  )} classes\n\n`;

  // Subject-wise Breakdown
  report += `SUBJECT-WISE BREAKDOWN\n`;
  report += `-`.repeat(50) + `\n`;
  Object.entries(metrics.bySubject).forEach(([subject, data]) => {
    if (data.total > 0) {
      report += `${subject}: ${data.percentage}% (${data.attended}/${data.total})\n`;
    }
  });

  report += `\n${border}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `${border}\n`;

  return report;
}

function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Validation
// ============================================================================

function isValidDateRange(startDate, endDate) {
  return startDate <= endDate;
}

function isValidPercentage(percentage) {
  return percentage >= 1 && percentage <= 100;
}

function isValidWorkingDays(days) {
  return days >= 1 && days <= 7;
}

// ============================================================================
// Array/Object Utilities
// ============================================================================

function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
