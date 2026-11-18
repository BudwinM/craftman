# CraftMart — Sri Lankan handmade marketplace

A complete, responsive front end for CraftMart with a working AI shopping assistant ("Kala") powered by Google Gemini.

- **Static site:** plain HTML, CSS and JavaScript, with no build step.
- **One serverless function:** `api/chat.js` calls Gemini. Your API key stays on the server and is never sent to the browser.

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Shop (search, filters, sort) | `shop.html` |
| Product details (`?id=pot`) | `product.html` |
| Artisans | `artisans.html` |
| Cart | `cart.html` |
| Checkout and payment | `checkout.html` → `order-confirmed.html` |
| Customer: dashboard, orders, order tracking, profile | `account.html`, `orders.html`, `order.html`, `profile.html` |
| Artisan: dashboard, order management, shop profile | `artisan-dashboard.html`, `artisan-orders.html`, `artisan-profile.html` |
| Admin: dashboard, profile | `admin-dashboard.html`, `admin-profile.html` |
| Messages | `messages.html` |
| Contact us | `contact.html` |
| AI chatbot (full page) | `chatbot.html`, plus a floating "Ask Kala" widget on customer pages |

**What works:**
- The cart, add to cart, quantities and the promo code (`CRAFT15`, 15% off brassware).
- Checkout with form validation, which creates a real order that appears in My orders and on the tracking page.
- Cancelling an order, posting reviews, artisan accept/decline/ship actions, messaging with simulated replies, the contact form, and saved chat history.

All of this is saved in the browser with localStorage. This is a demo: there is no database and no real payment gateway.

## Deploy to Vercel

**Option A: Vercel CLI**

1. Unzip, then open a terminal in the `craftmart` folder.
2. Run `npm i -g vercel`, then `vercel login`.
3. Run `vercel` and accept the defaults. This creates the project.
4. Add your key with `vercel env add GEMINI_API_KEY`. Paste the key when asked and select **Production**, **Preview** and **Development**.
5. Deploy with `vercel --prod`.

**Option B: GitHub and the Vercel dashboard**

1. Push this folder to a GitHub repository. The `.gitignore` already excludes `.env` files.
2. On vercel.com, go to **Add New → Project**, import the repository and keep framework preset **Other**. There is no build command.
3. Go to **Settings → Environment Variables**, add `GEMINI_API_KEY` with your key, then **Redeploy**.

To change the model, set `GEMINI_MODEL`. The default is `gemini-flash-latest`.

## Run locally

- **With the live chatbot:** create `.env.local` containing `GEMINI_API_KEY=...`, then run `vercel dev`.
- **Without the chatbot:** open `index.html` or use any static server. The site works and Kala falls back to built-in offline answers.

## Notes

- **Product images** are illustrations in `assets/img/`. Replace them with real product photos, keeping the file names or updating `assets/js/data.js` and `api/_catalog.js`.
- **The product catalog** is in `assets/js/data.js` (browser) and `api/_catalog.js` (chatbot knowledge). Keep both in sync.
- **Security:** never put the API key in front-end files. If a key has been shared publicly (for example in a chat), create a new one in Google AI Studio and delete the old one.
