import { createApp } from "vue";
import { createPinia } from "pinia";
import "@unwreck/core/reset";
import "@unwreck/core/css";
import "@unwreck/core/fonts.css";
import "./style.scss";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
