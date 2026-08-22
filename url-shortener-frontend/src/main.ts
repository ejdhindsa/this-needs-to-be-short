import { createApp } from "vue";
import "@unwreck/core/reset";
import "@unwreck/core/css";
import "@unwreck/core/fonts.css";
import "./style.scss";
import App from "./App.vue";

const app = createApp(App);

app.mount("#app");
