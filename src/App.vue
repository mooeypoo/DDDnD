<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" permanent width="80">
      <div class="d-flex justify-center pa-4">
        <v-avatar image="https://vuetifyjs.b-cdn.net/docs/images/logos/v.svg" />
      </div>

      <v-btn
        class="text-none"
        prepend-icon="mdi-view-dashboard"
        size="x-small"
        stacked
        text="Dashboard"
        tile
        variant="text"
        width="80"
      />

      <v-btn class="text-none" size="x-small" stacked tile variant="text" width="80">
        <v-badge content="39" floating>
          <v-icon>mdi-account-circle</v-icon>
        </v-badge>

        <div class="mt-1">Friends</div>
      </v-btn>

      <v-btn
        class="text-none"
        prepend-icon="mdi-cloud-download"
        size="x-small"
        stacked
        text="Downloads"
        tile
        variant="text"
        width="80"
      />

      <v-btn
        class="text-none"
        prepend-icon="mdi-history"
        size="x-small"
        stacked
        text="History"
        tile
        variant="text"
        width="80"
      />

      <v-btn
        class="text-none"
        prepend-icon="mdi-currency-usd"
        size="x-small"
        stacked
        text="Sales"
        tile
        variant="text"
        width="80"
      />

      <v-btn
        class="text-none"
        prepend-icon="mdi-trending-up"
        size="x-small"
        stacked
        text="Trend"
        tile
        variant="text"
        width="80"
      />

      <template #append>
        <div class="d-flex justify-center pa-4">
          <v-btn icon variant="text">
            <v-avatar image="https://cdn.vuetifyjs.com/images/john.jpg" />

            <v-menu activator="parent" location="top">
              <v-list density="compact" nav slim>
                <v-list-item link prepend-icon="mdi-cog" title="Settings" />

                <v-list-item link prepend-icon="mdi-logout" title="Logout" />
              </v-list>
            </v-menu>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar :elevation="2" title="Application">
      <template #prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
      </template>
    </v-app-bar>

    <v-main>
      <div class="pa-4">
        <h2 class="text-h4 font-weight-bold mb-4">Dashboard</h2>

        <v-sheet border="dashed md" color="surface-light" height="500" rounded="lg" width="100%" />
      </div>
    </v-main>
  </v-app>

  <!-- <v-app>
    <v-app-bar>
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-avatar image="images/logo-small.png" rounded="0"></v-avatar>
      <v-app-bar-title>DDDnD</v-app-bar-title>
      <v-separator></v-separator>
      <template v-slot:append>
        {{ useUserStore().name }}
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :location="$vuetify.display.mdAndUp ? undefined : 'bottom'"
      temporary
    >
      <v-list class="pl-3" :items="drawerItems" lines="two" item-props>
        <template v-slot:subtitle="{ subtitle }">
          <div v-html="subtitle"></div>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
    </v-main>
  </v-app> -->
</template>

<script setup>
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
</script>

<script>
export default {
  data() {
    return {
      drawer: true,
      drawerItems: [
        // { type: 'subheader', title: 'Today' },
        {
          prependIcon: 'mdi-home',
          // prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          title: 'Home'
          // subtitle: `<span class="text-primary">Ali Connors</span> &mdash; I'll be in your neighborhood doing errands this weekend. Do you want to hang out?`,
        },
        { type: 'divider', inset: true },
        {
          prependIcon: 'mdi-open-in-new',
          // prependAvatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          title: 'Made with ♥ and JS',
          subtitle: `by Moriel Schottlender`,
          href: 'https://moriel.tech',
          target: '_blank'
        }
      ]
    }
  },
  computed: {}
}
</script>

<style scoped></style>
