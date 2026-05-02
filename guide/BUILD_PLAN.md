# Build Plan — DemocracyOS Lite

## 🏗️ Architecture

* Frontend: HTML + Tailwind + JS
* Backend: Minimal Node.js + Express (later)
* No database
* No authentication

---

## 🎨 UI STRUCTURE (Single Page)

### Sections:

1. Header

   * Title
   * Role Selector

2. Chat Assistant

   * Input + output area

3. Timeline Viewer

   * Card-based phases

4. Scenario Simulator

   * Inputs (dropdowns)
   * Run button
   * Chart output

5. Misinformation Checker

   * Input + result

---

## ⚙️ STATE (SIMPLE)

* role (voter / officer)
* simulation inputs
* optional chat history

Use basic JS variables only.

---

## 📊 FEATURES IMPLEMENTATION

### 1. Role Selector

* Dropdown or toggle
* Changes tone of responses

---

### 2. Chat Assistant

* Start with static responses
* Later connect to LLM

---

### 3. Timeline Viewer

* Hardcoded phases:

  * Announcement
  * Campaign
  * Voting
  * Counting
  * Results

---

### 4. Scenario Simulator

Inputs:

* Voter turnout
* Misinformation level
* Party balance

Logic:

* Use simple if-else rules

Output:

* Winner
* Stability
* Reason

---

### 5. Chart Integration (Chart.js)

* Use simple bar or pie chart
* No plugins
* Update dynamically

---

### 6. Misinformation Checker

* Start with placeholder logic
* Later use LLM

---

## ⚡ EXECUTION ORDER (STRICT)

### Phase 1 — Setup

* Create HTML file
* Add Tailwind CDN
* Add Chart.js CDN

---

### Phase 2 — UI

* Build all sections (no logic)

---

### Phase 3 — Features (UI + Basic Logic)

1. Role selector
2. Timeline
3. Simulator UI
4. Chart rendering
5. Misinformation UI

---

### Phase 4 — Logic

* Add simulation logic
* Add role-based variations

---

### Phase 5 — AI Integration (LAST BEFORE DEPLOY)

* Add API calls
* Add Hinglish prompt

---

## 🚫 RULES DURING BUILD

* Do NOT add backend yet
* Do NOT ask for API keys
* Do NOT use external services
* Do NOT over-engineer

---

## 🧠 PRINCIPLE

"Make it work simply before making it smart."
