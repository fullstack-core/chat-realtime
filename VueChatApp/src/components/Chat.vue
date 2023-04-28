<template>
    <div class="chat container">
        <h2>Welcome <span class="indigo-text">{{this.name }}</span> to our chat</h2>
        <div class="card">
            <div class="card-content">
                    <ul class="messages" v-chat-scroll>
                        <li v-for="message in messages" :key="message.id" >
                            <span class="pink-text">{{message.name}}</span>
                            <span class="grey-text text-darken-3">{{message.content}}</span>
                            <span class="grey-text time">{{message.timeStamp}}</span>
                        </li>
                    </ul>
            </div>
            <div class="card-action">
                <NewMessage :name="name" />
            </div>
        </div>
    </div>
</template>


<script>
import NewMessage from '@/components/NewMessage'
import db from '@/firebase/init'

export default {
    name: 'Chat',
    props: ['name'],
    components: {
        NewMessage
    },
    data(){
        return{
            messages: []
        }
    },
    created(){
        let ref = db.collection('messages').orderBy('timeStamp')

        ref.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change =>{
                if(change.type == 'added'){
                    let doc = change.doc
                    this.messages.push({
                        id: doc.id,
                        content: doc.data().content,
                        name: doc.data().name,
                        timeStamp: moment(doc.data().timeStamp).format('llll')
                    })
                }
            })
        })
    }
}
</script>

<style>
.chat h2{
  font-size: 2.6em;
  margin-bottom: 40px;
}
.chat li{
  text-align: left;
}
.chat span{
  font-size: 1.4em;
}
.chat .time{
  display: block;
  font-size: .8em;
}
.messages{
  max-height: 300px;
  overflow: auto;
}
.messages::-webkit-scrollbar{
  width: 3px;
}
.messages::-webkit-scrollbar-track{
  background: #ddd;
}
.messages::-webkit-scrollbar-thumb{
  background: #aaa;
}
</style>