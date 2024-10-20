import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const HorizontalStickyScroll = ({ content, contentClassName }) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef(null);
  const { scrollXProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });

  const cardLength = content.length;

  useMotionValueEvent(scrollXProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce((acc, breakpoint, index) => {
      const distance = Math.abs(latest - breakpoint);
      if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
        return index;
      }
      return acc;
    }, 0);
    setActiveCard(closestBreakpointIndex);
  });

  const backgroundColors = [
    "var(--slate-900)",
    "var(--black)",
    "var(--neutral-900)",
  ];
  const linearGradients = [
    "linear-gradient(to right, var(--cyan-500), var(--emerald-500))",
    "linear-gradient(to right, var(--pink-500), var(--indigo-500))",
    "linear-gradient(to right, var(--orange-500), var(--yellow-500))",
  ];

  const [backgroundGradient, setBackgroundGradient] = useState(linearGradients[0]);

  useEffect(() => {
    setBackgroundGradient(linearGradients[activeCard % linearGradients.length]);
  }, [activeCard]);

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="h-[30rem] overflow-x-auto flex items-center relative space-y-10 rounded-md p-10"
      ref={ref}
    >
      <div className="flex items-center space-x-20 px-4">
        {content.map((item, index) => (
          <div key={item.title + index} className="min-w-[300px]">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              className="text-2xl font-bold text-slate-100"
            >
              {item.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: activeCard === index ? 1 : 0.3 }}
              className="text-kg text-slate-300 max-w-sm mt-4"
            >
              {item.description}
            </motion.p>
          </div>
        ))}
      </div>
      <div
        style={{ background: backgroundGradient }}
        className={cn(
          "hidden lg:block h-60 w-80 rounded-md bg-white sticky left-[calc(50%-10rem)] overflow-hidden",
          contentClassName
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
};

export function HorizontalStickyScrollDemo() {
  const content = [
    {
      title: "Welcome to CyberGuard",
      description: "Let's get started with securing your digital infrastructure. Follow this quick onboarding process to set up your account and begin your cybersecurity journey.",
      content: (
        <div className="h-full w-full bg-[linear-gradient(to_right,var(--cyan-500),var(--emerald-500))] flex items-center justify-center text-white">
          Welcome! 👋
        </div>
      ),
    },
    {
      title: "Upload Documents",
      description: "Start by uploading your infrastructure documents. This helps us understand your current setup and identify potential vulnerabilities.",
      content: (
        <div className="h-full w-full bg-[linear-gradient(to_right,var(--pink-500),var(--indigo-500))] flex items-center justify-center text-white">
          📁 Upload
        </div>
      ),
    },
    {
      title: "Answer Questions",
      description: "Next, you'll answer a series of questions about your infrastructure. This helps us tailor our analysis to your specific needs and environment.",
      content: (
        <div className="h-full w-full bg-[linear-gradient(to_right,var(--orange-500),var(--yellow-500))] flex items-center justify-center text-white">
          💬 Q&amp;A
        </div>
      ),
    },
    {
      title: "Review Results",
      description: "After processing your information, we'll provide you with a comprehensive risk assessment and vulnerability report. This will help you understand your current security posture.",
      content: (
        <div className="h-full w-full bg-[linear-gradient(to_right,var(--cyan-500),var(--emerald-500))] flex items-center justify-center text-white">
          📊 Results
        </div>
      ),
    },
    {
      title: "Take Action",
      description: "Based on the results, we'll provide actionable recommendations to improve your cybersecurity. You can track your progress and continuously improve your security stance.",
      content: (
        <div className="h-full w-full bg-[linear-gradient(to_right,var(--pink-500),var(--indigo-500))] flex items-center justify-center text-white">
          🛡️ Secure
        </div>
      ),
    },
  ];

  return (
    <div className="p-10">
      <HorizontalStickyScroll content={content} />
    </div>
  );
}

export default HorizontalStickyScrollDemo;