<template>
  <v-app>
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
  </v-app>
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
