# Improvising Fugue — Web

Angular 22 frontend for Improvising Fugue, a gamified course in historical keyboard improvisation, partimento and fugue.

## Running locally

Start the API first (see the `Improvising Fugue Backend` repo), then:

```powershell
npm install
npm start
```

Open `http://localhost:4200`. `proxy.conf.json` forwards `/api` to `http://localhost:5008`, so the refresh-token cookie stays same-origin.

```powershell
npm test
npm run build
```

## Structure

```
src/app/core/       API client, auth service + interceptor, guards, audio, music helpers, models
src/app/shared/     Icon set, VexFlow notation renderer, piano keyboard
src/app/layout/     Authenticated shell (top nav, bottom nav on mobile)
src/app/pages/      Landing, auth, dashboard, learn tree, lesson player, review, account, premium
src/app/pages/exercises/  Exercise components (info, multiple choice, ordering, keyboard)
```

## Notes

- The access token is kept in memory; the session is restored on load from the HttpOnly refresh cookie.
- VexFlow is lazy-loaded only on pages that show notation.
- Keyboard exercises emit MIDI note numbers, so Web MIDI input can drive them later without changing the grader.
- To add an exercise type: add a component in `pages/exercises`, a case in `lesson-player.page.ts`, and a grader case in the API's `ExerciseGrader`.
