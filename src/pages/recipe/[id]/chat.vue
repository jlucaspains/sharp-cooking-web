<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../../../services/store";
import {
  getRecipe,
  getSetting,
} from "../../../services/dataService";
import { recipeAsText } from "../../../helpers/shareHelpers";

const { t } = useTranslation();
const route = useRoute();
const state = useState()!;

const scrollBox = ref(null as HTMLDivElement | null);

const promptTemplate = `You are a helpful chef's assistant. 

You answer any questions about cooking, baking, and food. Do not answer questions that are not related to cooking, baking, and food.

When you provide answers, keep them as short as possible and without explanation.

The following recipe is the current recipe:

{RecipeText}`;

type Message = {
  role: "user" | "assistant";
  content: string;
  hiddenFromAssistant: boolean;
  hiddenFromUser: boolean;
  thinking?: boolean;
};

const messages = ref([] as Message[]);
const userQuery = ref("");

const id = computed(() => parseInt(route.params.id as string));
const stopMenu = {
  text: "Stop",
  svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />`,
  action: () => {
    cancellationRequested = true;
    controller?.abort("AbortError");
  }
};

let openAIBaseApiUrl = "";
let openAIAuthorizationHeader = "";
let openAIModel = "";

let cancellationRequested = false;
let controller: AbortController;

onMounted(async () => {
  state.title = "Chat";
  state.useContainer = false;
  setMenuOptions(false);

  openAIBaseApiUrl = await getSetting("OpenAIBaseApiUrl", "");
  openAIAuthorizationHeader = await getSetting("OpenAIAuthorizationHeader", "");
  openAIModel = await getSetting("OpenAIModelName", "");

  const recipe = await getRecipe(id.value);

  if (recipe != undefined) {
    const prompt = promptTemplate.replace("{RecipeText}", recipeAsText(recipe));

    messages.value = [
      {
        role: "user",
        content: prompt,
        hiddenFromAssistant: false,
        hiddenFromUser: true
      },
      {
        role: "assistant",
        content: "What can I help you with?",
        hiddenFromAssistant: true,
        hiddenFromUser: false,
        thinking: false
      },
    ];
  }
});

onBeforeRouteLeave((to, from, next) => {
  state.useContainer = true;
  next();
});

async function askAssistant() {
  setMenuOptions(true);

  const message = {
    role: "assistant",
    content: "...",
    hiddenFromUser: false,
    hiddenFromAssistant: true,
    thinking: true
  } as Message;
  const newMessageIndex = messages.value.push(message) - 1;

  controller = new AbortController();
  const signal = controller.signal;

  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (openAIAuthorizationHeader) {
    headers["Authorization"] = openAIAuthorizationHeader;
  }

  try {
    const responsePromise = fetch(`${openAIBaseApiUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: `{
    "model": "${openAIModel}",
    "stream": true,
    "messages": ${JSON.stringify(messages.value.filter(item => !item.hiddenFromAssistant))}
  }`,
      signal
    });

    responsePromise.then(async response => {
      messages.value[newMessageIndex].content = "";
      messages.value[newMessageIndex].thinking = false;

      if (!response.ok) {
        messages.value[newMessageIndex].content = t("pages.chat.unableToAnswer");
        return;
      }

      const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
      if (!reader) return;
      while (true) {
        if (cancellationRequested) {
          reader.cancel();
          cancellationRequested = false;
          break;
        }

        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        const lines = value.split('\n');
        const parsedLines = lines
          .map((line) => line.replace(/^data: /, "").trim())
          .filter((line) => line !== "" && line !== "[DONE]")
          .map((line) => JSON.parse(line));

        for (const parsedLine of parsedLines) {
          messages.value[newMessageIndex].content += parsedLine.choices[0].delta.content;
        }
        scrollBox.value?.scrollIntoView({ behavior: "smooth" });
      }
      setMenuOptions(false);
    }).catch((error) => {
      setMenuOptions(false);
      messages.value[newMessageIndex].thinking = false;
      if (error === 'AbortError' || error.name === 'AbortError') {
        messages.value[newMessageIndex].content = t("pages.chat.abortError");
      } else {
        messages.value[newMessageIndex].content = t("pages.chat.unableToAnswer");
      }
    });
  } catch {
    messages.value[newMessageIndex].thinking = false;
    messages.value[newMessageIndex].content = t("pages.chat.unableToAnswer");
    setMenuOptions(false);
  }
}

function setMenuOptions(isQuerying: boolean) {
  if (isQuerying) {
    state.menuOptions = [stopMenu];
  } else {
    state.menuOptions = [];
  }
}

async function sendMessage() {
  const query = userQuery.value;
  messages.value.push({
    role: "user",
    content: query,
    hiddenFromAssistant: false,
    hiddenFromUser: false
  });
  userQuery.value = "";

  await askAssistant();
}
</script>

<template>
  <div>
    <div class="flex">
      <!-- Main Chat Area -->
      <div class="flex-1">
        <!-- Chat Messages -->
        <div class="pt-4 pb-8 container mx-auto">

          <template v-for="item of messages">
            <!-- Thinking Message -->
            <div v-if="item.thinking" class="flex mb-4 cursor-pointer">
              <div
                class="min-w-10 min-h-10 w-10 h-10 bg-theme-primary rounded-full flex items-center justify-center mr-2">
                <img src="/logo2.svg" alt="Assistant" class="w-8 h-8">
              </div>
              <div class="flex max-w-96  rounded-lg p-3 gap-3">
                <span class="jumping-dots">
                  <span class="dot-1 bg-theme-primary"></span>
                  <span class="dot-2 bg-theme-primary"></span>
                  <span class="dot-3 bg-theme-primary"></span>
                </span>
              </div>
            </div>

            <!-- Assistant Message -->
            <div v-if="!item.thinking && item.role == 'assistant'" class="flex mb-4 cursor-pointer">
              <div
                class="min-w-10 min-h-10 w-10 h-10 bg-theme-primary rounded-full flex items-center justify-center mr-2">
                <img src="/logo2.svg" alt="Assistant" class="w-8 h-8">
              </div>
              <div class="flex max-w-96 bg-white rounded-lg p-3 gap-3">
                <p class="text-gray-700 keep-spaces">{{ item.content }}</p>
              </div>
            </div>

            <!-- User Message -->
            <div v-if="item.role == 'user' && !item.hiddenFromUser" class="flex justify-end mb-4 cursor-pointer">
              <div class="flex max-w-96 bg-indigo-500 text-white rounded-lg p-3 gap-3">
                <p class="keep-spaces">{{ item.content }}</p>
              </div>
              <div
                class="min-w-10 min-h-10 w-10 h-10 bg-theme-primary rounded-full flex items-center justify-center ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-8 h-8 rounded-full">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            </div>
          </template>
          <div ref="scrollBox"></div>
        </div>

        <!-- Chat Input -->
        <footer class="bg-white border-t border-gray-300 -mx-4 p-4 fixed bottom-0 w-full safe-inset">
          <div class="flex items-center">
            <input type="text" @keydown.enter="sendMessage" v-model="userQuery" placeholder="Type a message..."
              class="w-full p-2 rounded-md border bg-white text-black border-gray-400 focus:outline-hidden focus:border-blue-500">
            <button class="bg-indigo-500 text-white px-4 py-2 rounded-md ml-2" @click="sendMessage">Send</button>
          </div>
        </footer>
      </div>
    </div>

  </div>
</template>

<style scoped>
.safe-inset {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
}

.keep-spaces {
  white-space: pre-wrap;
}

.jumping-dots span {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  animation: jump 1s infinite;
  display: inline-block;
}

.jumping-dots .dot-1 {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 3px;
  animation-delay: 200ms;
}

.jumping-dots .dot-2 {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 3px;
  animation-delay: 400ms;
}

.jumping-dots .dot-3 {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 3px;
  animation-delay: 600ms;
}

@keyframes jump {
  0% {
    bottom: 0px;
  }

  20% {
    bottom: 5px;
  }

  40% {
    bottom: 0px;
  }
}
</style>