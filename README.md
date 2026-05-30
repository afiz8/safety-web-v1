# 🚀 JSMS HSSE - Job Safety Management System (Enhanced v2.1)

## 🎯 Overview
**JSMS HSSE** adalah dashboard React profesional untuk manajemen keselamatan kerja (Job Safety Management System). Sistem lengkap dengan **Landing Page**, **Dynamic Dashboard**, **Dark Mode**, dan **Early Warning System**.

**Demo Credentials:**
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin` |
| Supervisor | `sup` | `sup` |
| Karyawan | `kary` | `kary` |

## ✨ Fitur Utama (NEW & Enhanced)
✅ **Landing Page Profesional** - Hero, fitur showcase, CTA login  
✅ **Dynamic HSSE Dashboard**  
   - Real-time KPI: Total Jobs, Incidents, Compliance %, Workers  
   - Grafik tren insiden Recharts  
   - Peringatan Dini (APD stok/kadaluarsa, kontraktor rating, risk high)  
✅ **Dark/Light Mode** - Toggle seamless, localStorage persist  
✅ **Responsive UI/UX** - Mobile sidebar, hover effects, glassmorphism  
✅ **Role-Based Access** - Admin/Supervisor/Karyawan  
✅ **Multi-User Management** - Users, Kontraktor, APD  
✅ **Form Lengkap** - JKS, Incidental Treatment, Fit to Work  
✅ **Notifikasi Real-time** & Export Excel/PDF  
✅ **React Icons** & modern Tailwind animations  

## 🛠 Tech Stack
```
Frontend: React 19 + Hooks + Context API
Styling: Tailwind CSS 3 (darkMode: 'class')
Charts: Recharts
Icons: react-icons/fa
Storage: localStorage (jsms_* keys)
Map: react-leaflet
Export: xlsx, jspdf
Build: Create React App
```

## 🚀 Quick Start
```bash
# Clone & Install
npm install

# Development Server (PORT 3005)
npm start

# Build Production
npm run build
```

**Browser Direct:** `http://localhost:3005`

## 📱 Responsive Design
- **Desktop**: Full sidebar, grid layouts  
- **Tablet**: Collapsible sidebar  
- **Mobile**: Hamburger menu + overlay  

## 📈 Dashboard Metrics (Dynamic)
| Metric | Data Source | Calculation |
|--------|-------------|-------------|
| **Total Jobs** | `jsms_assessments` | `assessments.length` |
| **Incidents** | `jsms_assessments` | Unfit + 'Fit with Note' |
| **Compliance** | `jsms_assessments` | Fit % |
| **Workers** | `jsms_users` | `users.length` |

**Early Warnings:**
- High Risk Jobs (riskScale='High')
- APD Low Stock (stok ≤5)
- APD Expiring (<30 days)
- Low Rating Contractors (<3)

## 🗂 File Structure
```
src/
├── App.js (Context + Routing + DarkMode)
├── components/
│   └── Sidebar.js (react-icons + Toggle)
├── pages/
│   ├── LandingPage.js (NEW Hero)
│   ├── DashboardHSSE.js (Dynamic + Charts) 
│   ├── LoginPage.js
│   └── [Forms: FitToWork, APD, etc.]
├── index.css (Tailwind)
```

## 🎨 Customization
**tailwind.config.js** (Enhanced):
- Custom `primary` colors
- Glass shadows
- Pulse animations

**Dark Mode:** Toggle di sidebar, `dark:` classes everywhere.

## 📱 Screenshots
```
[Landing Page] [Dark Dashboard] [Mobile Sidebar] [Charts] [Warnings]
(Add your screenshots here)
```

## 🔧 LocalStorage Keys
```
jsms_users, jsms_assessments, jsms_notifications
jsms_kontraktor, jsms_apd, jsms_session
jsms_darkMode (NEW)
```

## 📝 Development Notes
- Data persistent via localStorage
- Proxy `jsms_assessments` for izin_kerja/incidental
- Kontraktor/APD from existing forms
- Run `npm audit fix` if needed

## 🤝 Contributing
1. Fork & PR
2. `npm install`
3. `npm start`
4. Add features per TODO.md

## 📄 License
MIT - PT Elefanteinfradigi Solution

---

**Enhanced by BLACKBOXAI** - Professional JSMS v2.1 (2024)  
⭐ Star if useful!

