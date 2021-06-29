<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Help</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Help</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-button
        size="large"
        onclick="window.location.href='Train'"
        style="border-radius: 1rem; font-size: 1.6em;"
        data-hover="Play"
        >Play</ion-button
      ><br /><br />

      <h1>Fun Intro 😎</h1>
      <h2 >Who?</h2>
      <p>
        <b>THE</b> math-enthusiast-tech savvy, 4.8-GPA-overachiever-future
        doctor and entrepreneur 💥 ℼ ∫ 🥇
      </p>

      <h2 >Why? 💹</h2>
      <p>
        We created this <b>AMAZING</b> math website to make <b>YOU</b> become
        the star 🌟 of your family and maybe your whole state! 🏆 <br /><br />
        If you just simply want to do <b>BETTER</b> on the next AMC test, then
        this is the website for you! 🥇
      </p>

      <h2 >What? 📈</h2>
      <p>
        A <b>FREE</b> interactive 👆 trainer which generates math problems for
        your specific AMC level (such as AMC 8/10/12/AIME).
      </p>

      <h2 >How? 👨‍💻</h2>
      <p>
        Generates problems from past AMC 8/10/12/AIME exams and caters to your
        specific level.
      </p>

      <h2 >What else? 💡</h2>
      <p>
        If you have any suggestions/comments please let us know
        <a
          target="_blank"
          href="https://artofproblemsolving.com/community/c1967976h2362114p19241124"
          >here</a
        >.
        <br />
        Happy 😎😃 MATHING 🧮 ➖👨‍🔬 ℼ ➗ ➕
        <br /><br />
        ~ Emojis courtesy of my mom 😜
      </p>

      <br />
      <h1>Navigation</h1>
      <h2 >Answer Format</h2>
      <p>
        The answer format for AMC 8/10/12 is a single letter from the multiple
        choice options (A, B, C, D, or E). You may enter the letter as uppercase
        or lowercase.
      </p>
      <p>
        For AIME problems, your answer must be a single 3-digit number. For
        example, if you find the answer to the problem is 123, please enter 123
        as your answer. Also, make sure to include leading zeros for numbers
        less than 100. For example, if your answer is 67, please enter 067. If
        your answer is 9, enter 009.
      </p>
      <h2 >Settings</h2>
      <p>
        The AMC trainer also provides several customization options. They are
        broken down by category below.
      </p>
      <h3 >Options</h3>
      <p>
        In this tab, you are able to customize which math competition to train
        with. You can choose a single exam version (AMC 8, AMC 10, AMC 12, or
        AIME) or a combination of all of them with the “All” option. You may
        also find that some problems in the AMC 10 show up in the AMC 12, or
        vice versa; this is because the MAA (Mathematical Association of
        America) specifically overlaps problems between the two tests. Although
        they may be the same problems, they are not always in the same section
        of the test. In other words, an AMC 12 5 might be placed as an AMC 10 11
        since AMC 12 problems tend to be more difficult than AMC 10 problems.
      </p>
      <h3 >Colors</h3>
      <p>
        In this tab, you can change the color of a variety of components on the
        webpage. At the top, you may change the text color of the problem and
        invert the images. This feature is implemented mostly to allow for a
        seamless experience with a dark color scheme (see below).
      </p>
      <p>
        In the colors settings, you can also customize the background and button
        colors. The first box will set the left color for the background
        gradient and the second box will set the right color for the background
        gradient. Also, the buttons are bound to the background gradient colors
        such that the first box will set the right color for the button gradient
        and the second box will set the left color for the button gradient. In
        other words, the background and button gradients are horizontally
        inversely bound to each other.
      </p>
      <h3 >Customization</h3>
      <p>
        In the final tab, you have the ability to toggle the wiggle of images
        when you hover over them. This is more for aesthetic purposes than for
        actually helping in training.
      </p>
      <p>
        You can also change the font family of all the text on the screen to
        your liking. It is important to note that some of the fonts will not
        render as it depends on the fonts installed on your browser (i.e.
        Chrome, Firefox, Safari, etc.) and operating system (i.e. Windows, Mac,
        Linux, etc.).
      </p>
      <h2 >Additional Features</h2>
      <p>
        You may have also noticed two other icons on the screen: the fire icon
        and the pencil image.
      </p>
      <h3 >Streak</h3>
      <p>
        The fire icon represents your correct problem streak. If you get a
        problem correct, your streak will increase by 1. Be careful! If you get
        a problem incorrect, your streak will reset to 0.
      </p>
      <h3>Drawing Tool</h3>
      <p>
        When you click on the pencil image, it triggers the on-screen drawing
        tool. With this drawing tool, you can change the color of your drawing
        tool, you can clear the screen with the garbage can icon, and you can
        also erase with the eraser icon.
      </p>

      <br /><br />

      <p>
        <ion-button
          size="large"
          onclick="window.location.href='Train'"
          data-hover="Go Train!"
          >Go train!</ion-button
        >
      </p>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from "@ionic/vue";

export default {
  name: "Help",
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage }
};
</script>


<style scoped>
ion-button {
  margin: 1rem;
  text-align: center !important;
  position: relative;
  width: 15rem;
  height: 5rem;
  left: 50%;
  transform: translateX(-50%); 
}
h1, h2, h3, p {
  text-align: left;
  padding: 0 20%;
}
h1 {
  font-size: 2.3rem;
  font-weight: 600;
  margin: 2rem 0;
}
</style>