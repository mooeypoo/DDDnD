<template>
  <v-app>
    <v-app-bar>
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-avatar image="images/logo-small.png" rounded="0"></v-avatar>
      <v-app-bar-title>DDDnD</v-app-bar-title>
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
import { RouterLink, RouterView } from 'vue-router'
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
      // links: [
      //   {
      //     icon: 'mdi-home',
      //     text: 'Home',
      //     route: '/'
      //   },
      //   {
      //     icon: 'mdi-open-in-new',
      //     text: 'Made with ♥ by Moriel',
      //     external: true,
      //     route: 'https://moriel.tech'
      //   }
      // ]
    }
  },
  computed: {
    // computedLinks() {
    //   return this.links.map((link) => {
    //     const linkProps = {}
    //     linkProps[link.external ? 'href' : 'to'] = link.route
    //     linkProps.target = link.external ? '_blank' : ''
    //     return {
    //       ...link,
    //       linkProps
    //     }
    //   })
    // }
  }
}

// const items = [
//   {
//     title: 'Foo',
//     value: 'foo'
//   },
//   {
//     title: 'Bar',
//     value: 'bar'
//   },
//   {
//     title: 'Fizz',
//     value: 'fizz'
//   },
//   {
//     title: 'Buzz',
//     value: 'buzz'
//   }
// ]

// const drawer = ref(false)
// const group = ref(null)

// watch(group, () => {
//   drawer.value = false
// })
</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
