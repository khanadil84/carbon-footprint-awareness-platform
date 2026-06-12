# 🌱 EcoTrack – Carbon Footprint Awareness Platform

## 🌐 Live Demo

https://carbon-footprint-awareness-platform-two.vercel.app

## 📂 GitHub Repository

https://github.com/khanadil84/carbon-footprint-awareness-platform

---

## Overview

EcoTrack is a modern web application that helps individuals understand, monitor, and reduce their carbon footprint through activity logging, analytics, and personalized recommendations. Users can record daily activities that emit CO₂, visualize trends, set goals, and earn achievements to encourage sustainable behavior.

---

## Challenge Vertical

EcoTrack is targeted at the sustainability and environmental awareness vertical. It is suitable for hackathons, educational initiatives, workplace sustainability programs, and community-driven eco-applications that aim to increase awareness and encourage carbon-reducing behavior.

---

## Key Features

- Activity logging for travel, energy, food, and waste
- Automatic CO₂ estimation per activity
- Analytics dashboard with daily/weekly/monthly views
- Goal setting and progress tracking
- Achievement and streak system
- Exportable CSV reports and printable summaries
- Lightweight client-side persistence (localStorage)

---

## Security Improvements

This frontend-focused project includes several defensive security improvements:

- Input validation and sanitization across forms
- Safe localStorage wrappers with defensive parsing
- Centralized, environment-driven configuration for sensitive keys
- Session timeout and secure client-side logout handling

Note: Authentication hardening on servers (JWT secret management, password hashing, CSRF protection, rate limiting) requires backend implementation and is outside this repository's frontend scope.

---

## Performance Optimizations

- Optimized React rendering and memoization to reduce re-renders
- Modular services and utilities to minimize bundle size
- Lightweight Vite build and fast development server

---

## Accessibility

- Semantic HTML and keyboard-friendly interactions
- Accessible forms with labels and focus management
- Responsive design for screen readers and mobile devices

---

## Testing

The project contains unit tests for core utilities and services, including activity persistence, analytics calculations, and validation logic. Example test files are located under `tests/` and can be executed using Node or a configured test runner.

---

## Technology Stack

- React
- Vite
- JavaScript (ES Modules)
- CSS
- Local Storage
- Git & GitHub
- Vercel (hosting)

---

## Project Structure

```text
src/
 ├── assets/
 ├── components/
 ├── config/
 ├── context/
 ├── pages/
 ├── services/
 ├── styles/
 ├── utils/
 └── App.jsx
```

---

## How to Run

Clone the repository, install dependencies, and start the development server:

```bash
git clone https://github.com/khanadil84/carbon-footprint-awareness-platform.git
cd carbon-footprint-awareness-platform
npm install
npm run dev
```

Build and preview production bundle:

```bash
npm run build
npm run preview
```

---

## Assumptions

- CO₂ values are approximate and use predefined emission factors.
- User data is stored locally in the browser (no backend persistence by default).
- Analytics and recommendations are derived from recorded activities on the client.

---

## Future Enhancements

- Backend integration with secure authentication and central storage
- Multi-user sync and cloud backups
- More precise emission factors and region-aware data
- AI-driven personalized recommendations
- Mobile-native applications

---

## Deployment

This project is deployed to Vercel:

https://carbon-footprint-awareness-platform-two.vercel.app

---

## Author

Adil Khan — https://github.com/khanadil84

---

## Notes

This README was cleaned to remove merge conflict markers and duplicate sections. All content is UTF-8 and uses proper characters such as CO₂ where applicable.
