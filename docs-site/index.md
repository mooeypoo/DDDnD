---
layout: home

hero:
  name: DDDnD
  text: Companion documentation
  tagline: Help, rules, and game-design notes for Domain-Driven Design n' Dragons.
  image:
    src: /logo.svg
    alt: DDDnD
---

<script setup>
import { withBase } from 'vitepress'
</script>

<div class="path-intros">
  <div>
    <h3>Player help</h3>
    <p>For anyone who wants to play. It covers the war table: your hand of six, scores, aftershocks, and how a run ends.</p>
    <a class="path-button" :href="withBase('/guide/gameplay')">Player help</a>
  </div>
  <div>
    <h3>Game design</h3>
    <p>For authors, testers, and anyone looking under the hood. It covers the content pack, audit numbers, and how to write or change adventures.</p>
    <a class="path-button" :href="withBase('/dashboard/')">Game design</a>
  </div>
</div>

## The game

**DDDnD** is a free online card adventure about systems architecture under pressure. You join the council as the architect. Each turn you play one architecture card — or spend the turn searching for a better one — and try to leave the living system stronger than you found it before the clock runs out.

Play at [dddnd.app](https://dddnd.app). The source is on [GitHub](https://github.com/mooeypoo/DDDnD).

## Latest From The Blog

<LatestBlogPosts />

---

## Created By

<AuthorBlock />
