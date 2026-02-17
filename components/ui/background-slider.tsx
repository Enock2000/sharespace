"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BackgroundSliderProps {
    images: string[];
    duration?: number; // duration in ms
}

export function BackgroundSlider({ images, duration = 7000 }: BackgroundSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(-1);

    useEffect(() => {
        const interval = setInterval(() => {
            setPrevIndex(currentIndex);
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, duration);

        return () => clearInterval(interval);
    }, [images.length, duration, currentIndex]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {images.map((src, index) => {
                const isActive = index === currentIndex;
                const isPrev = index === prevIndex;

                return (
                    <div
                        key={src}
                        className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${isActive ? "opacity-100" : isPrev ? "opacity-0" : "opacity-0"
                            }`}
                        style={{
                            animation: isActive ? `kenBurns ${duration + 2000}ms ease-in-out forwards` : undefined,
                        }}
                    >
                        <Image
                            src={src}
                            alt="Background"
                            fill
                            className="object-cover"
                            priority={index === 0}
                            sizes="100vw"
                            quality={90}
                        />
                        {/* Multi-layer overlay — adapts to light/dark theme */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-white/20 to-white/30 dark:from-[#0a0a1a]/70 dark:via-[#0a0a1a]/80 dark:to-[#0a0a1a]/90" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 dark:from-[#0a0a1a]/60 dark:via-transparent dark:to-[#0a0a1a]/60" />
                    </div>
                );
            })}

            {/* Slide indicator dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                {images.map((_, index) => (
                    <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-700 ${index === currentIndex
                            ? "w-8 bg-gradient-to-r from-indigo-400 to-purple-400"
                            : "w-2 bg-white/20 hover:bg-white/40"
                            }`}
                    />
                ))}
            </div>

            {/* Ken Burns keyframe animation */}
            <style jsx global>{`
                @keyframes kenBurns {
                    0% {
                        transform: scale(1) translateX(0);
                    }
                    100% {
                        transform: scale(1.08) translateX(-1%);
                    }
                }
            `}</style>
        </div>
    );
}
