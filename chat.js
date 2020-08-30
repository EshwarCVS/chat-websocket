import { v4 } from "https://deno.land/std@0.65.0/uuid/mod.ts";
import { isWebSocketCloseEvent } from "https://deno.land/std@0.65.0/ws/mod.ts";

const usersMap = new Map();

/** 
 * usersId:{
 *     usersId:String,
 *     name: String,
 *     groupName: String,
 *     ws: WebSocket,
 * }
 */

const groupsMap = new Map();

/** 
 * groupName:[user1, user2, user3]{
 *      userID: String,
 *      name: String,
 *      ws: WebSocket
 * }
*/

const messagesMap = new Map();

/** 
 * groupName: [message1,message2] {
 *      userID:string, 
 *      name: string, 
 *      message: string
 * }
 */

export default async function chat(ws) {
  console.log(`Connected`);
  const userID = v4.generate();
  //Unique id to identify user
  for await (let data of ws) {
    const event = typeof data === "string" ? JSON.parse(data) : data;
    if (isWebSocketCloseEvent(data)) {
      leaveGroupBtn(userID);
      break;
    }
    let userObj;
    switch (event.event) {
      case "join":
        userObj = {
          userID,
          name: event.name,
          groupName: event.groupName,
          ws,
        };
        usersMap.set(userID, userObj);
        const users = groupsMap.get(event.groupName) || [];
        users.push(userObj);
        groupsMap.set(event.groupName, users);

        emitUserList(event.groupName);
        emitPreviousMessages(event.groupName, ws);
        break;
      case "message":
        userObj = usersMap.get(userID);
        const message = {
          userID,
          name: userObj.name,
          message: event.data,
        };
        const messages = messagesMap.get(userObj.groupName) || [];
        messages.push(messages);
        messagesMap.set(userObj.groupName, messages);
        emitMessage(userObj.groupName, message, userID);
        break;
    }
  }
}

function emitUserList(groupName) {
  const users = groupsMap.get(groupName) || [];
  for (const user of users) {
    const event = {
      event: "users",
      data: getDisplayUsers(groupName),
    };
    user.ws.send(JSON.stringify(event));
  }
}

function getDisplayUsers(groupName) {
  const users = groupsMap.get(groupName) || [];
  return users.map((u) => {
    return {
      userID: u.userID,
      name: u.name,
    };
  });
}

function emitMessage(groupName, message, senderID) {
  const users = groupsMap.get(groupName) || [];
  for (const user of users) {
    const tmpMessage = {
      ...message,
      sender: user.userID === senderID ? "me" : senderID,
    };
    const event = {
      event: "message",
      data: tmpMessage,
    };
    user.ws.send(JSON.stringify(event));
  }
}

function emitPreviousMessages(groupName, ws) {
  const messages = messagesMap.get(groupName) || [];

  const event = {
    event: "previousMessages",
    data: messages,
  };
  ws.send(JSON.stringify(event));
}

function leaveGroup(userID) {
  const userObj = usersMap.get(userID);
  let users = groupsMap.get(userObj.groupName) || [];
  users = users.filter((u) => u.userID !== userID);
  groupsMap.set(userObj.groupName, users);
  usersMap.delete(userID);
  emitUserList(userObj.groupName);
}
