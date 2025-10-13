\# Automation Helpers



Reusable Playwright utilities used by platform automation scripts

(e.g., Audiomack).



\## Features

\- Browser lifecycle management (`launchBrowser`, `runAutomation`)

\- Login/session persistence (`loadSession`, `saveSession`)

\- Upload helpers (`uploadFile`, `clickAndWait`)

\- Error and screenshot logging

\- Shared automation log (`logs/automation.log`)



\## Usage Example



```js

import { runAutomation, performLogin, uploadFile, takeScreenshot } from "./helpers.js";



const creds = { username: "user@example.com", password: "pass123" };



await runAutomation("audiomack", async (page, context) => {

&nbsp; await performLogin(page, "audiomack", creds);

&nbsp; await takeScreenshot(page, "audiomack", "logged\_in");

&nbsp; await uploadFile(page, 'input\[type=file]', "./uploads/test.mp3");

});



