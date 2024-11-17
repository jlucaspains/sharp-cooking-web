<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
    modelValue: boolean;
    displayName: string;
    displayDescription: string;
    testId: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const localValue = ref(false);

watch(
    () => props.modelValue,
    (newValue: boolean) => {
        localValue.value = newValue;
    }
);

onMounted(() => {
    localValue.value = props.modelValue;
});

function updateValue(value: boolean) {
    emit("update:modelValue", value);
}
</script>

<template>
    <div>
        <span class="dark:text-white">{{ props.displayName }}</span>
        <label data-testid="{{props.testId}}" class="switch float-right align-middle">
            <input :checked="localValue" type="checkbox" @change="evt => updateValue((evt.target as HTMLInputElement).checked)">
            <span class="slider round"></span>
        </label>
        <div>
            <span class="text-gray-500 text-sm">{{ props.displayDescription }}</span>
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

input:checked+.slider {
    background-color: #2196F3;
}

input:focus+.slider {
    box-shadow: 0 0 1px #2196F3;
}

input:checked+.slider:before {
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
