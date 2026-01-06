
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zZkUT-5cwfpEOc5zsGCBCz5VPqE5NTFU

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Troubleshooting Deployment (Mac Users)

Se stai caricando i file manualmente su GitHub da un Mac:
1. macOS nasconde le cartelle che iniziano con il punto (come `.github`).
2. Se carichi la cartella `github` senza il punto, le Actions non partiranno.
3. **Soluzione rapida su GitHub:**
   - Vai al file `github/workflows/deploy-supabase.yml` sul sito GitHub.
   - Clicca Edit (matita).
   - Rinomina il percorso in alto aggiungendo il punto: `.github/workflows/...`
   - Salva (Commit).
