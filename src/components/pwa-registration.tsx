"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegistration() {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(display-mode: standalone)").matches
            || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    });
    const [isIos] = useState(() => {
        if (typeof window === "undefined") return false;
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
            || (navigator.maxTouchPoints > 1 && /macintosh/i.test(window.navigator.userAgent));
    });
    const [showIosHelp, setShowIosHelp] = useState(false);
    const [isDismissed, setIsDismissed] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem("ncc_install_prompt_dismissed") === "true";
    });

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((err) => {
                    console.error("Service Worker registration failed:", err);
                });
        }

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }, []);

    if (isStandalone || isDismissed || (!installEvent && !isIos)) return null;

    const install = async () => {
        if (installEvent) {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === "accepted") setInstallEvent(null);
            return;
        }
        setShowIosHelp((visible) => !visible);
    };

    const dismiss = () => {
        window.localStorage.setItem("ncc_install_prompt_dismissed", "true");
        setIsDismissed(true);
    };

    return (
        <aside className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[200] mx-auto max-w-md rounded-2xl border border-primary/20 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Install NCC CMS</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                        Add the app to your home screen for quicker access.
                    </p>
                    {showIosHelp && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-slate-300">
                            Tap Share in Safari, then choose <strong>Add to Home Screen</strong>.
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={install}
                    className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                    {installEvent ? "Install" : "How to install"}
                </button>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss install prompt"
                    className="shrink-0 rounded-lg p-2 text-lg leading-none text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                    ×
                </button>
            </div>
        </aside>
    );
}
