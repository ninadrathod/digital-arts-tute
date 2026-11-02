# Digital Arts Masterclass

A visual, example-driven, self-paced course on **digital art in Procreate**: illustration, poster design, design types, colour combinations and text art / lettering. The site is plain static HTML with Tailwind CSS from a CDN and one JavaScript file, so there is **no build step**. The design copies the dark Procreate interface: floating panels, a blue accent colour and a colour-puck progress ring.

```
digital-arts-tute/
├── index.html   # page layout + all course content (one <section data-module> per module)
├── script.js    # curriculum list, navigation, progress tracking, interactive diagrams
├── CNAME        # custom domain for GitHub Pages: digital-arts.meverse.in
└── README.md
```

---

## 1. Preview it on your own computer

You don't need to install anything except a browser. You can double-click `index.html`, but running a small local server works more like the real hosted site:

```bash
cd digital-arts-tute
python3 -m http.server 8000
# then open http://localhost:8000
```

Lesson progress is saved in your browser's `localStorage`. To reset it, use **Reset progress** at the bottom of the sidebar.

---

## 2. Hosting on GitHub Pages: read this first, because the repository is **private**

### What a private repo means for GitHub Pages

| Your GitHub plan | Can you publish Pages from a **private** repo? | Who can see the published site? |
|---|---|---|
| **GitHub Free** (personal) | ❌ No. Pages only works for **public** repos on Free. | — |
| **GitHub Pro** (personal, paid) | ✅ Yes | **Everyone on the internet.** The *source code* stays private, but the *website* is public. |
| **GitHub Team** (organisation) | ✅ Yes | Everyone on the internet |
| **GitHub Enterprise Cloud** | ✅ Yes | Public, **or** limited to members of your organisation ("private Pages" / access control) |

Two key points:

1. **A private repo does not make the website private.** On Free, Pro and Team, a published Pages site can always be reached by anyone with the URL. Only Enterprise Cloud can restrict who sees it.
2. **On a Free account you have two choices:** upgrade to **GitHub Pro**, or **make the repository public**. Both are covered below.

> GitHub changes its plans from time to time. Check the current rules at
> <https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages> before you decide.

### Option A — Keep the repo private (GitHub Pro or above)

1. Upgrade under **Settings → Billing and plans → Plans and usage → Upgrade to Pro**.
2. Go to step 3, *Enable GitHub Pages*.

### Option B — Make the repository public safely (GitHub Free)

Making a repo public exposes **every file in every commit, on every branch**, plus the commit author names and emails. Check these things first:

1. **Look for secrets in the history**, not just in the current files:
   ```bash
   git log --all --oneline | head -50          # see what has been committed
   git grep -I -n -E "(api[_-]?key|secret|token|password)" $(git rev-list --all) | head
   ```
   If you find a secret, **revoke or rotate it with the service that issued it first**. Then remove it from the history with [`git filter-repo`](https://github.com/newren/git-filter-repo) and force-push. Removing it from history alone is not enough, because anyone who already cloned the repo still has the old commits.
2. **Check your commit email.** Commits show the email address set in `git config user.email`. If you'd rather keep it hidden, enable *Keep my email addresses private* under **Settings → Emails** and use your `@users.noreply.github.com` address for future commits.
3. **Add a licence** if you want to say how others may reuse the course text and diagrams (for example CC BY-NC 4.0 for content and MIT for code). Without a licence, the content is "all rights reserved" by default, even when the repo is public.
4. **Change the visibility:**
   1. Open the repo on GitHub → **Settings** (top-right tab).
   2. Scroll to the bottom, to **Danger Zone**.
   3. Click **Change visibility → Change to public**.
   4. Read the warnings, type the repository name to confirm, and click **I understand, change repository visibility**.
5. You can make it private again later, but note:
   - Forks made while the repo was public **stay public and stay with whoever forked them**.
   - On a Free account, switching back to private **turns GitHub Pages off**.
   - Stars and watchers from people outside the repo are removed.

### 3. Enable GitHub Pages

1. Push the code to `main`:
   ```bash
   git add .
   git commit -m "Add Digital Arts Masterclass site"
   git push origin main
   ```
2. On GitHub: **Settings → Pages** (left sidebar, under *Code and automation*).
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose `main` and folder `/ (root)`, then click **Save**.
5. Wait 1–2 minutes. The **Actions** tab will show a *pages build and deployment* run. When it finishes, your site URL appears at the top of the Pages settings page:
   `https://<your-username>.github.io/digital-arts-tute/`

### 4. ⚠️ The `CNAME` file: deal with it before you deploy

The `CNAME` file is set to **`digital-arts.meverse.in`**. For that domain to work, add this DNS record at the provider that manages `meverse.in`:

| Type | Name / Host | Value / Target |
|---|---|---|
| `CNAME` | `digital-arts` | `ninadrathod.github.io` |

Then, in **Settings → Pages → Custom domain**, enter `digital-arts.meverse.in`, click **Save**, wait for the DNS check to pass, and tick **Enforce HTTPS**. DNS changes can take anywhere from a few minutes to 24 hours to spread.

**If you have no custom domain:** delete the file.
```bash
git rm CNAME && git commit -m "Remove placeholder CNAME" && git push
```

**If you have a custom domain** (for example `www.mycourse.com`):

1. Replace the contents of `CNAME` with your domain, on a single line with no `https://`:
   ```
   www.mycourse.com
   ```
2. At your DNS provider, add a **CNAME record**: `www` → `<your-username>.github.io`
3. For the bare apex domain (`mycourse.com`), add **A records** pointing to GitHub's Pages IPs:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (you can also add the AAAA records listed in GitHub's docs for IPv6).
4. In **Settings → Pages → Custom domain**, enter the same domain and click **Save**. Once the DNS check passes, tick **Enforce HTTPS**. The certificate can take up to about an hour to be issued.
5. Recommended: **verify the domain** for your account (**Settings → Pages → Add a domain**, in your *profile* settings) so nobody else can take it over.

---

## 5. Adding more modules

The course is designed to grow one module at a time. Keep lessons visual: a one-line lead, then examples.

1. **Content:** in `index.html`, find the comment `<!-- @@NEXT_MODULE@@ -->` and paste the new `<section id="mX" data-module="mX">…</section>` just above it. Inside the section, each lesson is an `<article id="mX-l1" data-lesson data-title="…">`.
2. **Curriculum:** in `script.js`, the module is already listed in `CURRICULUM`. While its `<section>` is missing, the sidebar shows it as *Coming soon*. Once you add the section, the sidebar lists its lessons automatically.
3. **Interactive diagrams:** add a function to `WIDGETS` in `script.js` and use it in the HTML with `<div data-widget="name"></div>`. For before/after comparisons, use `<div data-widget="before-after" data-before-label="…" data-after-label="…"><div data-before>…</div><div data-after>…</div></div>`.

## 6. Tech notes

- Tailwind is loaded with `https://cdn.tailwindcss.com` (the Play CDN). That is fine for a static course site. If you later want the smallest possible CSS, compile it with the Tailwind CLI instead.
- All diagrams are inline SVG or built in JavaScript, so there are no external image files to break.
- Procreate® is a trademark of Savage Interactive Pty Ltd. This course is independent and not affiliated with or endorsed by Savage Interactive.
