<template>
  <v-navigation-drawer
    v-model="drawer"
    :location="$vuetify.display.mobile ? 'bottom' : undefined"
    temporary
  >
    <!-- <v-menu min-width="200px" rounded> -->
    <!-- <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" @click.stop="drawer = !drawer">
        <v-avatar color="white" variant="outlined" size="large">
          <v-img alt="DDDnD" src="/images/logo/dddnd.png"></v-img>
        </v-avatar>
      </v-btn>
    </template> -->
    <v-card>
      <v-card-item>
        <v-img alt="DDDnD logo" height="150" src="/images/logo/logo-128px.png"></v-img>
        <div class="mx-auto text-center">
          <p class="text-caption mt-1">A systems architecture adventure!</p>
        </div>
      </v-card-item>
      <v-card-item class="d-flex justify-center">
        <!-- START/RESTART GAME BUTTON -->
        <v-btn color="primary">START GAME</v-btn>
      </v-card-item>
      <v-card-item>
        <v-list density="compact">
          <v-list-subheader>INFORMATION</v-list-subheader>
          <v-list-item value="start" color="primary">
            <template v-slot:prepend>
              <v-icon icon="mdi-party-popper" />
            </template>

            <v-list-item-title>Start game!</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-item>
      <!-- <v-card-text>
            <div class="mx-auto text-center">
              <v-divider class="my-3"></v-divider>
              <v-btn variant="text" rounded> Edit Account </v-btn>
              <v-divider class="my-3"></v-divider>
              <v-btn variant="text" rounded> Disconnect </v-btn>
            </div>
          </v-card-text> -->
    </v-card>
  </v-navigation-drawer>
  <!-- </v-menu> -->
</template>

<script setup></script>
