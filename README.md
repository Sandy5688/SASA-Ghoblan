Overview



This project is a complete podcast distribution and management system designed to handle ingestion, normalization, monetization, and distribution of podcast episodes across multiple platforms including Spotify, Apple Podcasts, SoundCloud, Audiomack, and more.



Project Structure



Root Directory



config/: configuration files (platform toggles, settings)



data/: static data



logs/: service logs



mongo\_data/: MongoDB data files



scripts/: automation scripts



services/: all microservices (see below)



uploads/: audio files ready for upload



.dockerignore



.env: environment variables for all services





Services



Each service has its own folder inside services/ with its own index.js, package.json, Dockerfile, and service-specific code.



1\. Apple Service



index.js (entrypoint)



services/appleUploader.js



services/rssManager.js



Handles uploads via RSS or API placeholders





2\. Audiomack Service



index.js



services/audiomackUploader.js (upload automation using Playwright) \*\*\*\*\* I later use playwright instead of puppeteer because it's more stable. 



services/alert.js (SMTP alerts)



automation/ (login, config, upload helpers)



Uses automation with sessions to avoid repeated login





3\. Dashboard Relay



index.js



services/logAggregator.js



routes/metrics.js, routes/testStatus.js



tests/platform-test.js, tests/integration-test.js



Centralized logging and health monitoring for all services





4\. Ingestion Service



Handles uploading of raw audio files to the pipeline



index.js, routes/uploadReady.js, models/metadataModel.js, controllers/metadataController.js, utils/validator.js





5\. Monetization Service



Manages affiliate and sponsorship revenue tracking



services/affiliateManager.js, services/sponsorshipManager.js, services/utils.js





6\. Normalization Service



Normalizes audio for consistent quality



services/normalizeAudio.js





7\. SoundCloud Service



services/soundcloudUploader.js





8\. Spotify Service



services/spotifyUploader.js



Requires client\_id and client\_secret for live uploads





9\. Vault Service



Secure storage of credentials



services/vaultClient.js



credentials/ folder for JSON credential files





10\. Visual Service



Manages cover art and overlays



services/coverArtManager.js, services/overlayManager.js, services/utils.js





Environment Variables



Each service has a .env file with placeholders for credentials, toggles, and ports.



Example: Spotify



PORT=5001

NODE\_ENV=production

SERVICE\_NAME=spotify-service

SPOTIFY\_CLIENT\_ID\_1=your\_client\_id\_here

SPOTIFY\_CLIENT\_SECRET\_1=your\_client\_secret\_here

\# ... up to 10 accounts

UPLOADS\_DIR=/app/uploads

LOGS\_DIR=/app/logs

DASHBOARD\_RELAY\_URL=http://dashboard\_relay:5010/api/logs

Already added}

Audiomack



PORT=5004

NODE\_ENV=production

SERVICE\_NAME=audiomack-service

AUDIOMACK\_EMAIL\_1=member@rhythmaura.digital

AUDIOMACK\_PASSWORD=default\_password\_here

SMTP\_HOST=smtp.hostinger.com

SMTP\_PORT=465

SMTP\_USER=connect@chillnova.online

SMTP\_PASS=your\_smtp\_password

ALERT\_EMAIL=connect@chillnova.online
(Already added}



Other services follow a similar pattern with toggles and credentials placeholders.



How It Works



1\. Ingestion: Raw audio files are uploaded to the ingestion service.





2\. Normalization: Audio is processed for consistent quality.





3\. Monetization: Affiliate and sponsorship data is processed.





4\. Distribution: Audio files are distributed to Spotify, Apple, SoundCloud, Audiomack, etc.





5\. Dashboard Relay: All services report logs and health metrics to the dashboard.





6\. Visuals: Covers and overlays are generated automatically.







Uploading Audio



Place audio in uploads/



POST to service endpoints (/upload) with assetId, filePath, metadata, accountId.



Demo mode simulates uploads, live mode sends to actual platform.





Example PowerShell request to Spotify:



$body = @{

&nbsp;   assetId  = "demo\_track\_001"

&nbsp;   filePath = "/app/uploads/sample.mp3"

&nbsp;   metadata = @{ title="Sample"; description="Demo upload"; genre="Hip-Hop"; tags=@("demo") }

&nbsp;   accountId = 1

} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:5001/upload" -Method POST -ContentType "application/json" -Body $body



Logging \& Alerts



Each service logs activity in logs/.



Audiomack sends SMTP alerts on failures.



Dashboard Relay aggregates logs and metrics.





Notes



Toggle config is in config/platforms.json for enabling/disabling platforms.



Live uploads require credentials filled in .env.



Demo mode can be used to simulate uploads without touching live accounts.



Sessions for Audiomack are cached to avoid re-login for days.



MongoDB is used for metadata storage.



You can swap out credentials or add accounts easily via .env or Vault.



..



This README covers the whole project setup, environment, and workflow for distribution, testing, and going live.





