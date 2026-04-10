"use client";

import React, { useEffect } from "react";

/**
 * Watermark component for clone/harvest protection.
 * Implements subtle, obfuscated attribution to prove authorship.
 * 
 * "SUO Aditya Singh, NER Dte."
 */
export function Watermark() {
    useEffect(() => {
        // Platform Signature in Console
        console.log(
            "%c NCC RGU Management System %c Powered by SUO Aditya Singh, NER Dte. ",
            "color: #fff; background: #2563eb; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;",
            "color: #fff; background: #0f172a; padding: 4px 8px; border-radius: 0 4px 4px 0;"
        );
    }, []);

    // Encoded attribution strings (ROT13 for 'SUO Aditya Singh, NER Dte.')
    // S -> F, U -> H, O -> B ...
    // Actually, I'll just use a hidden span with a recognizable but slightly obscured class/id.
    
    return (
        <div 
            id="_v_attribution_layer_" 
            className="hidden pointer-events-none select-none" 
            aria-hidden="true"
            data-engine-origin="CaptainCheetah978"
            data-auth-signature="FHB Nqvgl n Fvatu, ARE Qgr."
            data-github-source="https://github.com/CaptainCheetah978"
        >
            <span>Author: SUO Aditya Singh (https://github.com/CaptainCheetah978)</span>
            <span>Platform: NCC-CMS</span>
            <span>License: Apache 2.0</span>
        </div>
    );
}
