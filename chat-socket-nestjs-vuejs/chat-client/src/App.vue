<script setup>
import { onBeforeMount, ref } from 'vue';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5500');

const messages = ref([]);
const messageText = ref('');
const joined = ref(false);
const name = ref('');
const room = ref(1);
const typingDisplay = ref('');

onBeforeMount(()=>{
 socket.emit('findAllMessages', {room: room.value}, (res)=>{
   messages.value = res;
 });

 socket.on('message', (message)=>{
   messages.value.push(message);
 });

 socket.on('typing', ({room, name, isTyping})=>{
   if(isTyping){
    typingDisplay.value = name + ' is typing...';
   }
   else{
    typingDisplay.value = '';
   }
 });
});

const join = () =>{
  socket.emit('join', {name: name.value, room: room.value}, ()=>{
    joined.value = true;
  });
}

const sendMessage = ()=>{
  socket.emit('createMessage', {room: room.value, text: messageText.value}, () => {
    messageText.value = '';
  });
}

let timeout;
const emitTyping = ()=>{
  socket.emit('typing', {room:room.value, isTyping: true});
  timeout = setTimeout(()=>{
    socket.emit('typing', {room: room.value, isTyping: false});
  }, 2000);
}

const updateMessage = (e)=>{
  messageText.value = e.target.value;
  socket.emit('typing', {room: room.value, name: name.value, isTyping: true});
}

const removeMessage = (id) => {
  console.log(id);
  socket.emit('removeMessage', {room: room.value, messageId: id}, (res) => {
    messages.value = res;
  });
}

</script> 

<template>
  <div class="chat">
    <div v-if="!joined">
      <form @submit.prevent="join">
        <div>
          <label>What your room?</label>
          <input v-model="room" type="text" placeholder="Enter your room id">
        </div>
        <div>
          <label>What's your name?</label>
          <input v-model="name" type="text" placeholder="Enter your name">
        </div>
        <button type="submit">Join</button>
      </form>
    </div>

    <div class="chat-container" v-else>
      <h1>Room: {{ room }}</h1>
      <div class="messages-container">
        <div v-for="(message, i) in messages" :key="i" class="msg">
          <p>[{{message.name}}]: {{message.text}}</p>
          <button @click="updateMessage">Edit</button>
          <button @click="removeMessage(message.id)">Remove</button>
        </div>
      </div>

      <div v-if="typingDisplay">{{ typingDisplay }}</div><hr />

      <div class="message-input">
        <form @submit.prevent="sendMessage">
          <label>Message: </label>
          <input v-model="messageText" type="text" @input="emitTyping">
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
.chat{
  padding: 20px;
  height: 80vh;
}
.chat-container{
  display: flex;
  flex-direction: column;
  height: 100%;
}
.messages-container{
  flex: 1;
}
.msg{
  display: flex;
  align-items: center;
  gap: 2rem;
}
button{
  height: min-content;
}
</style>