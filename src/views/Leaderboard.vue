<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Leaderboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Leaderboard</ion-title>
        </ion-toolbar>
      </ion-header>
      
    <p>leaderboard goes here</p>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';

export default  {
  name: 'Leaderboard',
  components: {IonHeader, IonToolbar, IonTitle, IonContent, IonPage }
}
</script>

<style scoped>

</style>