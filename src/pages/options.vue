<script setup lang="ts">
import { onMounted } from "vue";
import { useState } from "../services/store";

const state = useState()!;

onMounted(() => {
  state.title = "Options";
});
</script>

<template>
<div class="mt-16 w-full px-4 lg:px-96 mx-auto">
  <div class="py-2 dark:text-white">
    <label class="dark:text-white">Steps Interval</label>
    <div class="dark:text-white float-right ">
      <button class="mr-2 align-top">2 minutes</button>
      <button><svg class="h-6 w-6"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="9 6 15 12 9 18" /></svg></button>
    </div>
    <div>
      <span class="text-gray-500 text-sm">Interval used when no information is available for the step</span>
    </div>
  </div>
  <div class="mt-4 py-2">
    <span class="dark:text-white">Multipler uses fractions</span>
    <label class="switch float-right align-middle">
      <input type="checkbox">
      <span class="slider round"></span>
    </label>
    <div>
      <span class="text-gray-500 text-sm">Uses fractions over decimals</span>
    </div>
  </div>
  <div class="mt-4 py-2">
    <span class="dark:text-white">Take a backup</span>
    <div class="dark:text-white float-right ">
      <button><svg class="h-6 w-6"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="9 6 15 12 9 18" /></svg></button>
    </div>
    <div>
      <span class="text-gray-500 text-sm">Keep your data safe with a file backup</span>
    </div>
  </div>
  <div class="mt-4 py-2">
    <span class="dark:text-white">Restore a backup</span>
    <div class="dark:text-white float-right ">
      <button><svg class="h-6 w-6"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="9 6 15 12 9 18" /></svg></button>
    </div>
    <div>
      <span class="text-gray-500 text-sm">Restore your data to a known point</span>
    </div>
  </div>
  
  <div class="mt-4 py-2">
    <span class="dark:text-white">Release Notes</span>
    <div class="dark:text-white float-right ">
      <button><svg class="h-6 w-6"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="9 6 15 12 9 18" /></svg></button>
    </div>
    <div>
      <span class="text-gray-500 text-sm">v2022.05.22</span>
    </div>
  </div>
  <div class="mt-4 py-2">
    <span class="dark:text-white">Terms of Use</span>
    <div class="dark:text-white float-right ">
      <button><svg class="h-6 w-6"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="9 6 15 12 9 18" /></svg></button>
    </div>
    <div>
      <span class="text-gray-500 text-sm">Review the terms of use of Sharp Cooking</span>
    </div>
  </div>
  <div class="mt-4 py-2">
    <span class="dark:text-white">Privacy Policy</span>
    <div class="dark:text-white float-right ">
      <button><svg class="h-6 w-6"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="9 6 15 12 9 18" /></svg></button>
    </div>
    <div>
      <span class="text-gray-500 text-sm">Review our policy to understand what we know and keep about you</span>
    </div>
  </div>
</div>
</template>

<style>
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 17px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 13px;
  width: 13px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(13px);
  -ms-transform: translateX(13px);
  transform: translateX(13px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 17px;
}

.slider.round:before {
  border-radius: 50%;
}

</style>