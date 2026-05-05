import React, { useEffect, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

export const GlobalOrderNotifier: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useUI();
  const knownOrders = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!profile || (profile.role !== "cashier" && profile.role !== "admin")) return;

    const q = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let hasNewOrder = false;

      snapshot.docs.forEach(doc => {
        if (!knownOrders.current.has(doc.id)) {
          knownOrders.current.add(doc.id);
          if (!isFirstLoad.current) {
            hasNewOrder = true;
          }
        }
      });

      if (hasNewOrder) {
        // Play sound using Web Audio API to avoid needing static assets
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1);
          }
        } catch (e) {
          console.warn("Audio play failed, user may not have interacted with the document yet.");
        }

        showToast("New Incoming Order!", "success");
      }

      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, [profile, showToast]);

  return null;
};
