import React from 'react'

function Button({ title, size = "sm", varient = "primary", onClick, type = "button" }) {
  const size_classes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-lg",
    xsm: "px-0 py-0.5 text-xs "
  };

  const variant_classes = {
    primary: "bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-400",
    secondary: "bg-sky-500 text-white hover:bg-gray-600 focus:ring-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
    outline: "border border-sky-500 text-sky-500 hover:bg-sky-50 focus:ring-sky-400",
    pink: "bg-sky-600 text-white hover:bg-sky-700"
  };

  return (
    <div>
      <button
        type={type}
        className={`px-6  bg-sky-500 text-white font-semibold rounded-lg 
             hover:bg-sky-600 transition duration-200 
             focus:outline-none focus:ring-2 focus:ring-sky-400 ${size_classes[size]} ${variant_classes[varient]}`}
        onClick={onClick}
      >
        {title}
      </button>
    </div>
  )
}

export default Button