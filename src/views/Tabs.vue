<template>
  <ion-page>
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="Train" href="/Train">
          <ion-icon :icon="flashOutline" />
          <ion-label>Train</ion-label>
        </ion-tab-button>
          
        <ion-tab-button tab="Leaderboard" href="/Leaderboard">
          <ion-icon :icon="trophyOutline" />
          <ion-label>Leaderboard</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="Help" href="/Help">
          <ion-icon :icon="helpCircleOutline"></ion-icon>
          <ion-label>Help</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="Settings" href="/Settings">
          <ion-icon :icon="cogOutline"></ion-icon>
          <ion-label>Settings</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage } from '@ionic/vue';
import { flashOutline, trophyOutline, helpCircleOutline, cogOutline } from 'ionicons/icons';

export default {
  name: 'Tabs',
  components: { IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage },
  setup() {
    return {
      flashOutline,
      trophyOutline,
      helpCircleOutline,
      cogOutline,
    }
  }
}
</script>
