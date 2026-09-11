"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

// Define the shape of the Watson Assistant instance
interface WatsonAssistantInstance {
  render: () => Promise<void>;
  on: (event: string, handler: (e: any) => void) => void;
  // Add other methods as needed from the Watson Assistant API
}

declare global {
  interface Window {
    watsonAssistantChatOptions?: {
      integrationID: string;
      region: string;
      serviceInstanceID: string;
      onLoad: (instance: WatsonAssistantInstance) => Promise<void>;
      clientVersion?: string;
    };
  }
}

export function IBMWatsonAssistant() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const integrationID = process.env.NEXT_PUBLIC_IBM_WATSON_INTEGRATION_ID;
    const region = process.env.NEXT_PUBLIC_IBM_WATSON_REGION || "us-south";
    const serviceInstanceID = process.env.NEXT_PUBLIC_IBM_WATSON_SERVICE_INSTANCE_ID;

    if (!integrationID || !serviceInstanceID) {
      console.warn("IBM Watson Assistant (BOB): Missing Integration ID or Service Instance ID in environment variables. Chatbot will not load.");
      return;
    }

    // Configure the global options before the script is loaded
    window.watsonAssistantChatOptions = {
      integrationID,
      region,
      serviceInstanceID,
      onLoad: async (instance: WatsonAssistantInstance) => {
        try {
          await instance.render();
        } catch (error) {
          console.error("IBM Watson Assistant failed to render:", error);
        }
      }
    };

    // Trigger the script load
    setShouldLoad(true);
  }, []);

  if (!shouldLoad) return null;

  const version = window.watsonAssistantChatOptions?.clientVersion || "latest";
  const scriptSrc = `https://web-chat.global.assistant.watson.appdomain.cloud/versions/${version}/WatsonAssistantChatEntry.js`;

  return <Script src={scriptSrc} strategy="afterInteractive" />;
}
