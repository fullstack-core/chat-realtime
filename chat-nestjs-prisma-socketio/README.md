# Overview

A template supports the most basic things for user - user, and user - group communicate in **game client**. The differences of this template from a normal chat platform are that room state is lost if all the users connected to it have left and group messages are not archived anywhere. To enable these mechanisms, you can create a persistent room.

# Features

- [x] Firebase Authentication
- [ ] User
  - [x] Get friend list
  - [ ] Add friend
  - [ ] Remove friend
  - [x] Receive friend status changes
- [x] Room
  - [x] Leave room
  - [x] Notify room changes
  - [x] Temporary room (user functionality)
    - [x] Book room
    - [x] Join room
    - [x] Kick out of room
    - [x] Transfer ownership
    - [x] Invite to room
    - [x] Respond to room invitation
  - [x] Persistent room (via API)
    - [x] Create rooms
      - [x] Temporary room
      - [x] Persistent room
    - [x] Mute room
    - [x] Remove rooms
    - [x] Add members
    - [x] Remove members
    - [x] Store message
- [x] Message
  - [x] Send private message
  - [x] Send room message (only persistent room)
  - [x] Delete old messages automatically
- [ ] Others
  - [x] Logging
  - [x] Scalable
  - [ ] CORS

# Tools And Technologies

- [NestJS](https://nestjs.com/)
- [Socket.IO](https://socket.io/)
- [Prisma](https://www.prisma.io/)
- [RESTful API](https://restfulapi.net/)
- [NGINX Web Server](https://en.wikipedia.org/wiki/Nginx)
- [Redis](https://redis.io/)
- [Redis Commander](https://github.com/joeferner/redis-commander)
- [PostgreSQL](https://www.postgresql.org)
- [Adminer](https://www.adminer.org)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Docker](https://www.docker.com)
- [Docker Compose](https://docs.docker.com/compose)

# Details

## Architecture

![Communication Server Structure](https://raw.githubusercontent.com/TP-OG/communication-server/main/docs/img/architecture.jpg)

## Database Design

![Communication Server Database Design](https://raw.githubusercontent.com/TP-OG/communication-server/main/docs/img/database.jpg)

## Documentaions

RESTful API [here](https://tp-og.github.io/communication-server/api-docs).

Event-Driven API [here](https://tp-og.github.io/communication-server/event-driven-docs).

Application [here](https://tp-og.github.io/communication-server/app-docs).

# Setup

Fill in the `.env` file.

```bash
$ git clone git@github.com:TP-OG/communication-server.git

$ cd communication-server

$ cp .env.example .env
```

Export encrypted API key.

```bash
$ node encrypt-api-key.js
```

## Development

```bash
$ docker-compose up -d

$ docker-compose exec app npx prisma migrate dev
```

## Demo

```bash
$ docker-compose -f docker-compose.demo.yml up -d

$ docker-compose -f docker-compose.demo.yml exec app npx prisma migrate deploy
```

# License

- ##### This project is distributed under the [MIT License](LICENSE).
- ##### Copyright of [@TP-O](https://github.com/TP-O), 2022.
