let ws; //web socket
let chatUserCntr = document.querySelector("#chatUsers");
let chatUserCount = document.querySelector("#chatUsersCount");
let sendMessageForm = document.querySelector("#messageSendForm");
let messageInput = document.querySelector("#messageInput");
let chatMessagesCtr = document.querySelector("#chatMessages");
let leaveGroupBtn = document.querySelector("#leaveGroupBtn");
let groupName = document.querySelector("#groupName");

window.addEventListener("DOMContentLoaded", () => {
  ws = new WebSocket(`ws://localhost:3000/`);
  ws.addEventListener("open", onConnectionOpen);
  ws.addEventListener("message", onmessageReceived);
});

sendMessageForm.onsubmit = (ev) => {
  ev.preventDefault();
  const event = {
    event: "message",
    data: messageInput.value,
  };
  ws.send(JSON.stringify(event));
  messageInput.value = ""; //empty the value after sending the message
};

leaveGroupBtn.onclick = () => {
  window.location.href = "chat.html";
};

function onConnectionOpen() {
  console.log(`Connection Opened`);
  const queryParams = getQueryParams();
  console.log(queryParams);
  if (!queryParams.name || !queryParams.group) {
    window.location.href = "chat.html";
    return;
  }
  groupName.innerHTML = queryParams.group;
  const event = {
    event: "join",
    groupName: queryParams.group,
    name: queryParams.name,
  };
  ws.send(JSON.stringify(event));
}

function onmessageReceived(event) {
  console.log(`Message Received`);
  event = JSON.parse(event.data);
  console.log(event);
  switch (event.event) {
    case "users":
      chatUserCount.innerHTML = event.data.length;
      chatUserCntr.innerHTML = "";
      event.data.forEach((u) => {
        const userEle = document.createElement("div");
        userEle.className = "chat-user";
        userEle.innerHTML = u.name;
        chatUserCntr.appendChild(userEle);
      });
      break;
    case "message":
      const el = chatMessagesCtr;
      const scrollToBottom =
        Math.floor(el.offsetHieght + el.scrollTop) === el.scrollHeight;
      appendMessage(event.data);
      if (scrollToBottom) {
        el.scrollTop = 10000000;
      } //to position scroll bar
      break;
    case "previousMessages":
      event.data.forEach(appendMessage);
  }
}

function appendMessage(message) {
  const messageEle = document.createElement("div");
  messageEle.className = `message message-${
    message.sender === "me" ? "to" : "from"
  }`;
  messageEle.innerHTML = `
      ${event.data.sender === "me" ? "" : `<h4>${message.name}</h4>`}
      <p class="message-text">${message.message} </p>`;
  chatMessagesCtr.appendChild(messageEle);
}

function getQueryParams() {
  const search = window.location.search.substring(1);
  const pairs = search.split("&");
  const params = {};
  for (const pair of pairs) {
    const parts = pair.split("=");
    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return params;
}
