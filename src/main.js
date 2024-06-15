import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Components
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark'
    },
    // icons: {
    //     defaultSet: 'mdi',
    //     aliases,
    //     sets: {
    //         mdi,
    //     },
    // },
})

createApp(App)
    .use(vuetify, {
        // iconfont: 'mdi'
    })
    .use(createPinia())
    .use(router)
    .mount('#app')

// const app = createApp(App)

// app.use(createPinia())
// app.use(router)

// app.mount('#app')
