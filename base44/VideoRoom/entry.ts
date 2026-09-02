import { Actor } from 'base44:runtime/actors';

const MAX_USERS = 2;

export default class VideoRoom extends Actor {
  users = new Map(); // conn.id -> { seat, role }
  nextSeat = 1;
  chat = []; // recent chat messages (ephemeral, not persisted)

  async handleStart() {
    // Reconcile live connections after hibernation wake
    const live = new Set(this.getConnections().map((c) => c.id));
    for (const id of this.users.keys()) if (!live.has(id)) this.users.delete(id);
    this.nextSeat = Math.max(0, ...[...this.users.values()].map((u) => u.seat)) + 1;
  }

  async handleConnect(conn) {
    if (!this.users.has(conn.id) && this.users.size >= MAX_USERS) {
      conn.reject(4001, 'Sala cheia. Esta consulta já tem dois participantes.');
      return;
    }
    if (!this.users.has(conn.id)) {
      this.users.set(conn.id, { seat: this.nextSeat++, role: null });
    }
    conn.send({ type: 'you', seat: this.users.get(conn.id).seat });
    conn.send({ type: 'chat_history', messages: this.chat.slice(-50) });
    this.broadcastPresence();
  }

  async handleMessage(conn, msg) {
    if (typeof msg !== 'object' || msg === null) return;
    const u = this.users.get(conn.id);
    if (!u) return;

    if (msg.type === 'role') {
      u.role = typeof msg.role === 'string' ? msg.role : null;
      this.broadcastPresence();
    } else if (msg.type === 'signal') {
      // Relay WebRTC signaling to the OTHER peer only
      for (const c of this.getConnections()) {
        if (c.id !== conn.id) {
          c.send({ type: 'signal', data: msg.data });
        }
      }
    } else if (msg.type === 'chat') {
      const text = String(msg.text ?? '').slice(0, 1000);
      if (!text) return;
      const entry = { seat: u.seat, role: u.role, text, time: Date.now() };
      this.chat.push(entry);
      if (this.chat.length > 100) this.chat = this.chat.slice(-100);
      this.broadcast({ type: 'chat', message: entry });
    }
  }

  async handleClose(conn) {
    this.users.delete(conn.id);
    this.broadcastPresence();
  }

  broadcastPresence() {
    this.broadcast({
      type: 'presence',
      users: [...this.users.values()].map((u) => ({ seat: u.seat, role: u.role })),
    });
  }
}
