import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --bg-body: #f0f2f5;
    --bg-card: #ffffff;
    --bg-input: #ffffff;
    --bg-hover: #f0f7fb;
    --bg-sidebar: #ffffff;
    --bg-tabs: #e5e7eb;
    --text-primary: #1a1a2e;
    --text-secondary: #555;
    --text-muted: #999;
    --text-label: #374151;
    --border-color: #e0e0e0;
    --border-light: #e9ecef;
    --shadow-color: rgba(0,0,0,0.06);
    --overlay-bg: rgba(0,0,0,0.45);
  }

  [data-theme="dark"] {
    --bg-body: #111827;
    --bg-card: #1e1e2f;
    --bg-input: #252540;
    --bg-hover: #2a2a45;
    --bg-sidebar: #1a1a30;
    --bg-tabs: #252540;
    --text-primary: #e2e8f0;
    --text-secondary: #a0aec0;
    --text-muted: #718096;
    --text-label: #cbd5e1;
    --border-color: #334155;
    --border-light: #2d3748;
    --shadow-color: rgba(0,0,0,0.3);
    --overlay-bg: rgba(0,0,0,0.65);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-body);
    color: var(--text-primary);
    min-height: 100vh;
    transition: background-color 0.3s, color 0.3s;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  input, select, textarea {
    font-family: inherit;
    background-color: var(--bg-input);
    color: var(--text-primary);
    border-color: var(--border-color);
  }

  /* ── Dark mode broad overrides ───────────────────────────────────── */

  [data-theme="dark"] {
    /* Cards, modals, tables, panels */
    & div[class], & section, & aside, & main {
      transition: background-color 0.3s, color 0.3s, border-color 0.3s;
    }

    /* White backgrounds → dark card */
    table, th, td {
      border-color: var(--border-light) !important;
    }
    th {
      background-color: var(--bg-input) !important;
      color: var(--text-secondary) !important;
    }
    td {
      color: var(--text-primary);
    }

    /* Inputs, selects, textareas */
    input, select, textarea {
      background-color: var(--bg-input);
      color: var(--text-primary);
      border-color: var(--border-color);
    }
    input:focus, select:focus, textarea:focus {
      border-color: #2563eb;
    }

    /* Links inside cards */
    h1, h2, h3, h4, h5, h6 {
      color: var(--text-primary);
    }
    p, span, label {
      color: var(--text-secondary);
    }

    /* Scrollbar */
    ::-webkit-scrollbar-track { background: #1e1e2f; }
    ::-webkit-scrollbar-thumb { background: #444; }
  }
`;

export default GlobalStyles;
