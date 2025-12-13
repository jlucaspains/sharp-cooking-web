<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
    images: Array<{ type: string, url: string }>;
}>();

const emit = defineEmits<{
    (e: "selectionChanged", value: number): void;
}>();

const el = ref<HTMLDivElement>();
const activeImage = ref(0);
const isOpen = ref(false);

watch(activeImage,
    () => {
        emit("selectionChanged", activeImage.value);
        scroll();
    }
);

let imageEl: HTMLUListElement | null = null;
let thumbNavEl: HTMLUListElement | null = null;

onMounted(() => {
    if (el.value) {
        imageEl = el.value.querySelectorAll('ul')[0];
        thumbNavEl = el.value.querySelectorAll('ul')[1];
    }
});

function next() {
    activeImage.value = activeImage.value + 1 < props.images.length ? activeImage.value + 1 : 0;
}

function prev() {
    activeImage.value = activeImage.value > 0 ? activeImage.value - 1 : props.images.length - 1;
}

function scroll() {
    scrollToImage();
    scrollToThumb();
}

function scrollToThumb() {
    if (!thumbNavEl) {
        return;
    }

    const activeThumb = thumbNavEl.querySelector('ul li:nth-child(0n+' + (activeImage.value + 1) + ')') as HTMLLIElement;

    if (!activeThumb) {
        return;
    }

    thumbNavEl.scrollLeft = (activeThumb.offsetLeft - activeThumb.clientWidth) - (thumbNavEl.clientWidth / 2) + (activeThumb.clientWidth / 2);
}

function scrollToImage() {
    if (!imageEl || !thumbNavEl) {
        return;
    }

    const localActiveImage = imageEl.querySelector('ul li:nth-child(0n+' + (activeImage.value + 1) + ')') as HTMLLIElement;

    if (!localActiveImage) {
        return;
    }

    imageEl.scrollLeft = localActiveImage.offsetLeft - (imageEl.clientWidth / 2);
}

function toggleImageIfNotOpen(index: number) {
    if (!isOpen.value) {
        toggleImage(index);
    }
}

function toggleImage(index: number) {
    isOpen.value ? close() : open();
    // wait for css rendering then scroll to active image
    setTimeout(function () {
        scroll();
        activeImage.value = index;
    }, 100);
}

function open() {
    document.body.style.overflowY = 'hidden';
    document.body.style.height = '100vh';
    isOpen.value = true;
}

function close() {
    document.body.style.overflowY = '';
    document.body.style.height = '';
    isOpen.value = false;
}
</script>
    
<template>
    <div class="grid grid-cols-12 w-full lg:max-w-7xl mx-auto lg:p-4">
        <div class="col-span-12 lg:mr-2">
            <div class="transition-all duration-1000 ease-in-out w-full" ref="el"
                :class="{ 'fixed top-0 bottom-0 right-0 left-0 z-50 w-screen h-screen overflow-hidden bg-white dark:bg-theme-gray flex flex-col gap-4 p-6': isOpen }">

                <div v-show="isOpen" class="btn-close-section">
                    <a href="#" @click.prevent="toggleImage(activeImage)">
                        <svg class="h-6 w-6 float-right dark:text-white" width="24" height="24" viewBox="0 0 24 24"
                            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round"
                            stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" />
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </a>
                </div>
                <ul
                    class="list-images flex flex-grow-1 flex-nowrap overflow-x-scroll whitespace-nowrap snap snap-x snap-mandatory no-scrollbar scroll-behavior-smooth pb-6">
                    <template v-for="(image, i) in props.images" :key="`image-${i}`">
                        <li class="w-full shrink-0 snap-start">
                            <a v-if="image.type == 'img'" href="#" @click.prevent="toggleImageIfNotOpen(i)">
                                <img :alt="`Image Gallery ${i}`" :src="image.url"
                                    :class="{ 'm-auto max-w-full': true, 'lg:max-h-80 max-h-60': !isOpen, 'lg:max-h-full': isOpen }">
                            </a>
                            <iframe v-else title="Youtube video" class="youtube-player lg:h-80 h-60" type="text/html"
                                width="100%" height="100%" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen="allowfullscreen" 
                                frameborder="0"
                                referrerpolicy="strict-origin-when-cross-origin"
                                :src="image.url"></iframe>
                        </li>
                    </template>
                </ul>

                <div class="m-auto max-w-full">
                    <div class="flex" v-show="props.images.length > 1">
                        <a :class="{ 'hidden md:inline-flex': !isOpen, 'inline-flex': isOpen, 'h-28 grow-0 text-indigo-600 items-center text-xl bg-white dark:bg-theme-gray p-4': true }"
                            href="#" @click.prevent="prev">
                            <svg class="h-6 w-6 dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <line x1="5" y1="12" x2="11" y2="18" />
                                <line x1="5" y1="12" x2="11" y2="6" />
                            </svg>
                        </a>
                        <ul
                            :class="{ 'md:hidden': !isOpen, 'hidden': isOpen, 'flex mx-auto grow justify-center flex-nowrap overflow-x-scroll whitespace-nowrap snap snap-x snap-mandatory no-scrollbar scroll-behavior-smooth': true }">
                            <template v-for="(image, i) in props.images" :key="`thumb-${i}`">
                                <li class="shrink-0 snap-start mx-1">
                                    <a class="inline-block" href="#" @click.prevent="activeImage = i">
                                        <svg :class="{ 'h-6 w-6': true, 'dark:text-white': activeImage == i, 'text-slate-400': activeImage != i }"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        </svg>
                                    </a>
                                </li>
                            </template>
                        </ul>
                        <ul
                            :class="{ 'hidden md:flex': !isOpen, 'flex': isOpen, 'grow flex-nowrap overflow-x-scroll whitespace-nowrap snap snap-x snap-mandatory no-scrollbar scroll-behavior-smooth': true }">
                            <template v-for="(image, i) in props.images" :key="`nav-${i}`">
                                <li class="shrink-0 snap-start  mx-1">
                                    <a class="inline-block border-4" href="#" @click.prevent="activeImage = i"
                                        :class="{ 'border-indigo-600': activeImage == i, 'border-white': activeImage != i }">
                                        <img v-if="image.type == 'img'" :alt="`Image Gallery ${i}`" :src="image.url"
                                            class="w-28" height="150" width="150">
                                        <div v-else>
                                            <svg class="h-20 w-20 dark:text-white" xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24">
                                                <path fill="currentColor"
                                                    d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.89 20.1 3 19 3M10 16V8L15 12" />
                                            </svg>
                                        </div>
                                    </a>
                                </li>
                            </template>
                        </ul>
                        <a :class="{ 'hidden md:inline-flex': !isOpen, 'inline-flex': isOpen, 'h-28 grow-0 items-center text-xl text-indigo-600 bg-white dark:bg-theme-gray p-4': true }"
                            href="#" @click.prevent="next">
                            <svg class="h-6 w-6 dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
                                stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <line x1="13" y1="18" x2="19" y2="12" />
                                <line x1="13" y1="6" x2="19" y2="12" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
body {
    font-family: 'Quicksand', sans-serif;
}

.scroll {
    display: flex;
    flex-wrap: nowrap;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    -ms-overflow-style: -ms-autohiding-scrollbar;
}

/* iOS devices */
@supports (-webkit-overflow-scrolling: touch) {
    .scroll {
        -webkit-overflow-scrolling: touch;
    }
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
}

.scroll-behavior-smooth {
    scroll-behavior: smooth;
}

.snap {
    scroll-snap-type: var(--scroll-snap-direction) var(--scroll-snap-constraint);
}

.snap-y {
    --scroll-snap-direction: y;
}

.snap-x {
    --scroll-snap-direction: x;
}

.snap-mandatory {
    --scroll-snap-constraint: mandatory;
}

.snap-start {
    scroll-snap-align: start;
}

.btn-close-section {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}

.list-images {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
}
</style>