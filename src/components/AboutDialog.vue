<template>
  <v-dialog width="auto">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        class="text-none mb-2"
        prepend-icon="mdi-help-circle-outline"
        size="x-small"
        stacked
        text="About"
        tile
        variant="text"
        width="80"
      />
    </template>
    <template v-slot:default="{ isActive }">
      <v-card
        color="primary"
        title="What's up with DDDnD?"
        max-width="800"
        prepend-icon="mdi-information-outline"
      >
        <v-card-text class="bg-surface-light pt-4 pb-0">
          <p>
            I had this idea of DDDnD for a few years now, but I wasn't entirely sure what to do with
            it. Initial plans were super grandiose game with dice rolls and character sheets and, as
            we all know from waterfalling architecture, I didn't even know where to start.
          </p>
          <p>
            So I decided to restart with something super simple. Funny, but with a point. I wrote an
            idea. It was added to the endless list of ideas I never have time for.
          </p>
          <p>.... Until now.</p>
          <p>
            I give you:
            <span class="text-h6 bg-pink-darken-4 text-pink-lighten-3 pa-1">DDDnD</span>, the online
            card-like adventure game where you're the architect hero, and reality is your monster
            foes.
          </p>
          <p>
            Can you lead The Company to architectural success? Will the devs be happy? Would reality
            rear its mighty sword? It's up to you!
          </p>
          <p>
            The game is meant as an amusing funny way to wrangle DDD concepts and challenges.
            There's no losers.
          </p>
          <p>
            Have ideas on things to add? this game is completely open source. Pull requests, feature
            suggestions and bug reports are very welcome!
          </p>
          <p>
            You could, theoretically, cheat, by
            <a href="https://github.com/mooeypoo/DDDnD" target="_blank">reading the code</a> - but
            no one will care. This is fictional! There are no losers!
          </p>
        </v-card-text>
        <v-card-text class="bg-surface-light d-flex justify-end">
          <v-btn
            color="primary"
            variant="text"
            text="Moriel"
            href="https://moriel.tech"
            target="_blank"
          >
            <template v-slot:prepend>
              <v-avatar image="/images/moriel-100px.png"></v-avatar>
            </template>
          </v-btn>
        </v-card-text>
        <v-card-actions class="bg-surface-light">
          <v-spacer></v-spacer>

          <v-btn
            color="primary"
            variant="elevated"
            text="Close Dialog"
            @click="isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style lang="scss">
.v-card-text {
  p {
    margin: 1em 0;
  }
}
</style>
