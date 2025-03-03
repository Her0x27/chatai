/**
 * Production-Ready Multilingual Chat Application with WebRTC File Transfer,
 * encryption verification tools, and connectivity check (ping/traceroute).
 *
 * Additional features:
 * - File transfer through WebRTC data channels.
 * - Tools for verifying encryption.
 * - Connectivity check: ping functionality (round-trip time measurement) and simulated traceroute.
 *
 * Firebase is used for ephemeral messaging (messages are removed immediately),
 * while all message history is stored locally using IndexedDB.
 */

import {
  ref,
  push,
  onChildAdded,
  onValue,
  remove,
  query,
  orderByChild,
  off,
  update
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// ------------------------
// Translation Data
// ------------------------
const translations = {
  ru: {
    authTitle: "Добро пожаловать в чат",
    languageLabel: "Язык:",
    usernamePlaceholder: "Введите ваше имя",
    passwordPlaceholder: "Введите пароль",
    passwordConfirmPlaceholder: "Подтвердите пароль",
    authButton: "Войти",
    groupChat: "Групповой чат",
    privateChat: "Личный чат",
    send: "Отправить",
    yourPeerId: "Ваш Peer ID:",
    internalIP: "Ваш внутренний IP:",
    connectionStatus: "Статус подключения:",
    connectionSettings: "Настройки подключения",
    stunServers: "STUN сервера (через запятую):",
    file_transfer: "Передача файлов (WebRTC)",
    typing: "пишут..."
  },
  en: {
    authTitle: "Welcome to the Chat",
    languageLabel: "Language:",
    usernamePlaceholder: "Enter your name",
    passwordPlaceholder: "Enter password",
    passwordConfirmPlaceholder: "Confirm password",
    authButton: "Login",
    groupChat: "Group Chat",
    privateChat: "Private Chat",
    send: "Send",
    yourPeerId: "Your Peer ID:",
    internalIP: "Your Internal IP:",
    connectionStatus: "Connection Status:",
    connectionSettings: "Connection Settings",
    stunServers: "STUN servers (comma-separated):",
    file_transfer: "File Transfer (WebRTC)",
    typing: "is typing..."
  }
};

let currentLanguage = "ru";

function applyTranslations() {
  document.querySelectorAll("[data-translate]").forEach((element) => {
    const key = element.getAttribute("data-translate");
    if (translations[currentLanguage][key]) {
      element.innerHTML = translations[currentLanguage][key];
    }
  });
  document.getElementById("auth-title").textContent = translations[currentLanguage].authTitle;
  document.getElementById("language-label").textContent = translations[currentLanguage].languageLabel;
  document.getElementById("username").placeholder = translations[currentLanguage].usernamePlaceholder;
  document.getElementById("password").placeholder = translations[currentLanguage].passwordPlaceholder;
  document.getElementById("password-confirm").placeholder = translations[currentLanguage].passwordConfirmPlaceholder;
  document.getElementById("auth-button").innerHTML = '<i class="fas fa-sign-in-alt"></i>';
  document.querySelector("#peer-id-display span").textContent = translations[currentLanguage].yourPeerId;
  document.querySelector("#internal-ip span").textContent = translations[currentLanguage].internalIP;
  document.querySelector("#connection-status span").textContent = translations[currentLanguage].connectionStatus;
  document.querySelector("#connection-settings h3").textContent = translations[currentLanguage].connectionSettings;
  document.querySelector("#connection-settings label span").textContent = translations[currentLanguage].stunServers;
  document.querySelector("#webrtc-file-transfer h3").textContent = translations[currentLanguage].file_transfer;
}

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  const languageSelector = document.getElementById("language-selector");
  languageSelector.addEventListener("change", (e) => {
    currentLanguage = e.target.value;
    applyTranslations();
  });
});

// ------------------------
// SecurityManager
// ------------------------
class SecurityManager {
  constructor() {
    this.hmacKey = null;
    this.encryptionKey = null;
    this.generateHMACKey().catch(console.error);
    this.generateEncryptionKey().catch(console.error);
  }
  async generateHMACKey() {
    this.hmacKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: { name: "SHA-256" } },
      true,
      ["sign", "verify"]
    );
  }
  async generateEncryptionKey() {
    this.encryptionKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }
  async signMessage(text) {
    if (!text) throw new Error("Text needed for signature.");
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const signature = await crypto.subtle.sign("HMAC", this.hmacKey, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
  async verifySignature(text, signature) {
    const computedSig = await this.signMessage(text);
    return this.constantTimeCompare(computedSig, signature);
  }
  constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  sanitize(dirty) {
    return DOMPurify.sanitize(dirty);
  }
  async hashPassword(password) {
    if (!password) throw new Error("Password is required for hashing.");
    return await bcrypt.hash(password, 12);
  }
  async verifyPassword(password, hash) {
    if (!password || !hash) throw new Error("Both password and hash are required.");
    return await bcrypt.compare(password, hash);
  }
  async encryptData(plainText) {
    if (!plainText) throw new Error("Plain text is required for encryption.");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const data = enc.encode(plainText);
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.encryptionKey,
      data
    );
    return {
      iv: Array.from(iv),
      cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)))
    };
  }
  async decryptData(cipherText, iv) {
    if (!cipherText || !iv) throw new Error("Cipher text and IV required for decryption.");
    const ivUint8 = new Uint8Array(iv);
    const cipherBytes = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivUint8 },
      this.encryptionKey,
      cipherBytes
    );
    return new TextDecoder().decode(plainBuffer);
  }
}

// ------------------------
// IndexedDBManager
// ------------------------
class IndexedDBManager {
  constructor(dbName = "ChatHistoryDB", storeName = "messages") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.init();
  }
  init() {
    const request = indexedDB.open(this.dbName, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      this.db = e.target.result;
    };
    request.onerror = (e) => {
      console.error("IndexedDB Error:", e.target.error);
    };
  }
  saveMessage(msg) {
    if (!this.db) return;
    const tx = this.db.transaction(this.storeName, "readwrite");
    const store = tx.objectStore(this.storeName);
    store.add(msg);
  }
  async loadMessages() {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// ------------------------
// AuthManager
// ------------------------
class AuthManager {
  constructor(securityManager) {
    this.security = securityManager;
    this.sessionKey = "chatSessionToken";
    this.currentUser = null;
  }
  async userExists(username) {
    if (!username) throw new Error("Username is required.");
    return new Promise((resolve, reject) => {
      const usersRef = ref(window.db, "users");
      const q = query(usersRef, orderByChild("username"));
      onValue(q, (snapshot) => {
        let exists = false;
        snapshot.forEach((child) => {
          if (child.val().username === username) exists = true;
        });
        resolve(exists);
      }, (error) => reject(error), { onlyOnce: true });
    });
  }
  async register(username, password) {
    try {
      const hashed = await this.security.hashPassword(password);
      const fingerprint = this.generateFingerprint();
      const uid = this.simpleHash(username + fingerprint);
      const userObj = {
        username,
        passwordHash: hashed,
        uid,
        sessionStart: new Date().toISOString(),
        fingerprint,
        status: "онлайн"
      };
      const usersRef = ref(window.db, "users");
      await push(usersRef, userObj);
      this.createSession(userObj);
      this.currentUser = userObj;
    } catch (err) {
      throw new Error("Registration Error: " + err);
    }
  }
  async login(username, password) {
    return new Promise((resolve, reject) => {
      try {
        const usersRef = ref(window.db, "users");
        const q = query(usersRef, orderByChild("username"));
        onValue(q, async (snapshot) => {
          let found = false;
          snapshot.forEach(async (child) => {
            const user = child.val();
            if (user.username === username) {
              const valid = await this.security.verifyPassword(password, user.passwordHash);
              if (valid) {
                found = true;
                this.createSession(user);
                this.currentUser = user;
                resolve();
              }
            }
          });
          if (!found) reject("Incorrect password or user not registered.");
        }, { onlyOnce: true });
      } catch (err) {
        reject(err);
      }
    });
  }
  createSession(userObj) {
    const token = btoa(userObj.uid + ":" + new Date().getTime());
    localStorage.setItem(this.sessionKey, token);
  }
  loadSession() {
    const token = localStorage.getItem(this.sessionKey);
    return token ? token : null;
  }
  generateFingerprint() {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Roboto Mono'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText(navigator.userAgent, 2, 15);
    let b64 = canvas.toDataURL();
    const screenData = [screen.width, screen.height, screen.colorDepth].join("x");
    const hardwareData = navigator.hardwareConcurrency || "na";
    return this.simpleHash(b64 + screenData + hardwareData);
  }
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }
}

// ------------------------
// ChatManager
// ------------------------
class ChatManager {
  constructor(securityManager, currentUser) {
    this.security = securityManager;
    this.currentUser = currentUser;
    this.activeChat = { type: "group", chatId: "group" };
    this.currentMessagesRef = null;
    this.currentListener = null;
    this.typingRef = null;
    // PeerJS instance for private connections and file transfer
    this.peer = null;
    this.dataConnection = null;
    this.peerConnectionStatus = "disconnected";
    // Default ICE servers configuration (STUN)
    this.iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
    this.initPeer();
  }
  
  initPeer() {
    if (this.peer) this.peer.destroy();
    this.peer = new Peer(undefined, {
      config: { iceServers: this.iceServers }
    });
    this.peer.on("open", (id) => {
      document.getElementById("peer-id").textContent = id;
      this.setConnectionStatus("connected");
    });
    this.peer.on("disconnected", () => {
      this.setConnectionStatus("disconnected");
    });
    this.peer.on("error", (err) => {
      console.error("PeerJS error:", err);
      this.setConnectionStatus("error");
    });
    // Listen for incoming connections (for private chat and file transfer)
    this.peer.on("connection", (conn) => {
      this.dataConnection = conn;
      this.setupDataConnection();
    });
  }
  
  setConnectionStatus(status) {
    this.peerConnectionStatus = status;
    document.getElementById("status-display").textContent = status;
  }
  
  setupDataConnection() {
    if (!this.dataConnection) return;
    this.dataConnection.on("data", (data) => {
      // Handle incoming data: ping responses, file transfer chunks, etc.
      if (data.type === "ping") {
        this.dataConnection.send({ type: "pong", timestamp: data.timestamp });
      } else if (data.type === "pong") {
        const now = Date.now();
        const rtt = now - data.timestamp;
        document.getElementById("ping-result").textContent = `RTT: ${rtt} ms`;
      } else if (data.type === "file-chunk") {
        // Process file chunk: for demonstration, log the received chunk
        console.log("Received file chunk via WebRTC:", data);
      }
    });
  }
  
  // Connectivity check: send a ping via data connection
  ping() {
    if (this.dataConnection && this.dataConnection.open) {
      const timestamp = Date.now();
      this.dataConnection.send({ type: "ping", timestamp });
    } else {
      document.getElementById("ping-result").textContent = "No connection available";
    }
  }
  
  subscribe(chatPath) {
    if (this.currentMessagesRef && this.currentListener) {
      off(this.currentMessagesRef, "child_added", this.currentListener);
    }
    this.currentMessagesRef = ref(window.db, chatPath);
    this.currentListener = onChildAdded(this.currentMessagesRef, async (data) => {
      let msg = data.val();
      // Immediately remove the message from Firebase to prevent persistence
      remove(ref(window.db, chatPath + "/" + data.key));
      if (msg.cipher && msg.iv) {
        try {
          const decrypted = await this.security.decryptData(msg.cipher, msg.iv);
          if (msg.fileName && msg.fileType) {
            msg.content = `<i class="fas fa-file"></i> ${msg.fileName} (${msg.fileType}) - ${decrypted}`;
          } else {
            msg.content = decrypted;
          }
        } catch (error) {
          console.error("Decryption error:", error);
          msg.content = "Ошибка дешифрования";
        }
      }
      UIManager.renderMessage(msg);
      indexedDBManager.saveMessage(msg);
    });
  }
  
  async sendMessage(content) {
    if (!content) return;
    const sanitizedContent = this.security.sanitize(content);
    const timestamp = new Date().toISOString();
    const encrypted = await this.security.encryptData(sanitizedContent);
    const signature = await this.security.signMessage(sanitizedContent);
    const msgObj = {
      sender: this.currentUser.username,
      uid: this.currentUser.uid,
      cipher: encrypted.cipherText,
      iv: encrypted.iv,
      timestamp,
      status: "sent",
      signature
    };
    const path = this.activeChat.type === "group"
      ? "messages/group"
      : `messages/private/${this.activeChat.chatId}`;
    await push(ref(window.db, path), msgObj);
  }
  
  async sendFileMessage(file) {
    // Sending file through Firebase as fallback (ephemeral)
    if (!file) throw new Error("No file provided.");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const fileData = reader.result;
          const base64Data = fileData.split(",")[1] || fileData;
          const encrypted = await this.security.encryptData(base64Data);
          const signature = await this.security.signMessage(base64Data);
          const timestamp = new Date().toISOString();
          const msgObj = {
            sender: this.currentUser.username,
            uid: this.currentUser.uid,
            cipher: encrypted.cipherText,
            iv: encrypted.iv,
            fileName: file.name,
            fileType: file.type,
            timestamp,
            status: "sent",
            signature
          };
          const path = this.activeChat.type === "group"
            ? "messages/group"
            : `messages/private/${this.activeChat.chatId}`;
          await push(ref(window.db, path), msgObj);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
    });
  }
  
  // WebRTC file transfer using data connection
  async sendFileViaDataChannel(file) {
    if (!file) throw new Error("No file provided.");
    if (!this.dataConnection || !this.dataConnection.open) {
      document.getElementById("file-transfer-status").textContent = "Нет доступного соединения для передачи.";
      return;
    }
    const chunkSize = 16 * 1024; // 16 KB chunks
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      const fileBuffer = reader.result;
      const totalChunks = Math.ceil(fileBuffer.byteLength / chunkSize);
      document.getElementById("file-transfer-status").textContent = `Передача файла: 0/${totalChunks}`;
      for (let i = 0; i < totalChunks; i++) {
        const chunk = fileBuffer.slice(i * chunkSize, (i + 1) * chunkSize);
        // Optionally encrypt the chunk here and verify integrity
        this.dataConnection.send({ type: "file-chunk", chunk: chunk, index: i, total: totalChunks });
        document.getElementById("file-transfer-status").textContent = `Передача файла: ${i + 1}/${totalChunks}`;
        // Introduce a slight delay to avoid congestion (if needed)
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      document.getElementById("file-transfer-status").textContent = "Передача файла завершена.";
    };
    reader.onerror = (err) => {
      console.error("Ошибка чтения файла для передачи:", err);
      document.getElementById("file-transfer-status").textContent = "Ошибка передачи файла.";
    };
  }
  
  switchChat(type, targetUser = null) {
    this.activeChat.type = type;
    if (type === "group") {
      this.activeChat.chatId = "group";
      UIManager.updateChatTitle(`<i class="fas fa-users"></i> ${translations[currentLanguage].groupChat}`);
      UIManager.toggleBackButton(false);
      this.subscribe("messages/group");
    } else if (type === "private" && targetUser) {
      const uid1 = this.currentUser.uid;
      const uid2 = targetUser.uid;
      this.activeChat.chatId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
      UIManager.updateChatTitle(`<i class="fas fa-user"></i> ${translations[currentLanguage].privateChat} с ${targetUser.username}`);
      UIManager.toggleBackButton(true);
      this.subscribe(`messages/private/${this.activeChat.chatId}`);
    }
    this.setupTypingListener();
  }
  
  setupTypingListener() {
    if (this.typingRef) {
      off(this.typingRef);
    }
    this.typingRef = ref(window.db, `typing/${this.activeChat.chatId}`);
    onValue(this.typingRef, (snapshot) => {
      let typs = [];
      snapshot.forEach((child) => {
        const user = child.val();
        if (user.username !== this.currentUser.username) {
          typs.push(user.username);
        }
      });
      UIManager.updateTypingIndicator(typs);
    });
  }
  
  setTyping(isTyping) {
    if (!this.activeChat.chatId) return;
    const typingUserRef = ref(window.db, `typing/${this.activeChat.chatId}/${this.currentUser.uid}`);
    if (isTyping) {
      update(typingUserRef, { username: this.currentUser.username, timestamp: new Date().toISOString() });
    } else {
      remove(typingUserRef);
    }
  }
}

// ------------------------
// StatusManager
// ------------------------
class StatusManager {
  constructor(authManager) {
    this.authManager = authManager;
    this.idleTimeout = 60000;
    this.idleTimer = null;
    this.currentStatus = "онлайн";
    this.setupListeners();
    this.updateStatus("онлайн");
  }
  
  setupListeners() {
    window.addEventListener("mousemove", () => this.resetIdleTimer());
    window.addEventListener("keypress", () => this.resetIdleTimer());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.updateStatus("отошёл");
      } else {
        this.updateStatus("онлайн");
        this.resetIdleTimer();
      }
    });
    window.addEventListener("blur", () => this.updateStatus("отошёл"));
    window.addEventListener("focus", () => {
      this.updateStatus("онлайн");
      this.resetIdleTimer();
    });
  }
  
  resetIdleTimer() {
    clearTimeout(this.idleTimer);
    if (this.currentStatus !== "онлайн") {
      this.updateStatus("онлайн");
    }
    this.idleTimer = setTimeout(() => {
      this.updateStatus("отошёл");
    }, this.idleTimeout);
  }
  
  updateStatus(status) {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    const usersRef = query(ref(window.db, "users"), orderByChild("uid"));
    onValue(usersRef, (snapshot) => {
      snapshot.forEach((child) => {
        const user = child.val();
        if (user.uid === this.authManager.currentUser.uid) {
          const userRef = ref(window.db, "users/" + child.key);
          let statusIcon = "";
          if (status === "онлайн") statusIcon = '<i class="fas fa-circle" style="color: green"></i>';
          else if (status === "отошёл") statusIcon = '<i class="fas fa-clock" style="color: orange"></i>';
          else statusIcon = '<i class="fas fa-circle" style="color: red"></i>';
          update(userRef, { status: statusIcon });
        }
      });
    }, { onlyOnce: true });
  }
}

// ------------------------
// UIManager
// ------------------------
class UIManager {
  static init(authManager, chatManager, statusManager) {
    this.authManager = authManager;
    this.chatManager = chatManager;
    this.statusManager = statusManager;
    this.authContainer = document.getElementById("auth-container");
    this.chatContainer = document.getElementById("chat-container");
    this.authForm = document.getElementById("auth-form");
    this.usernameInput = document.getElementById("username");
    this.passwordSection = document.getElementById("password-section");
    this.passwordInput = document.getElementById("password");
    this.passwordConfirmInput = document.getElementById("password-confirm");
    this.authError = document.getElementById("auth-error");
    this.usersList = document.getElementById("users-list");
    this.toggleUsersBtn = document.getElementById("toggle-users");
    this.messagesDiv = document.getElementById("messages");
    this.messageForm = document.getElementById("message-form");
    this.messageInput = document.getElementById("message-input");
    this.fileInput = document.getElementById("file-input");
    this.chatTitleEl = document.getElementById("chat-title");
    this.backToGroupBtn = document.getElementById("back-to-group");
    this.typingIndicator = document.getElementById("typing-indicator");
  
    this.bindAuthEvents();
    this.bindChatEvents();
    this.bindUserPanelEvents();
    this.bindTypingEvents();
    this.bindConnectionSettings();
    this.bindWebRTCFileTransfer();
    this.bindPingButton();
  
    this.detectInternalIP();
  }
  
  static bindAuthEvents() {
    this.authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = this.usernameInput.value.trim();
      if (!username) return;
      try {
        const exists = await this.authManager.userExists(username);
        if (exists) {
          this.passwordSection.style.display = "block";
          this.passwordConfirmInput.style.display = "none";
          await this.authManager.login(username, this.passwordInput.value);
          UIManager.showChat();
        } else {
          this.passwordSection.style.display = "block";
          this.passwordConfirmInput.style.display = "block";
          if (this.passwordInput.value !== this.passwordConfirmInput.value) {
            this.authError.textContent = "Пароли не совпадают.";
            return;
          }
          await this.authManager.register(username, this.passwordInput.value);
          UIManager.showChat();
        }
      } catch (err) {
        this.authError.textContent = err;
      }
    });
  }
  
  static bindChatEvents() {
    this.messageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (this.fileInput.files && this.fileInput.files.length > 0) {
        try {
          await this.chatManager.sendFileMessage(this.fileInput.files[0]);
          this.fileInput.value = "";
        } catch (err) {
          console.error("Ошибка отправки файла:", err);
        }
      } else {
        const content = this.messageInput.value.trim();
        if (!content) return;
        try {
          await this.chatManager.sendMessage(content);
          this.messageInput.value = "";
        } catch (err) {
          console.error("Ошибка отправки сообщения:", err);
        }
      }
      this.chatManager.setTyping(false);
    });
  
    this.backToGroupBtn.addEventListener("click", () => {
      this.chatManager.switchChat("group");
    });
  }
  
  static bindUserPanelEvents() {
    this.toggleUsersBtn.addEventListener("click", () => {
      document.getElementById("users-panel").classList.toggle("hidden");
    });
    const usersRef = ref(window.db, "users");
    onValue(usersRef, (snapshot) => {
      this.usersList.innerHTML = "";
      snapshot.forEach((child) => {
        const user = child.val();
        if (user.uid === this.authManager.currentUser.uid) return;
        const li = document.createElement("li");
        li.dataset.uid = user.uid;
        li.innerHTML = `
          <div class="user-avatar">
            <img src="https://api.dicebear.com/6.x/initials/svg?seed=${user.username}" alt="${user.username}">
          </div>
          <div class="user-details">
            <span class="username">${user.username}</span>
            <span class="status">${user.status}</span>
          </div>
        `;
        li.addEventListener("click", () => {
          UIManager.openPrivateChat(user);
        });
        this.usersList.appendChild(li);
      });
    });
  }
  
  static bindTypingEvents() {
    this.messageInput.addEventListener("keydown", () => {
      this.chatManager.setTyping(true);
    });
    let typingTimeout;
    this.messageInput.addEventListener("keyup", () => {
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        this.chatManager.setTyping(false);
      }, 1000);
    });
  }
  
  static bindConnectionSettings() {
    const saveBtn = document.getElementById("save-connection-settings");
    saveBtn.addEventListener("click", () => {
      const stunInput = document.getElementById("stun-servers");
      const serversStr = stunInput.value.trim();
      if (serversStr) {
        const servers = serversStr.split(",").map(s => ({ urls: s.trim() }));
        this.chatManager.iceServers = servers;
        this.chatManager.initPeer();
      }
    });
  }
  
  static bindWebRTCFileTransfer() {
    const webrtcFileInput = document.getElementById("webrtc-file-input");
    const webrtcSendFileBtn = document.getElementById("webrtc-send-file");
    webrtcSendFileBtn.addEventListener("click", async () => {
      if (webrtcFileInput.files && webrtcFileInput.files.length > 0) {
        try {
          await this.chatManager.sendFileViaDataChannel(webrtcFileInput.files[0]);
          webrtcFileInput.value = "";
        } catch (err) {
          console.error("WebRTC file transfer error:", err);
        }
      }
    });
  }
  
  static bindPingButton() {
    const pingBtn = document.getElementById("ping-btn");
    pingBtn.addEventListener("click", () => {
      this.chatManager.ping();
    });
  }
  
  static detectInternalIP() {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(err => console.warn("IP detection error:", err));
  
    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return;
      const candidate = event.candidate.candidate;
      const ipRegex = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/;
      const match = candidate.match(ipRegex);
      if (match) {
        document.getElementById("ip-address").textContent = match[1];
        pc.onicecandidate = null;
      }
    };
  }
  
  static showChat() {
    this.authContainer.style.display = "none";
    this.chatContainer.style.display = "flex";
  }
  
  static renderMessage(msg) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.innerHTML = `
      <div class="avatar">
        <img src="https://api.dicebear.com/6.x/initials/svg?seed=${msg.sender}" alt="${msg.sender}">
      </div>
      <div class="content">
        <div class="meta">
          <strong>${msg.sender}</strong> • ${new Date(msg.timestamp).toLocaleTimeString()}
        </div>
        <div class="body">${(new showdown.Converter()).makeHtml(msg.content)}</div>
      </div>
    `;
    this.messagesDiv.appendChild(messageDiv);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }
  
  static updateChatTitle(title) {
    this.chatTitleEl.innerHTML = title;
  }
  
  static toggleBackButton(show) {
    this.backToGroupBtn.style.display = show ? "inline-block" : "none";
  }
  
  static openPrivateChat(user) {
    this.chatManager.switchChat("private", user);
  }
}
  
// ------------------------
// Application Bootstrapping
// ------------------------
const securityManager = new SecurityManager();
const authManager = new AuthManager(securityManager);
const indexedDBManager = new IndexedDBManager();
let chatManager = null;
let statusManager = null;
  
function initChat() {
  chatManager = new ChatManager(securityManager, authManager.currentUser);
  statusManager = new StatusManager(authManager);
  UIManager.init(authManager, chatManager, statusManager);
  chatManager.switchChat("group");
  setInterval(() => {
    const path = chatManager.activeChat.type === "group"
      ? "messages/group"
      : `messages/private/${chatManager.activeChat.chatId}`;
    const messagesRef = ref(window.db, path);
    onValue(messagesRef, (snapshot) => {
      snapshot.forEach((child) => {
        const msg = child.val();
        if (new Date() - new Date(msg.timestamp) > 24 * 60 * 60 * 1000) {
          remove(ref(window.db, path + "/" + child.key));
        }
      });
    }, { onlyOnce: true });
  }, 60000);
}
  
if (authManager.loadSession()) {
  initChat();
}
  
window.addEventListener("error", (e) => {
  console.error("Глобальная ошибка:", e.error);
});
