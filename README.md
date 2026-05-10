# FinReport Engine

Finance & Accounting automated report scheduling — React 18 / CRA.

---

## Running in Visual Studio Code

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- [VS Code](https://code.visualstudio.com/)

### Steps

1. **Extract** the zip to a folder on your machine

2. **Open in VS Code**: File → Open Folder → select the `reportengine` folder

3. **Install dependencies** — open Terminal (Ctrl + `) and run:
   ```
   npm install
   ```

4. **Start the app** — either:
   - Terminal: `npm start`
   - Or press **F5** (uses the included .vscode/launch.json)

5. App opens at **http://localhost:3000**

Login with any email containing `@` and any password.

---

## Pages

| Page | Description |
|------|-------------|
| Dashboard | KPI stats, recent activity, quick actions |
| Upload Template | Drag & drop .jasper / .jrxml / .jrpt |
| Schedule Report | Full form with live config preview |
| Scheduled Reports | Pause / Resume / Delete |
| Run History | Execution audit log |
| Settings | SMTP, timezone, retention |

---

## Structure

```
reportengine/
├── public/index.html
├── src/
│   ├── index.js
│   ├── App.js
│   ├── theme.js
│   ├── components/
│   │   ├── Sidebar.js
│   │   └── UI.js
│   └── pages/
│       ├── LoginPage.js
│       ├── DashboardPage.js
│       ├── UploadPage.js
│       ├── SchedulePage.js
│       ├── ReportsPage.js
│       ├── HistoryPage.js
│       └── SettingsPage.js
├── .vscode/
│   ├── launch.json      ← F5 to start
│   ├── settings.json
│   └── extensions.json
└── package.json         ← react-scripts 5.0.1, React 18
```
