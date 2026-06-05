"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const RouteScrollToTop = () => {
  const pathname = usePathname();
  const progressWrapRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const progressWrap = progressWrapRef.current;
    const progressPath = progressWrap?.querySelector("path");

    if (!progressWrap || !progressPath) {
      return;
    }

    const pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "none";
    progressPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 10ms linear";

    const updateProgress = () => {
      const scroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        height > 0 ? pathLength - (scroll * pathLength) / height : pathLength;
      progressPath.style.strokeDashoffset = progress;
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);

    const handleScroll = () => {
      if (window.scrollY > 50) {
        progressWrap.classList.add("active-progress");
      } else {
        progressWrap.classList.remove("active-progress");
      }
    };

    window.addEventListener("scroll", handleScroll);

    const handleClick = (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    progressWrap.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("scroll", handleScroll);
      progressWrap.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <div className='progress-wrap' ref={progressWrapRef}>
        <svg
          className='progress-circle svg-content'
          width='100%'
          height='100%'
          viewBox='-1 -1 102 102'
        >
          <path d='M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98' />
        </svg>
      </div>
    </>
  );
};

export default RouteScrollToTop;
