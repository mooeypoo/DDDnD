---
layout: home

hero:
  name: DDDnD
  text: Companion documentation
  tagline: Help, rules, and game-design notes for Domain-Driven Design n' Dragons.
  image:
    src: /logo.svg
    alt: DDDnD
  actions:
    - theme: brand
      text: Play the game
      link: https://dddnd.app
    - theme: alt
      text: View the code
      link: https://github.com/mooeypoo/DDDnD
---

<script setup>
import { withBase } from 'vitepress'
</script>

## The game

**DDDnD** is a free online card adventure about systems architecture under pressure. You join the council as the architect. Each turn you play one architecture card — or spend the turn searching for a better one — and try to leave the living system stronger than you found it before the clock runs out.

Play at [dddnd.app](https://dddnd.app). The source is on [GitHub](https://github.com/mooeypoo/DDDnD).

## Start here

This site is the companion documentation for that game. Pick the path that matches why you are here.

<div class="site-paths">
  <a class="path-card" :href="withBase('/guide/gameplay')">
    <h3>Player help</h3>
    <p>How to play: the war table, your hand of six, scores, aftershocks, and how a run ends.</p>
  </a>
  <a class="path-card" :href="withBase('/dashboard/')">
    <h3>Game design</h3>
    <p>What's in the pack, audit numbers, and how to write or change content.</p>
  </a>
</div>

## Latest From The Blog

<LatestBlogPosts />

---

## Created By

<AuthorBlock />
