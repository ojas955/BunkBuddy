# B.O.Y.'s BunkBuddy: The Smart Attendance Manager

A simple, intuitive, cross-platform web application that helps students (especially non-technical ones like medical students) easily track and manage their class attendance to meet minimum percentage requirements without any manual calculations.

## 🎯 Core Goal

Answer the student's main question every day:  
**"How many more classes do I absolutely need to attend from today onward to safely reach my attendance target?"**

## ✨ Key Features

### 📊 Dashboard (Main Screen)

- **Large, clear attendance percentage display**
- **Classes needed for your personal target** (customizable)
- Classes needed for 75% and 80% thresholds
- Subject-wise attendance breakdown
- Weekly attendance trends chart
- One-click report export

### 📅 Tracker (Calendar & Sessions)

- Interactive monthly calendar view
- **One-click attendance marking**: Click days to cycle through:
  - Unmarked → Attended (green) → Cancelled (red) → Unmarked
- Automatic holiday marking (non-clickable, gray)
- Chronological session list with quick-mark buttons
- Month navigation (Previous/Next)
- Real-time updates to dashboard

### ⚙️ Settings

- **Class Schedule (Rotations)**
  - Add multiple subjects/rotations with start and end dates
  - Support for overlapping or sequential rotations
  - Individual rotation removal
- **Attendance Target**
  - Set your own minimum percentage (default: 80%)
- **Working Days Configuration**
  - Set compulsory working days per week (1-7, default: 6)
  - Non-working days automatically grayed out
- **Holiday Management**
  - Add individual holiday dates
  - Holidays excluded from attendance calculations
  - Easy removal of holidays
- **Data Management**
  - 💾 Save Settings
  - 📤 Export Data (JSON backup)
  - 📥 Import Data (JSON restore)
  - 🔄 Reset All Data (with confirmation)

## 🧮 How It Calculates

### Attendance Percentage

```
Attendance % = (Attended Sessions / Total Sessions) × 100
```

### Total Sessions

Working days within all rotations, excluding:

- Holidays
- Cancelled classes
- Non-working days (e.g., Sundays if 6-day week)

### Classes Needed for Target

```
Classes Needed = ceil(Total Sessions × Target% / 100) - Attended Sessions
```

### Subject-wise Tracking

Each rotation/subject is tracked independently with its own attendance percentage.

## 🚀 Getting Started

### Quick Start (Local)

1. Download all files to a folder
2. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
3. That's it! No installation required.

### Using a Local Server (Recommended)

```bash
# Navigate to the project folder
cd /path/to/BunkBuddy

# Start a simple HTTP server
python3 -m http.server 8000

# Open in browser
# Visit: http://localhost:8000
```

## 📱 Mobile Friendly

The app is fully responsive and works seamlessly on:

- 📱 Smartphones
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktops

## 🎨 Design Highlights

- **Dark mode interface** for reduced eye strain
- **High contrast** for excellent readability
- **Large touch targets** for mobile use
- **Clear visual feedback** for all actions
- **Instant updates** across all screens

## 💾 Data Persistence

All data is automatically saved to your browser's local storage:

- ✅ Survives browser restarts
- ✅ Works offline
- ✅ No account required
- ✅ Privacy-focused (data stays on your device)

**Important**: Data is browser-specific. Use Export/Import to:

- Backup your data
- Transfer between browsers
- Share across devices

## 🎓 Perfect For

- Medical students
- Nursing students
- Engineering students
- Any student with attendance requirements
- Anyone who wants to track class participation

## 🔒 Privacy

- **100% offline** after initial load
- **No data collection**
- **No tracking**
- **No sign-up required**
- All data stored locally on your device

## 📝 Usage Tips

### First Time Setup

1. Go to **Settings** tab
2. Remove the default "Sample Rotation"
3. Add your actual subjects with start/end dates
4. Set your attendance target
5. Configure working days per week
6. Add any known holidays

### Daily Use

1. Open the **Tracker** tab
2. Click on today's date to mark attendance
3. Or use the session list below to mark classes
4. Check the **Dashboard** to see updated stats

### Backup Your Data

1. Go to **Settings** tab
2. Click **"Export Data (JSON)"**
3. Save the file somewhere safe
4. Import it anytime to restore

## 🛠️ Technical Details

### Built With

- **HTML5** - Structure
- **CSS3** - Styling with custom dark theme
- **Vanilla JavaScript** - No frameworks required
- **Chart.js** - Beautiful weekly trends chart
- **LocalStorage API** - Data persistence

### Browser Compatibility

- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Opera (v76+)

### Files Structure

```
BunkBuddy/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── utils.js        # Calculation and utility functions
├── app.js          # Main application logic
└── README.md       # This file
```

## 🐛 Troubleshooting

### Data not saving?

- Check if browser allows localStorage
- Try a different browser
- Export and re-import your data

### Calendar not showing correctly?

- Make sure you've added at least one rotation
- Check that rotation dates are valid
- Refresh the page

### Wrong attendance percentage?

- Verify cancelled classes are marked correctly
- Check holidays are set properly
- Ensure working days per week is correct

## 📄 License

This project is free to use for personal and educational purposes.

## 🙏 Credits

Created by **B.O.Y.** for students who want to focus on learning, not calculating.

---

**Version**: 1.0.0  
**Last Updated**: December 26, 2025

---

## 🎉 Enjoy Using BunkBuddy!

Never miss another class requirement. Focus on learning, we'll handle the math! 📚✨
