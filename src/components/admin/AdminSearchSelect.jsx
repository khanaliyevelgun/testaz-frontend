"use client";

import { useEffect, useRef, useState } from "react";

const AdminSearchSelect = ({
  label,
  value,
  selectedLabel = "",
  placeholder = "Search...",
  loadingText = "Loading...",
  emptyText = "No results found.",
  disabled = false,
  required = false,
  loadOptions,
  onChange,
  minWidthClass = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || disabled) return;

    let isMounted = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      Promise.resolve(loadOptions?.(search) || [])
        .then((items) => {
          if (isMounted) setOptions(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          if (isMounted) setOptions([]);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [disabled, isOpen, loadOptions, search]);

  const selectedText = selectedLabel || (value ? `#${value}` : "");

  return (
    <div className={`position-relative ${minWidthClass}`} ref={wrapperRef}>
      {label ? <label className='text-14 text-neutral-500 fw-medium mb-8'>{label}</label> : null}
      <button
        type='button'
        className='common-input rounded-pill text-start d-flex align-items-center justify-content-between gap-8 bg-white'
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className={selectedText ? "text-neutral-500" : "text-neutral-300"}>{selectedText || placeholder}</span>
        <i className='ph ph-caret-down text-neutral-400'></i>
      </button>
      {required ? <input className='d-none' tabIndex='-1' value={value || ""} onChange={() => {}} required /> : null}
      {isOpen ? (
        <div className='position-absolute bg-white border border-neutral-30 rounded-12 shadow-md p-8 mt-4 w-100 z-3'>
          <input
            className='common-input rounded-pill mb-8'
            placeholder={placeholder}
            value={search}
            autoFocus
            onChange={(event) => setSearch(event.target.value)}
          />
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {value ? (
              <button
                type='button'
                className='w-100 text-start px-12 py-8 rounded-8 text-14 text-neutral-500 bg-white'
                onClick={() => {
                  onChange?.("", "");
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                Clear selection
              </button>
            ) : null}
            {isLoading ? <div className='px-12 py-8 text-14 text-neutral-400'>{loadingText}</div> : null}
            {!isLoading && !options.length ? <div className='px-12 py-8 text-14 text-neutral-400'>{emptyText}</div> : null}
            {options.map((option) => (
              <button
                type='button'
                className='w-100 text-start px-12 py-8 rounded-8 text-14 text-neutral-500 bg-white'
                key={`${option.value}`}
                onClick={() => {
                  onChange?.(String(option.value), option.label, option);
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminSearchSelect;
