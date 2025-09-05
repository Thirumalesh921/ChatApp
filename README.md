# 💬 Real-Time Chat Application

A real-time chat app built using the MERN stack and Socket.IO.
Supports instant messaging, replies, deletes, typing indicators, and online users with a responsive UI.

Try it out live: [Visit the Deployed App](https://chatroom-48ji.onrender.com/)

# 🚀 Features

Real-time messaging with Socket.IO

Reply & delete options for messages

Online users list & typing indicators

MongoDB persistence for chat history

Responsive design (desktop & mobile)

# 🛠 Tech Stack

Frontend: React.js, CSS

Backend: Node.js, Express.js

Database: MongoDB

Realtime: Socket.IO

Deployment: Render

# ⚡ Getting Started

## Clone repository
git clone https://github.com/Thirumalesh921/ChatApp.git

cd ChatRoom

## Install backend dependencies
cd server 

npm install

## Install frontend dependencies
cd client 

npm install


Set up .env in server/:

MONGO_URL=your-mongodb-url

PORT=5000


Run backend:

cd server
npm run dev


Run frontend:

cd client
npm run dev


App runs at: http://localhost:5173

# 🔮 Future Enhancements

JWT authentication

File & image sharing

Private messaging

Dark mode

# ⚠️ Known Limitations    
- No authentication (anyone with room ID and Password can join)  
- Rooms auto-expire after 72 hours – chat rooms and their messages are automatically deleted 3 days after creation to keep the database clean.
