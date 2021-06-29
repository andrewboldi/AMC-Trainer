<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Train</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-button id="New" size="large">New</ion-button>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Train</ion-title>
        </ion-toolbar>
      </ion-header>
   <p>hi</p> 

    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';

export default  {
  name: 'Train',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage }
}
</script>

<style scoped>
p {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%);
}
#New {
    position: absolute;
    width: 10em;
    height: 5em;
    margin: auto;
    right: 5em;
    top: 5em;
}

</style>
