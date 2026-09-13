# sito cccc — cculturacc.it

Ricostruzione statica del sito [cultura.yt](https://cultura.yt) (cccc – centro di
cultura contemporanea / conegliano), pronta per essere pubblicata sul dominio
**cculturacc.it**, con una sezione eventi che mostra automaticamente gli ultimi
post Instagram di **@cculturacc** tramite l'Instagram Graph API ufficiale.

Contenuti (testi, foto, link) presi 1:1 dal sito originale, che appartiene alla
stessa associazione.

## Struttura

```
index.html            home
about.html            chi siamo
contatti.html         contatti + mappa + feed eventi
assets/css/style.css  stile
assets/js/instagram-feed.js   fetch lato client del feed eventi
assets/img/           foto e favicon
api/instagram.js      funzione serverless (Vercel) che chiama la Graph API
vercel.json           URL puliti (/about, /contatti) + config
```

## 1. Deploy su Vercel + dominio cculturacc.it

1. `npm i -g vercel` (una tantum), poi dalla cartella del progetto: `vercel`
   per il primo deploy, `vercel --prod` per la produzione.
2. Nel progetto Vercel → **Settings → Domains** aggiungi `cculturacc.it` (e
   `www.cculturacc.it` se vuoi che rediriga).
3. Dal pannello DNS del registrar dove hai comprato il dominio, imposta i
   record che Vercel ti mostra (di solito un record `A` su `76.76.21.21` per
   l'apex e un `CNAME` su `cname.vercel-dns.com` per `www`). La propagazione
   può richiedere da pochi minuti a qualche ora.
4. Vercel emette automaticamente il certificato HTTPS una volta verificato il
   dominio.

Se preferisci un altro host statico (Netlify, Cloudflare Pages, GitHub Pages)
va bene lo stesso per le pagine HTML, ma **serve un host che supporti funzioni
serverless** per `api/instagram.js` (Netlify Functions o Cloudflare Pages
Functions sono equivalenti; GitHub Pages da solo no).

## 2. Collegare il feed Instagram (Graph API ufficiale)

L'Instagram Graph API richiede un account **Instagram Business o Creator**
collegato a una **Pagina Facebook**, e va chiamata solo dal server (mai dal
browser: il token va tenuto segreto). Passi:

1. **Account Instagram**: assicurati che `@cculturacc` sia impostato come
   account Business o Creator (Impostazioni → Account → passa ad account
   professionale) e collegato a una Pagina Facebook dell'associazione.
2. **App Facebook**: vai su [developers.facebook.com](https://developers.facebook.com),
   crea un'app di tipo "Business", aggiungi il prodotto **Instagram Graph API**.
3. **Token utente**: in Graph API Explorer (developers.facebook.com/tools/explorer)
   seleziona la tua app, genera un User Access Token con i permessi
   `instagram_basic` e `pages_show_list`, autorizzando la Pagina collegata a
   `@cculturacc`.
4. **Token di lunga durata**: scambia il token short-lived con uno long-lived
   (dura ~60 giorni) chiamando:
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={app-id}
     &client_secret={app-secret}
     &fb_exchange_token={short-lived-token}
   ```
5. **ID account Instagram**: con quel token, chiama
   `GET https://graph.facebook.com/v21.0/me/accounts?access_token={token}`
   per trovare l'id della Pagina, poi
   `GET https://graph.facebook.com/v21.0/{page-id}?fields=instagram_business_account&access_token={token}`
   per ottenere l'`instagram_business_account.id` — è il tuo `IG_USER_ID`.
6. **Variabili d'ambiente**: nel progetto Vercel → Settings → Environment
   Variables imposta:
   - `IG_USER_ID` = l'id trovato al passo 5
   - `IG_ACCESS_TOKEN` = il token long-lived del passo 4
   Poi rilancia il deploy (`vercel --prod`) perché le env var vengano lette.
7. **Rinnovo**: il token long-lived scade dopo ~60 giorni. Prima della
   scadenza richiama l'endpoint di refresh:
   ```
   GET https://graph.facebook.com/v21.0/refresh_access_token
     ?grant_type=ig_refresh_token
     &access_token={token-attuale}
   ```
   e aggiorna `IG_ACCESS_TOKEN` su Vercel col nuovo valore. Consiglio: metti
   un promemoria ricorrente ogni ~50 giorni. Se in futuro vuoi automatizzarlo
   del tutto serve un piccolo storage persistente (es. Vercel KV) per salvare
   il token aggiornato: si può aggiungere quando serve.

Finché queste variabili non sono impostate, la sezione eventi mostra
automaticamente un link diretto a instagram.com/cculturacc invece di un
errore.

## Sviluppo locale

```
vercel dev
```

serve sia le pagine statiche sia `api/instagram.js` su `localhost:3000`,
leggendo le variabili da `.env.local` (copia `.env.example`).
