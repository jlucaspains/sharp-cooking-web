<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../../../services/store";
import {
  getRecipe,
  getSetting,
} from "../../../services/dataService";

const { t } = useTranslation();
const route = useRoute();
const state = useState()!;

const scrollBox = ref(null as HTMLDivElement | null);

const messages = ref([
  {
    role: "user",
    content: `
You are a helpful chef's assistant. 

You answer any questions about cooking, baking, and food. Do not answer questions that are not related to cooking, baking, and food.

When you provide answers, keep them as short as possible and without explanation.

The following recipe is the current users recipe:

Sourdough Bread

Ingredients:
142g whole wheat flour
312g white bread flour
7.1g salt
354g purified water
80g starter

Instructions:
Mix together the dry ingredients
Dissolve the starter into water
Add wet into dry ingredients and stir until incorporated
Cover with plastic or airtight lid and reserve for 15 minutes
Perform the first set of folds and reserve for another 15 minutes
Perform the second set of folds and reserve for another 15 minutes
Perform the third set of folds and make a window pane test. If gluten is not developed yet, repeat this step
Ferment for 10-14 hours at room temperature (68F - 72F)
Shape and proof for about 2 hours
Bake in covered dutch oven ou La Cloche at 420F for 30 minutes
Uncover and bake for another 15 minutes
Let it cool completely on cooling rack before carving`,
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
]);
const userQuery = ref("");

const id = computed(() => parseInt(route.params.id as string));
const stopMenu = {
  text: "Stop",
  svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />`,
  action: () => {
    cancellationRequested = true;
    controller?.abort();
  },
  hidden: true
};

let openAIBaseApiUrl = "";
let openAIAuthorizationHeader = "";
let openAIModel = "";

let cancellationRequested = false;
let controller: AbortController;

onMounted(async () => {
  state.title = "Chat";
  state.useContainer = false;
  state.menuOptions = [];

  openAIBaseApiUrl = await getSetting("OpenAIBaseApiUrl", "http://raspberrypi:11434");
  openAIAuthorizationHeader = await getSetting("OpenAIAuthorizationHeader", "");
  openAIModel = await getSetting("OpenAIModelName", "recipe-assistant");
});

async function askAssistant(query: string) {
  state.menuOptions = [stopMenu];
  var message = {
    role: "assistant",
    content: "...",
    hiddenFromUser: false,
    hiddenFromAssistant: false,
    thinking: true
  };
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
        messages.value[newMessageIndex].content = "Sorry, I am unable to answer your question at the moment.";
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
    }).catch((error) => {
      console.error('Error:', error);
      if (error.name === 'AbortError') {
        messages.value[newMessageIndex].content = "Ok. I won't answer that.";
      } else {
        throw error;
      }
    });
  } catch (error) {
    console.error('Error:', error);
    messages.value[newMessageIndex].content = "Sorry, I am unable to answer your question at the moment.";
  } finally {
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

  await askAssistant(query);
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
              class="w-full p-2 rounded-md border text-black border-gray-400 focus:outline-none focus:border-blue-500">
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