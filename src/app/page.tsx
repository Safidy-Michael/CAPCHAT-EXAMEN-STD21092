"use client";

import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    AwsWafCaptcha?: {
      renderCaptcha: (
        container: HTMLElement,
        options: {
          apiKey: string;
          onSuccess: (wafToken: string) => void;
          onError: () => void;
        }
      ) => void;
    };
  }
}

export default function HomePage() {
  const [number, setNumber] = useState<number | "">("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    if (captchaVisible) {
      const captchaScript = document.createElement("script");
      captchaScript.src = "https://09bd26e5e726.eu-west-3.captcha-sdk.awswaf.com/09bd26e5e726/jsapi.js";
      captchaScript.type = "text/javascript";
      captchaScript.defer = true;

      document.head.appendChild(captchaScript);

      captchaScript.onload = () => {
        const container = document.getElementById("captcha-container");
        if (window.AwsWafCaptcha && container) {
          window.AwsWafCaptcha.renderCaptcha(container, {
            apiKey: process.env.API_KEY as string,
            onSuccess: (token: string) => {
              setCaptchaToken(token);
              setCaptchaVisible(false); 
            },
            onError: () => {
              console.error("Erreur CAPTCHA");
            },
          });
        } else {
          console.error("Captcha SDK introuvable");
        }
      };

      return () => {
        document.head.removeChild(captchaScript);
      };
    }
  }, [captchaVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof number === "number" && number >= 1 && number <= 1000) {
      setLoading(true);
      const newSequence: string[] = [];

      for (let i = 1; i <= number; i++) {
        try {
          const response = await fetch("https://api.prod.jcloudify.com/whoami", {
            method: "GET",
            headers: captchaToken
              ? {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${captchaToken}`,
                }
              : undefined,
          });

          if (response.status === 403) {
            newSequence.push(`${i}. Forbidden`);
          } else if (response.status === 405) {
            setCaptchaVisible(true); 
            await new Promise((resolve) => {
              const interval = setInterval(() => {
                if (!captchaVisible) {
                  clearInterval(interval);
                  resolve(null);
                }
              }, 500); 
            });
            i--; 
          } else {
            newSequence.push(`${i}. ${response.statusText}`);
          }
        } catch  {
          newSequence.push(`${i}. Error`);
        }

        setSequence([...newSequence]);
        await new Promise((resolve) => setTimeout(resolve, 1000)); 
      }

      setLoading(false);
    } else {
      alert("Veuillez entrer un nombre valide entre 1 et 1 000 !");
    }
  };

  return (
    <div>
      {sequence.length === 0 ? (
        <form onSubmit={handleSubmit}>
          <label htmlFor="number-input">Entrée : un nombre N entre 1 et 1 000</label>
          <input
            id="number-input"
            type="number"
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            min={1}
            max={1000}
            required
          />
          <button type="submit" disabled={loading}>
            Soumettre
          </button>
        </form>
      ) : (
        <div>
          {sequence.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      )}

      {captchaVisible && (
        <div id="captcha-container" style={{ marginTop: "20px" }}>
          <p>Veuillez résoudre le CAPTCHA pour continuer.</p>
        </div>
      )}
    </div>
  );
}
