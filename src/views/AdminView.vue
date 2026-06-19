<script setup>
import { ref, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'

import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

import * as TextStyle from '@tiptap/extension-text-style'
import * as Color from '@tiptap/extension-color'
import * as TextAlign from '@tiptap/extension-text-align'
import * as Placeholder from '@tiptap/extension-placeholder'


import { supabase } from '../supabase'

const announcements = ref([])
const selectedId = ref(null)
const mode = ref('view')

/* ---------------- LOAD (ORDERED) ---------------- */
async function load() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Load error:', error)
    return
  }

  announcements.value = data || []

  if (announcements.value.length > 0) {
    selectAnnouncement(announcements.value[0].id)
  }
}

onMounted(load)

/* ---------------- EDITOR ---------------- */
const editor = useEditor({
    extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false }),
    Image,

    TextStyle.default,
    Color.default,
    TextAlign.default.configure({
        types: ['heading', 'paragraph']
    }),

    Placeholder.default.configure({
        placeholder: 'Write your announcement here...'
    })
    ],
  content: ''
})

/* ---------------- SELECT ---------------- */
function selectAnnouncement(id) {
  const item = announcements.value.find(a => a.id === id)
  if (!item) return

  selectedId.value = id
  mode.value = 'view'
}

/* ---------------- NEW ---------------- */
function newAnnouncement() {
  mode.value = 'create'
  selectedId.value = null
  editor.value?.commands.setContent('')
}

/* ---------------- EDIT ---------------- */
function editAnnouncement(id) {
  const item = announcements.value.find(a => a.id === id)
  if (!item) return

  selectedId.value = id
  mode.value = 'edit'
  editor.value?.commands.setContent(item.content || '')
}

/* ---------------- SAVE ---------------- */
async function save() {
  const html = editor.value.getHTML()

  const data = {
    title: (() => {
      const text = html
        .replace(/<\/p>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      return text.slice(0, 40) || 'Untitled'
    })(),
    content: html,
    ...(mode.value === 'create' && {
      date: new Date().toISOString()
    })
  }

  if (mode.value === 'create') {
    const { data: inserted, error } = await supabase
      .from('announcements')
      .insert([data])
      .select()

    if (error) return console.error(error)

    announcements.value.unshift(inserted[0])
    selectedId.value = inserted[0].id
  }

  if (mode.value === 'edit') {
    const { error } = await supabase
      .from('announcements')
      .update(data)
      .eq('id', selectedId.value)

    if (error) return console.error(error)

    const i = announcements.value.findIndex(a => a.id === selectedId.value)
    if (i !== -1) announcements.value[i] = { ...announcements.value[i], ...data }
  }

  mode.value = 'view'
}

/* ---------------- DELETE ---------------- */
async function remove(id) {
  await supabase.from('announcements').delete().eq('id', id)
  announcements.value = announcements.value.filter(a => a.id !== id)
}

/* ---------------- MOVE UP ---------------- */
async function moveUp(id) {
  const list = [...announcements.value]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const index = list.findIndex(a => a.id === id)
  if (index <= 0) return

  // move item up in array
  const item = list.splice(index, 1)[0]
  list.splice(index - 1, 0, item)

  await saveOrder(list)
}

/* ---------------- MOVE DOWN ---------------- */
async function moveDown(id) {
  const list = [...announcements.value]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const index = list.findIndex(a => a.id === id)
  if (index === -1 || index === list.length - 1) return

  const item = list.splice(index, 1)[0]
  list.splice(index + 1, 0, item)

  await saveOrder(list)
}

async function saveOrder(list) {
  const updates = list.map((item, i) =>
    supabase
      .from('announcements')
      .update({ order_index: i })
      .eq('id', item.id)
  )

  await Promise.all(updates)

  await load()
}

/* ---------------- COMMANDS ---------------- */
function cmd(action, options) {
  const chain = editor.value?.chain().focus()
  if (!chain) return

  options !== undefined
    ? chain[action](options).run()
    : chain[action]().run()
}

function setLink() {
  const url = prompt('URL')
  if (!url) return
  editor.value.chain().focus().setLink({ href: url }).run()
}

function addImage() {
  const url = prompt('Image URL')
  if (!url) return
  editor.value.chain().focus().setImage({ src: url }).run()
}
</script>

<template>
<div class="cms">

  <!-- LEFT -->
  <div class="sidebar">
    <button @click="newAnnouncement" class="btn-new">+ New</button>

    <div v-for="a in announcements" :key="a.id" class="item">
      <div @click="selectAnnouncement(a.id)" class="title">
        {{ a.title }}
      </div>

      <small>{{ new Date(a.date).toLocaleString() }}</small>

      <div class="actions">
        <button @click="moveUp(a.id)">⬆</button>
        <button @click="moveDown(a.id)">⬇</button>

        <button @click="editAnnouncement(a.id)">Edit</button>
        <button @click="remove(a.id)">Delete</button>
      </div>
    </div>
  </div>

  <!-- RIGHT -->
  <div class="content">

    <!-- VIEW -->
    <div v-if="mode === 'view'">
      <h2>Announcement</h2>
      <div v-html="announcements.find(a => a.id === selectedId)?.content"
           class="preview"></div>
    </div>

    <!-- EDITOR -->
    <div v-else>

      <div class="toolbar">
        <button @click="cmd('toggleBold')"><b>B</b></button>
        <button @click="cmd('toggleItalic')"><i>I</i></button>
        <button @click="cmd('toggleUnderline')">U</button>

        <button @click="cmd('toggleHeading', { level: 1 })">H1</button>
        <button @click="cmd('toggleHeading', { level: 2 })">H2</button>

        <button @click="cmd('toggleBulletList')">• List</button>
        <button @click="cmd('toggleOrderedList')">1. List</button>

        <button @click="cmd('setTextAlign', 'left')">⬅</button>
        <button @click="cmd('setTextAlign', 'center')">↔</button>
        <button @click="cmd('setTextAlign', 'right')">➡</button>

        <input type="color" @input="cmd('setColor', $event.target.value)" />

        <button @click="setLink">🔗</button>
        <button @click="addImage">🖼</button>

        <button @click="cmd('undo')">↩</button>
        <button @click="cmd('redo')">↪</button>
      </div>

      <div class="editor">
        <EditorContent :editor="editor" />
      </div>

      <button class="save" @click="save">💾 Save</button>

    </div>
  </div>

</div>
</template>

<style>
.cms { display:flex; height:100vh; font-family:Arial; }
.sidebar { width:280px; border-right:1px solid #ddd; padding:15px; }
.content { flex:1; padding:20px; }

.btn-new { width:100%; margin-bottom:10px; }

.item {
  padding:10px;
  border:1px solid #eee;
  margin-bottom:10px;
  border-radius:6px;
}

.title { cursor:pointer; font-weight:bold; }

.actions button { margin-right:5px; }

.toolbar {
  border:1px solid #ccc;
  padding:10px;
  margin-bottom:10px;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.editor {
  border:1px solid #ddd;
  padding:10px;
  min-height:250px;
}

.preview {
  padding:15px;
  border:1px solid #eee;
  border-radius:8px;
}

.save {
  margin-top:10px;
}
</style>