"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    watsonAssistantChatOptions?: any;
  }
}

export function IBMWatsonAssistant() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // These should ideally be set in your .env.local file
    const integrationID = process.env.NEXT_PUBLIC_IBM_WATSON_INTEGRATION_ID;
    const region = process.env.NEXT_PUBLIC_IBM_WATSON_REGION || "us-south";
    const serviceInstanceID = process.env.NEXT_PUBLIC_IBM_WATSON_SERVICE_INSTANCE_ID;

    if (!integrationID || !serviceInstanceID) {
      console.warn("IBM Watson Assistant (BOB): Missing Integration ID or Service Instance ID in environment variables. Chatbot will not load.");
      return;
    }

    window.watsonAssistantChatOptions = {
      integrationID: integrationID,
      region: region,
      serviceInstanceID: serviceInstanceID,
      onLoad: async (instance: any) => {
        await instance.render();
      }
    };

    setTimeout(function() {
      const t = document.createElement('script');
      t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
        (window.watsonAssistantChatOptions.clientVersion || 'latest') +
        "/WatsonAssistantChatEntry.js";
      document.head.appendChild(t);
    });
  }, []);

  return null;
}
