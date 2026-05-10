# Ethara
**Premium AI-Powered Project Management Platform**

Ethara is a state-of-the-art, full-stack project management solution designed for modern teams. It combines a high-performance Node.js backend with a stunning, glassmorphism-inspired React frontend to provide a seamless workflow for project planning, task tracking, and team collaboration.

---

## Features

- **Dynamic Kanban Boards**: Intuitive drag-and-drop task management with real-time state persistence.
- **Granular RBAC (Role-Based Access Control)**: 
  - **Admins/Leads**: Full control over metadata (Priority, Due Date) and final sign-offs.
  - **Members**: Focused task execution and collaboration.
- **Immersive Dashboard**: Full-screen, data-driven overview of active projects, personal tasks, and overdue items.
- **Member Directory**: Comprehensive team management with involved-project tracking.
- **Glassmorphism UI**: A premium, modern design system featuring subtle blurs, vibrant gradients, and micro-animations.
- **Firebase Auth**: Secure, reliable authentication including Google Sign-In integration.

---

## Technology Stack

### Frontend
- **React 19**
- **Vite** (Next-generation frontend tooling)
- **Tailwind CSS** (for utility styling)
- **Lucide React** (Beautifully simple icons)
- **Date-fns** (Robust date manipulation)

### Backend
- **Node.js & Express**
- **PostgreSQL** (with `pg` driver)
- **Firebase Admin SDK** (for secure auth verification)
- **Docker** (ready for containerized deployment)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Firebase Project (for Auth)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/Ethara.git
   cd Ethara
   ```

2. **Backend Configuration**
   - Navigate to the `backend` folder.
   - Create a `.env` file based on `.env.example`.
   - Install dependencies: `npm install`
   - Run the seed script to initialize the database: `npm run seed`

3. **Frontend Configuration**
   - Navigate to the `frontend` folder.
   - Install dependencies: `npm install`

4. **Launch the platform**
   - From the root directory, run the launch script:
     ```bash
     ./run.ps1  # For Windows
     ```

---

## Security & Workflow

Ethara enforces strict workflow rules to ensure project integrity:
- **Review Gate**: Only Project Leads or Admins can move a task to the "Done" status.
- **Metadata Lock**: Sensitive task data (Priority, Due Dates) is locked for regular members and can only be modified by leadership.
- **Auto-Correction**: Backend systems automatically handle timezone shifting to ensure due dates remain accurate across all regions.

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

