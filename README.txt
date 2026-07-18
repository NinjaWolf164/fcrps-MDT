FLORENCE REGIONAL PUBLIC SAFETY SUITE — VERSION 6.7
SUBJECT ALERTS + FIRST/LAST NAME MATCHING

INSTALLATION
1. Run the complete setup.sql in the Supabase SQL Editor.
2. Deploy index.html, styles.css, and app.js to Vercel.
3. Hard refresh each browser with Ctrl+Shift+R.

NEW IN 6.7
- Separate First Name and Last Name fields in person-contact workflows.
- New Subject Alerts module for officer-safety, wanted-person, trespass, watch-list, medical-caution, and other alerts.
- Automatic matching against Subject Alerts, active Warrants, Watch List, Access Denied/Restricted entries, and active BOLOs.
- Matching by first + last name, with DOB strengthening the match when both records include it.
- Exact plate matching.
- Alert popup, critical sound, clickable matching records, acknowledgement logging, and live critical notification to other active users.
- Checks occur when arrests, citations, warrants, traffic stops, field interviews, vehicle searches, visitor passes, people, and gate entries are saved.

IMPORTANT
This system is intentionally configured for fictional/private gameplay. Do not store real confidential criminal-justice information.


VERSION 6.8 — GUIDED PORT GATE SCREENING
- Eight-step Gate Entry Wizard based on the provided port questions.
- Identification, TWIC/badge, vehicle, occupants, commercial cargo, contractor, security, checklist, and final decision sections.
- Automatic subject/plate alert check with clickable matches.
- Live screening summary and informational screening flags.
- Save Draft and Finalize workflows.
- Expanded exit processing for unusual incidents, cargo/equipment, and trailer seals.
- All gate records continue to synchronize live through the existing port_entries Realtime subscription.

INSTALLATION
1. Run the complete setup.sql once in Supabase SQL Editor. It adds columns without deleting existing records.
2. Deploy index.html, styles.css, and app.js to Vercel.
3. Hard refresh all devices.
