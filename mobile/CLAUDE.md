# Hermes Mobile — Android
**Stack:** React Native · Expo SDK 56 · Expo Router · TypeScript
**Platform:** Android only (Expo managed workflow)
**Developer:** Joseph McCoy · github.com/jmac052002

## What This Is
A full-featured Android app replicating the Hermes Dashboard — 18 screens backed by the live Hermes REST API.

## API
Base URL: http://100.125.69.27:9119 (Tailscale — configurable in app Settings screen)
Auth: X-Hermes-Session-Token header (stored in SecureStore)

## Session Setup
cd ~/projects/hermes-mobile/mobile
npm install
npx expo start
