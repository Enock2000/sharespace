"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BackgroundSliderProps {
    images: string[];
    duration?: number; // duration in ms
}

export function BackgroundSlider({ images, duration = 6000 }: BackgroundSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, duration);

        return () => clearInterval(interval);
    }, [images.length, duration]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {images.map((src, index) => (
                <div
                    key={src}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <Image
                        src={src}
                        alt="Background"
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                    {/* Overlay gradient for readability */}
                    <div className="absolute inset-0 bg-[#0a0a1a]/80" />
                </div>
            ))}
        </div>
    );
}
