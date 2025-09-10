<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../../../services/store";
import {
  getRecipe,
  getRecipeByName,
  getRecipes,
  getSetting,
  saveRecipe,
} from "../../../services/dataService";
import { recipeAsText } from "../../../helpers/shareHelpers";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph/web";
import {
  AIMessage,
  AIMessageChunk,
  ToolMessage
} from "@langchain/core/messages";
import { z } from "zod";
import { Runnable } from "@langchain/core/runnables";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";

const { t } = useTranslation();
const route = useRoute();
const state = useState()!;
let toolsByName: any;
let llmWithTools: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAICallOptions>;
let agentBuilder: any;
let controller: AbortController;

const scrollBox = ref(null as HTMLDivElement | null);

const systemPrompt = `You are a helpful chef's assistant. 

You answer any questions about cooking, baking, and food. Do not answer questions that are not related to cooking, baking, or food.

When asked about recipes, first look into the user's recipe book for the answer.

When you provide answers, keep them as short as possible and without explanation.`;

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  hiddenFromAssistant: boolean;
  hiddenFromUser: boolean;
  thinking?: boolean;
};

const messages = ref([{
  role: "assistant",
  content: "What can I help you with?",
  hiddenFromAssistant: true,
  hiddenFromUser: false,
  thinking: false
}] as Message[]);
const userQuery = ref("");

const id = computed(() => parseInt(route.params.id as string));
const stopMenu = {
  text: "Stop",
  svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />`,
  action: () => {
    cancellationRequested = true;
    controller?.abort();
  }
};

let cancellationRequested = false;

onMounted(async () => {
  state.title = "Chat";
  state.useContainer = false;
  setMenuOptions(false);

  const openAIAuthorizationHeader = await getSetting("OpenAIAuthorizationHeader", "");
  const openAIModel = await getSetting("OpenAIModelName", "");
  
  const llm = new ChatOpenAI({
    model: openAIModel,
    apiKey: openAIAuthorizationHeader,
    streaming: true,
  });

  // Define tools
  const getAllRecipes = tool(
    async () => {
      const allRecipes = await getRecipes();
      return allRecipes.map(item => item.title);
    },
    {
      name: "allRecipes",
      description: "Get list of all recipes in the cookbook",
      schema: z.object({}),
    }
  );

  const getCurrentRecipe = tool(
    async () => {
      const recipe = await getRecipe(id.value);

      if (!recipe) {
        return "";
      } else {
        return recipeAsText(recipe);
      }
    },
    {
      name: "currentRecipe",
      description: "Get the current recipe",
      schema: z.object({}),
    }
  )

  const lookupRecipeByName = tool(
    async (input: any) => {
      const recipe = await getRecipeByName(input.name);

      if (!recipe) {
        return "";
      } else {
        return recipeAsText(recipe);
      }
    },
    {
      name: "getRecipeByName",
      description: "Get a recipe by name",
      schema: z.object({
        name: z.string(),
      }),
    }
  )

  const updateRecipeIngredientsByName = tool(
    async (input: any) => {
      const recipe = await getRecipeByName(input.name);

      if (!recipe) {
        return "";
      } else {
        console.log(input.updatedIngredients);
        recipe.ingredients = input.updatedIngredients.split("\n");
        await saveRecipe(recipe);
        return "updated";
      }
    },
    {
      name: "updateRecipeIngredientsByName",
      description: "Updates a recipe ingredients by name. Provide the updated ingredients with each ingredient in a new line.",
      schema: z.object({
        name: z.string(),
        updatedIngredients: z.string()
      }),
    }
  )

  const tools = [getAllRecipes, getCurrentRecipe, lookupRecipeByName, updateRecipeIngredientsByName];
  toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  llmWithTools = llm.bindTools(tools);

  // Build workflow
  agentBuilder = new StateGraph(MessagesAnnotation)
    .addNode("llmCall", llmCall)
    .addNode("tools", toolNode)
    .addEdge("__start__", "llmCall")
    .addConditionalEdges(
      "llmCall",
      shouldContinue,
      {
        "Action": "tools",
        "__end__": "__end__",
      }
    )
    .addEdge("tools", "llmCall")
    .compile();
});

onBeforeRouteLeave((to, from, next) => {
  state.useContainer = true;
  next();
});

// Nodes
async function llmCall(state: typeof MessagesAnnotation.State) {
  // LLM decides whether to call a tool or not
  const result = await llmWithTools.invoke([
    {
      role: "system",
      content: systemPrompt
    },
    ...state.messages
  ], { options: { stream: true } });

  return {
    messages: [result]
  };
}

async function toolNode(state: typeof MessagesAnnotation.State) {
  const results: ToolMessage[] = [];
  const lastMessage = state.messages.at(-1) as AIMessage;

  if (lastMessage?.tool_calls?.length) {
    for (const toolCall of lastMessage.tool_calls) {
      const tool = toolsByName[toolCall.name];
      const observation = await tool.invoke(toolCall.args as any);
      results.push(
        new ToolMessage({
          content: observation.toString(),
          tool_call_id: toolCall.id ?? "",
        })
      );
    }
  }

  return { messages: results };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages as AIMessage[];
  const lastMessage = messages.at(-1);

  // If the LLM makes a tool call, then perform an action
  if (lastMessage?.tool_calls?.length) {
    return "Action";
  }
  // Otherwise, we stop (reply to the user)
  return "__end__";
}

async function askAssistant() {
  setMenuOptions(true);

  const llmMessages = messages.value.map(item => {
    return {
      role: item.role,
      content: item.content
    };
  });

  const message = {
    role: "assistant",
    content: "...",
    hiddenFromUser: false,
    hiddenFromAssistant: true,
    thinking: true
  } as Message;
  const newMessageIndex = messages.value.push(message) - 1;

  controller = new AbortController();

  try {
    const eventStream = await agentBuilder.streamEvents(
      { messages: llmMessages },
      { version: "v2", signal: controller.signal });

    let resultContent = "";
    for await (const { event, data } of eventStream) {
      console.log(event);
      if (event == "on_chain_stream") {
        console.log(data.chunk.llmCall?.messages[0].content);
        console.log(data.chunk.tools?.messages[0].content);
        if (data.chunk.llmCall && data.chunk.llmCall.messages[0].content) {
          resultContent += data.chunk.llmCall.messages[0].content;
        }
      }
    }
    messages.value[newMessageIndex].content = resultContent;
  }
  catch (error: any) {
    if (error.message === 'Aborted') {
      messages.value[newMessageIndex].content = t("pages.chat.abortError");
    } else {
      messages.value[newMessageIndex].content = t("pages.chat.unableToAnswer");
    }
  }

  setMenuOptions(false);
  messages.value[newMessageIndex].thinking = false;
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