import { db } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";

import { CALL_API_BASE } from "./callApi";

const STATUS_API_BASE = CALL_API_BASE + "/api";

export const statusService = {
  subscribeActiveStatuses(callback: (statuses: any[]) => void) {
    const now = new Date();
    const q = query(
      collection(db, "statuses"),
      where("expiresAt", ">", now.toISOString())
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(s => s.deleted === false);
      callback(data);
    });
  },

  async getActiveStatuses() {
    const now = new Date();
    const q = query(
      collection(db, "statuses"),
      where("expiresAt", ">", now.toISOString())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(s => s.deleted === false);
  },

  async createStatus(data: any) {
    return await addDoc(collection(db, "statuses"), {
      ...data,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      deleted: false,
      viewers: [],
      reactions: []
    });
  },

  async deleteStatus(statusId: string) {
    const statusRef = doc(db, "statuses", statusId);
    return await updateDoc(statusRef, { deleted: true });
  }
};
