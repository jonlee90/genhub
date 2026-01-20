"use client";

import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  duration?: number;
  delay?: number;
}

export function TextGenerateEffect({
  words,
  className,
  duration = 0.5,
  delay = 0,
}: TextGenerateEffectProps) {
  const wordsArray = words.split(" ");

  return (
    <div className={cn("space-y-2", className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className="inline-block mr-1"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{
            delay: delay + idx * 0.05,
            duration: duration,
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
