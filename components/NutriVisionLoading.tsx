import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NutriVisionLoading = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Adjust the duration as needed

    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5
      }
    }
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        delay: 1
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="w-32 h-32 mb-8"
        variants={logoVariants}
      >
        <img
          src="/path/to/nutrivision-logo.png"
          alt="NutriVision Logo"
          className="w-full h-full object-contain"
        />
      </motion.div>
      <motion.h1
        className="text-3xl font-bold text-white mb-4"
        variants={textVariants}
      >
        NutriVision
      </motion.h1>
      <motion.p
        className="text-lg text-gray-300"
        variants={textVariants}
      >
        Visualize Your Nutrition Journey
      </motion.p>
    </motion.div>
  );
};

export default NutriVisionLoading;