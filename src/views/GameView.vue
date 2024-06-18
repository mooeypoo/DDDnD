<template>
  <div class="game">
    <h1>DDDnD: The Adventure</h1>
    <v-dialog v-model="gameDetailsDialog" width="auto">
      <v-card max-width="400" prepend-icon="mdi-update" title="Tell us who you are, warrior!">
        <v-text-field
          :rules="nameRules"
          hide-details="auto"
          label="Warrior name"
          v-model="username"
        ></v-text-field>
        <template v-slot:actions>
          <v-btn class="ms-auto" text="Start game" @click="startGame"></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/user.js'
import { useScoreStore } from '@/stores/score.js'
// import { useRouter } from 'vue-router'

export default {
  data() {
    return {
      nameRules: [
        (value) => !!value || 'Required.',
        (value) => (value && value.length >= 3) || 'Min 3 characters'
      ],
      gameDetailsDialog: false,
      username: ''
    }
  },
  computed: {
    userStore: () => useUserStore(),
    scoreStore: () => useScoreStore()
  },
  methods: {
    startGame() {
      this.userStore.setName(this.username)
      this.gameDetailsDialog = false
    }
  },
  mounted() {
    // console.log({
    //   name: this.userStore.name,
    //   money: this.scoreStore.money
    // })
    if (!this.userStore.name || !this.scoreStore.money) {
      //   router.push({ path: '/' })
      this.gameDetailsDialog = true
    }
  }
}
</script>

<style></style>
