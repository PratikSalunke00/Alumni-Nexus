import { useEffect, useRef } from "react";
import axios from "axios";

const GoogleSignInButton = ({
  action,
  role,
  registrationData = {},
  onSuccess,
  onError,
}) => {
  const buttonRef = useRef(null);
  const latestProps = useRef({});

  latestProps.current = {
    action,
    role,
    registrationData,
    onSuccess,
    onError,
  };

  useEffect(() => {
    let cancelled = false;

    const initializeGoogleButton = () => {
      if (cancelled || !buttonRef.current) return;

      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        latestProps.current.onError?.(
          "VITE_GOOGLE_CLIENT_ID is missing from client/.env",
        );
        return;
      }

      if (!window.google?.accounts?.id) return;

      buttonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

        callback: async (googleResponse) => {
          try {
            const current = latestProps.current;

            const response = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`,
              {
                credential: googleResponse.credential,
                action: current.action,
                role: current.role,
                ...(current.action === "register"
                  ? current.registrationData
                  : {}),
              },
            );

            current.onSuccess?.({
              ...response.data,
              googleCredential: googleResponse.credential,
            });
          } catch (error) {
            const message =
              error.response?.data?.message ||
              "Google authentication failed. Please try again.";

            latestProps.current.onError?.(message);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: action === "register" ? "continue_with" : "continue_with",
        shape: "rectangular",
        width: 300,
        logo_alignment: "left",
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (window.google?.accounts?.id) {
      initializeGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", initializeGoogleButton);
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      script.onerror = () => {
        latestProps.current.onError?.(
          "Could not load Google Sign-In. Check your internet connection.",
        );
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;

      if (existingScript) {
        existingScript.removeEventListener("load", initializeGoogleButton);
      }
    };
  }, []);

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
    </div>
  );
};

export default GoogleSignInButton;
