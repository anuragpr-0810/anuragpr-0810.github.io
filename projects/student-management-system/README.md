# Student Management System

A dashboard-style app to manage student records in the browser. Built with HTML, CSS, JavaScript and `localStorage`.

> **Demo data only.** The sample students ("Demo Student A–F") are made up. Nothing is sent to a server; records stay in your browser.

## Features
- Dashboard: total students, average marks, average attendance, top performer, subject averages, grade distribution
- Add, edit and delete students (with validation and unique roll numbers)
- Search by name, roll or email, and filter by course
- Attendance: mark Present/Absent per date, see overall attendance %
- Marks: Maths, Programming, English (0–100), auto average and grade (A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, else F)
- Export to CSV (cells starting with `= + - @` are escaped to avoid spreadsheet formula injection)
- Data saved in `localStorage`; **Reset demo data** restores the samples
- Responsive: sidebar becomes a top bar on small screens

## Run locally
Open `index.html` in a browser, or run `python -m http.server` here and visit http://localhost:8000.

## How it works (good for interviews)
- One `db` array holds all students; every change calls `save()` then re-renders the views.
- User text is escaped (`esc()`) before it goes into HTML, to prevent XSS.
- Grades and percentages are computed from the data, never stored twice.

## Known limits
- Data lives only in one browser (no login, no server). Clearing site data deletes it.
- Marks are limited to three fixed subjects.
