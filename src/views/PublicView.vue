<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const announcements = ref([])
const selected = ref(null)

/* ---------------- LOAD ---------------- */
async function load() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    return
  }

  announcements.value = data || []
  selected.value = announcements.value[0] || null
}

onMounted(load)

/* ---------------- SELECT ---------------- */
function selectAnnouncement(a) {
  selected.value = a
}
</script>

<template>
  <div class="public">

    <!-- LEFT LIST -->
    <div class="sidebar">
      <h3>Announcements</h3>

      <div
        v-for="a in announcements"
        :key="a.id"
        class="item"
        @click="selectAnnouncement(a)"
      >
        <div class="title">{{ a.title }}</div>
        <small>{{ new Date(a.date).toLocaleString() }}</small>
      </div>
    </div>

    <!-- RIGHT CONTENT -->
    <div class="content">
      <div v-if="selected">
        <h2>{{ selected.title }}</h2>

        <!-- IMPORTANT: renders Tiptap HTML -->
        <div class="preview" v-html="selected.content"></div>
      </div>

      <div v-else>
        No announcement selected
      </div>
    </div>

  </div>
</template>

<style>
.public {
  display: flex;
  height: 100vh;
  font-family: Arial;
}

.sidebar {
  width: 280px;
  border-right: 1px solid #ddd;
  padding: 15px;
}

.item {
  padding: 10px;
  border: 1px solid #eee;
  margin-bottom: 10px;
  border-radius: 6px;
  cursor: pointer;
}

.item:hover {
  background: #f5f5f5;
}

.title {
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 20px;
}

.preview {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  min-height: 200px;
}
</style>